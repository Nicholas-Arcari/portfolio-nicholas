La Lezione 6 passa in rassegna gli strumenti e le tecniche per trovare i difetti di sicurezza: le tre famiglie (analisi statica, dinamica e ibrida) più gli strumenti operativi, il vocabolario di misura con cui si giudica uno strumento (veri e falsi positivi e negativi, precision, recall, ROC), i principali approcci di analisi statica (scanner testuali, taint propagation, type checker), l'analisi dinamica (fuzzing), i metodi ibridi (testing concolico, penetration testing) e la lezione organizzativa che uno strumento non serve a nulla senza persone formate ("fool with a tool"). Le slide sono 39 (adattate da David A. Wheeler, CC BY-SA 3.0). Alcune slide riportano un secondo numero di pagina interno, del mazzo originale; qui si usa il numero progressivo della slide.

## Tipi di analisi e misure (pagine 2-6)

### Slide 2 · Outline (indice)

> - Types of analysis (static/dynamic/hybrid) - Some measurement terminology
> - Static analysis
> - Dynamic analysis (fuzz testing)
> - Hybrid analysis
> - Operational
> - Fool with a tool
> - SWAMP
> - Adopting tools

**Approfondimento.** Il percorso della lezione. ("SWAMP" è il *Software Assurance Marketplace*, una piattaforma online gratuita e aperta, finanziata dal DHS statunitense, che permette agli sviluppatori di eseguire molti strumenti di analisi statica sul proprio codice in un solo posto; compare nell'indice ma in questo mazzo non ha una slide dedicata.)

### Slide 3 · Types of analysis

> - Static analysis: Approach for verifying software (including finding defects) without executing software - Source code vulnerability scanning tools, code inspections, etc.
> - Dynamic analysis: Approach for verifying software (including finding defects) by executing software on specific inputs and checking results ("oracle") - Functional testing, fuzz testing, etc.
> - Hybrid analysis: Combine above approaches
> - Operational: Tools in operational setting - Minimize risks, report information back, etc. - may be static, dynamic, hybrid; often dynamic

**Approfondimento.** La divisione fondamentale:

- L'**analisi statica** esamina il programma *senza eseguirlo* (il sorgente, il bytecode o il binario): compilatori, type checker, revisione del codice e scanner di sicurezza. In linea di principio può ragionare su *tutti* i percorsi, ma deve approssimare, quindi produce falsi allarmi.
- L'**analisi dinamica** *esegue* il programma su input scelti e controlla i risultati. Il componente che decide se una data esecuzione è corretta o difettosa si chiama **oracolo**. Vede solo i percorsi effettivamente eseguiti, quindi può dimostrare la *presenza* di un bug (un crash osservato) ma mai la sua *assenza* (Lezione 1, slide 32).
- L'**analisi ibrida** combina le due (per esempio il testing concolico, slide 30).
- Gli strumenti **operativi** girano sul sistema *in esercizio* (logging, rilevamento delle intrusioni, sandboxing); di solito sono dinamici.

### Slide 4 · Basic measurement terminology

![Lezione 6, pagina 4](L06_p04.webp "50% 1400x543")

**Figura.** Una tabella (matrice di confusione) dei possibili esiti di uno strumento:

| Segnalazione dello strumento | Segnalazione corretta | Segnalazione sbagliata |
| --- | --- | --- |
| Ha segnalato un difetto | **True positive (TP)**: ha segnalato correttamente un difetto | **False positive (FP)**: ha segnalato un "difetto" che non lo è ("errore di tipo I") |
| Non ha segnalato un difetto (lì) | **True negative (TN)**: correttamente non ha segnalato un (certo) difetto | **False negative (FN)**: non ha segnalato un difetto che esiste ("errore di tipo II") |

> - False positive rate, FPR = #FP/(#TN+#FP) - "Probability alert is false"
> - True positive rate, TPR = #TP/(#TP + #FN) - "% vulnerabilities found" (sensitivity)
> - Developers worry about large false positive rate (FPR) - "Tool report wasted my time"
> - Auditors worry about small or <100% TPR for a given category - "Tool missed something important"

**Approfondimento.** Questo vocabolario è essenziale per giudicare qualunque strumento di sicurezza (e qualunque classificatore):

- **TP**: bug reale, segnalato correttamente. **FP**: falso allarme (segnala qualcosa di innocuo). **TN**: resta giustamente in silenzio su ciò che non è un bug. **FN**: un bug reale *mancato*, l'esito più pericoloso per la sicurezza, perché dà una falsa sicurezza.
- L'**FPR** (false positive rate) misura quanto rumore produce lo strumento; il **TPR** (true positive rate, detto anche *sensitivity* o *recall*) misura quale frazione dei bug reali coglie.
- La tensione fra i due tipi di stakeholder è centrale: gli **sviluppatori** detestano i falsi positivi (tempo sprecato a smistare non-bug, che porta a ignorare lo strumento), mentre **auditor e sicurezza** detestano i falsi negativi (una vulnerabilità sfuggita). Uno strumento troppo rumoroso viene spento; uno troppo silenzioso dà una falsa sensazione di sicurezza. Ogni strumento deve trovare un equilibrio.

### Slide 5 · Receiver Operating Characteristic (ROC) curve

![Lezione 6, pagina 5](L06_p05.webp "44% 792x905")

**Figura.** Una curva ROC d'esempio (da Wikipedia): il true positive rate (asse y) in funzione del false positive rate (asse x), con le curve di più classificatori che si inarcano sopra la diagonale.

> - Binary classifiers must generally trade off between FP rates and TP rates - To get more reports (larger TP rate), must accept larger FP rate - What's more important to you, low FP rate or high TP rate?
> - ROC curve (from WW II) graphically illustrates this
> - Don't normally know the true values for given tools, but effect is still pronounced - Tool developer focus - Tool users can configure tool to affect trade-off

**Approfondimento.** Uno strumento è un **classificatore binario** (bug / non bug), e c'è un **compromesso** inevitabile: fargli segnalare di più (cogliendo più bug reali, TPR più alto) gli fa inevitabilmente anche dare più falsi allarmi (FPR più alto). La **curva ROC** (Receiver Operating Characteristic, nata con gli operatori radar della Seconda guerra mondiale che dovevano decidere "quel puntino è un aereo?") traccia il TPR in funzione dell'FPR al variare della soglia di sensibilità dello strumento. Una curva che si inarca verso l'angolo in alto a sinistra è un classificatore migliore; la diagonale è il tirare a indovinare. Il punto pratico: di solito non si può conoscere la ROC esatta di uno strumento, ma si *può* configurare la maggior parte degli strumenti per muoversi lungo questo compromesso (segnalare di più e tollerare il rumore, o segnalare di meno e rischiare di mancare bug), scegliendo il punto di lavoro in base a che cosa fa più male, i falsi positivi o i falsi negativi.

### Slide 6 · Measurement roll-ups

![Lezione 6, pagina 6](L06_p06.webp "29% 514x1143")

**Figura.** Un diagramma di Venn di precision e recall (elementi recuperati e rilevanti), da Wikipedia.

> - Precision (positive predictive value) = #TP/(#TP+#FP) - can be seen as a measure of quality
> - Recall (sensitivity, soundness, find rate) = #TP/(#TP+#FN) - measure of quantity, % vulnerabilities found
> - F-score (harmonic mean) = 2 x (Precision x Recall) / (Precision + Recall)
> - Discrimination rate = #Discriminations / #Test\_Pairs - Given a pair of tests (one with defect, one without), Discrimination occurs if tool correctly reports flaw (TP) in test with flaw AND does not when there is no flaw (TN)
> - All these values 0..1, where higher is better

**Approfondimento.** Le misure riassuntive che combinano i quattro conteggi:

- **Precision** = TP/(TP+FP): di tutto ciò che lo strumento ha *segnalato*, quale frazione erano bug reali. Precision alta = poco rumore (una misura di qualità). A un auditor che legge i rapporti interessa questa.
- **Recall** = TP/(TP+FN): di tutti i bug *reali*, quale frazione ha trovato lo strumento (coincide con TPR/sensitivity; detta anche *soundness* o tasso di ritrovamento). Recall alta = pochi bug mancati (una misura di quantità).
- C'è tensione: alzare la recall (segnalare di più) di solito abbassa la precision (più falsi allarmi).
- **F-score** = la media armonica di precision e recall, un solo numero che le bilancia (la media armonica penalizza uno strumento bravo in una e scarso nell'altra).
- **Discrimination rate**: una misura di benchmark più equa. Si dà allo strumento una *coppia* di programmi di test quasi identici, uno con un difetto inserito apposta e uno senza; lo strumento "discrimina" solo se segnala quello difettoso (TP) **e** resta in silenzio su quello pulito (TN). Premia gli strumenti che capiscono davvero il difetto rispetto a quelli che segnalano lo schema ovunque. (Dal NIST CAS Static Analysis Tool Study, 2011.)

## Analisi statica (pagine 8-20)

La pagina 7 è il divisore di sezione "Static Analysis".

### Slide 8 · Source vs. Executables

> - Source code pros: Provides much more context; executable-only tools can miss important information - Can examine variable names and comments (can be very helpful!) - Can fix problems found (hard with just executable) - Difficult to decompile code
> - Source code cons: Can mislead tools - executable runs, not source (if there's a difference) - Often cannot get source for proprietary off-the-shelf programs (Can get for open source software; Often can get for custom)
> - Bytecode is somewhere between

**Approfondimento.** Conta che cosa analizza lo strumento.

- **Analizzare il sorgente** dà un *contesto* ricco: nomi delle variabili e commenti (indizi sull'intenzione), struttura, e la possibilità di *correggere* davvero il bug (un binario non si corregge facilmente). Decompilare un binario in un sorgente leggibile è difficile e si perde informazione.
- **I contro del sorgente**: il compilatore può trasformare il sorgente in modo che l'*eseguibile* si comporti diversamente da come il sorgente lascia intendere (ottimizzazioni che tolgono un controllo, Lezione 2, slide 13), quindi l'analisi del sorgente può non vedere bug a livello di binario; e spesso il sorgente del software di terze parti o proprietario semplicemente non si può avere (mentre il codice open source e quello interno sono disponibili).
- Il **bytecode** (i `.class` di Java, l'IL di .NET) sta a metà: più strutturato e più analizzabile del codice macchina grezzo, ma più vicino del sorgente a ciò che viene davvero eseguito.

### Slide 9 · (Some) Static analysis approaches

> - Human analysis (including peer reviews)
> - Type checkers
> - Compiler warnings
> - Style checkers / defect finders / quality scanners
> - Security analysis: Security weakness analysis - text scanners; Security weakness analysis - beyond text scanners
> - Property checkers
> - Knowledge extraction
> - formal methods (separately)

**Approfondimento.** L'analisi statica è uno spettro che va dall'economico e superficiale al costoso e profondo: **revisione umana** (la migliore sul contesto, scarsa sulla scala), **type checker** e **avvisi del compilatore** (integrati, economici), **scanner di stile e qualità** (PMD, FindBugs), **scanner di sicurezza** (semplici scanner testuali come Flawfinder, e strumenti più profondi sul flusso dei dati), **property checker** (verificano proprietà specifiche), **estrazione di conoscenza** (capire grandi basi di codice) e **metodi formali** (dimostrare la correttezza, Lezione 7). Le slide successive scendono lungo questo elenco.

### Slide 10 · Human (manual) analysis

> - Humans are great at discerning context and intent
> - Get bored and overwhelmed
> - Expensive - Especially if analyzing executables
> - Can be one person, e.g., "desk-checking"
> - Peer reviews - Inspections: Special way to use group, defined roles including "reader"; see IEEE standard 1028
> - Can focus on specific issues - e.g., "Is everything that's supposed be authenticated covered by authentication processes?"

**Approfondimento.** Le persone **capiscono il contesto e l'intenzione** come nessuno strumento, e colgono i difetti di progettazione e di logica che gli strumenti non vedono. Ma su codice grande le persone si **annoiano e si sentono sopraffatte**, e la revisione è **costosa** (peggio ancora sui binari). Le forme vanno da una persona che *verifica a tavolino* il proprio codice alla **revisione fra pari** strutturata e alle **ispezioni** formali (con ruoli definiti, compreso un *lettore* che parafrasa il codice, secondo IEEE 1028). La revisione è più efficace quando è **mirata** a una domanda precisa ("ogni operazione sensibile sta davvero dietro l'autenticazione?") invece che aperta.

### Slide 11 · Automated tool limitations

> - Tools typically don't "understand": System architecture; System mission/goal; Technical environment; Human environment
> - Except for formal methods… Most have significant FP and/or FN rates
> - Best when part of a process to develop secure software, not as the only mechanism

**Approfondimento.** Agli strumenti automatici manca la *comprensione*: non conoscono l'architettura del sistema, la sua missione (che cosa conta) né il suo ambiente tecnico e umano, quindi non possono giudicare se un problema segnalato conta davvero, né accorgersi di un difetto di progettazione che viola la missione. Tranne i metodi formali (che dimostrano proprietà ma costano), gli strumenti hanno tassi significativi di falsi positivi e/o falsi negativi. Da qui il messaggio ricorrente del corso: uno strumento è **una parte di un processo di sviluppo sicuro, non il processo intero** (Lezione 1, slide 44).

### Slide 12 · Automated tool limitations (l'architettura di uno strumento)

![Lezione 6, pagina 12](L06_p12.webp "50% 1400x881")

**Figura.** Un diagramma di flusso dei dati di un tipico strumento di analisi statica. Gli ingressi a sinistra, **Source code**, **Build instructions**, **Byte code**, **Executable**, più le **Modeling rules** (versione del compilatore, ambiente, che cosa è fidato) e la **Library/framework config**, alimentano un **Parser/Extractor**. Questo produce un'**Intermediate Representation (IR)** conservata in un **database**. Gli **Analyzers** (al plurale) eseguono **queries** sull'IR, guidati da **built-in query rules** e **user rules**, e alimentano un **Results Viewer**. Una nota dice che l'IR può essere specifica di uno strumento, di un compilatore (LLVM, gcc), di un linguaggio (ASIS) o di uno standard (KDM).

**Approfondimento.** È l'**architettura** standard di uno strumento di analisi statica serio, utile da conoscere a livello concettuale: (1) un front-end **parser/extractor** acquisisce il codice (sorgente, bytecode o binario) più la configurazione (quale compilatore, che cosa è fidato) e costruisce una **rappresentazione intermedia (IR)**, un modello normalizzato del programma conservato in un database; (2) uno o più **analizzatori** eseguono **query/regole** sull'IR, alcune integrate, altre scritte dall'utente per codificare politiche specifiche del progetto; (3) un **visualizzatore dei risultati** presenta le segnalazioni da smistare. L'IR è la chiave: permette di riusare l'analisi su più linguaggi e permette agli utenti di aggiungere regole proprie. La qualità delle *modeling rules* (che cosa lo strumento presume sull'ambiente e sulla fiducia) determina in gran parte i tassi di falsi positivi e negativi.

### Slide 13 · Type checkers

> - Many languages have static type checking built in - Some more rigorous than others - C/C++ not very strong (and must often work around) - Java/C# stronger (interfaces, etc., ease use)
> - Can detect some defects before fielding - Including some security defects - Also really useful in documenting intent
> - Work with type system - be as narrow as you can - Beware diminishing returns

**Approfondimento.** Un **type checker** è un'analisi statica che si ha già gratis: dimostra in compilazione che le operazioni si applicano a tipi compatibili. Sistemi di tipi più forti colgono di più: **C/C++** ha un sistema di tipi debole (conversioni implicite, `void*`, cast, nessun limite nel tipo), che spesso costringe a scappatoie insicure; **Java/C#** sono più forti (niente cast arbitrari fra puntatori, interfacce, generics), il che coglie più difetti, compresi alcuni rilevanti per la sicurezza, e *documenta l'intenzione* (un parametro di tipo `PositiveInt` o `SanitizedString` codifica un contratto). Il consiglio "be as narrow as you can" significa: usare il tipo più specifico che va bene (tipi distinti per concetti distinti), così il compilatore rifiuta più usi sbagliati, ma attenzione ai rendimenti decrescenti (esagerare con il sistema di tipi costa fatica). I linguaggi moderni spingono oltre con tipi che codificano la contaminazione o le unità di misura.

### Slide 14 · PMD vs. FindBugs

> - Both PMD and FindBugs: Focus on "quality" issues, not security; Open source, no cost; Operate on Java
> - PMD: Works on (Java) source code; Examples: Violation of naming conventions, lack of curly braces, misplaced null check, unnecessary constructor, missing break in switch; Also provides Cyclomatic complexity
> - FindBugs: Works on (JVM) bytecode; Examples: equals() method fails on subtypes, clone method may return null, reference comparison of Boolean values, impossible cast, 32bit int shifted by an amount not in the range of 0-31, a collection which contains itself, equals method always returns true
> - Neither good at finding security issues - not their purpose

**Approfondimento.** Due noti analizzatori statici per Java, usati come esempi di scanner di *qualità* (non di sicurezza):

- **PMD** lavora sul **codice sorgente** e segnala problemi di stile e di manutenibilità (nomi, graffe mancanti, controlli di null fuori posto, un `break` mancante in uno `switch`, una classe di bug della Lezione 3) e calcola la *complessità ciclomatica* (una misura di quanti percorsi indipendenti ha un metodo, un indicatore di quanto è difficile testarlo).
- **FindBugs** (oggi continuato come **SpotBugs**) lavora sul **bytecode JVM** e trova schemi di codice probabilmente sbagliati (`equals()` rotta per i sottotipi, un cast che non può mai riuscire, un int a 32 bit spostato di una quantità fuori intervallo, una collezione che contiene se stessa).

Il punto didattico: sono ottimi per la qualità del codice ma **non sono pensati per la sicurezza**, quindi non vanno scambiati per strumenti di sicurezza. Per trovare bug di sicurezza servono strumenti costruiti per quello (slide successive). Si noti che alcuni bug che trovano (uno shift di un int fuori intervallo) hanno rilevanza per la sicurezza, ma la copertura delle vulnerabilità è accidentale.

### Slide 15 · Security defect text scanners

> - Scan source code using simple grep-like lexer - Typically "know" about comments and strings - Look for function calls likely to be problematic
> - Examples: RATS (Rough Auditing Tool for Security); ITS4; Flawfinder (D.A.Wheeler)
> - Pros: Fast and cheap; Can process partial code (including un-compilable code)
> - Cons: Lack of context leads to large FN & FP rates; Useful primarily for warning of "dangerous" functions

**Approfondimento.** Gli analizzatori statici di sicurezza più semplici sono gli **scanner testuali (lessicali)**: in sostanza un `grep` intelligente che divide il sorgente in token (così può saltare commenti e stringhe letterali) e segnala le chiamate a *funzioni notoriamente pericolose* (`gets`, `strcpy`, `sprintf`, `system`, l'elenco della Lezione 3). Esempi: **RATS**, **ITS4**, **Flawfinder** (di David Wheeler, l'autore di queste slide).

- **Pro**: sono molto veloci ed economici, e funzionano su codice *parziale o non compilabile* (non hanno bisogno di costruirlo), il che li rende facili da usare presto e spesso.
- **Contro**: poiché **non capiscono né il contesto né il flusso dei dati**, producono molti falsi positivi (segnalano una `strcpy` sicura di una costante) e falsi negativi (non vedono una chiamata pericolosa fatta attraverso un puntatore a funzione). Vanno intesi come un *promemoria* per rivedere gli usi delle funzioni pericolose, non come un verdetto. (Le slide "fool with a tool" usano proprio Flawfinder per mostrarlo.)

### Slide 16 · Analysis approach: Examining structure / Method calls

> Warn about calls to `gets()`:
>
> `FunctionCall: function is [name == "gets"]`

**Approfondimento.** Questa slide mostra il tipo più semplice di *regola* di analisi: uno schema strutturale sul programma. La regola dice "trova ogni nodo `FunctionCall` la cui funzione chiamata si chiama `gets`, e dai un avviso". È così che uno scanner codifica "avvisa sulle funzioni pericolose": una query sulla struttura analizzata (l'IR della slide 12). Coglie *che* la funzione viene chiamata ma non sa nulla di *se* la chiamata sia davvero insicura nel contesto, da cui i falsi positivi della slide precedente. Regole più ricche (slide successiva) seguono il flusso dei dati, non solo i nomi.

### Slide 17 · Analysis approach: Taint propagation

> - Many tools (static and dynamic) perform "taint propagation" - Input from untrusted users ("sources") considered "tainted" - Warn/forbid sending tainted data to certain methods and constructs ("sinks") - Some operations (e.g., checking) may "untaint" data
> - Static analysis: Follow data flow from sources through program; Determine if tainted data can get to vulnerable "sink"
> - Dynamic analysis (e.g., Perl, Ruby): Variables have "taint" value set when input from some sources; Certain operations (sinks) forbid direct use of tainted data - Counters accidental use of untrusted and unchecked data - esp. useful on injection (SQL, command) and buffer overflow

**Approfondimento.** La **taint propagation (taint analysis)** è la tecnica chiave per trovare i bug di injection, e formalizza direttamente tutto il messaggio delle Lezioni 4-5. Tre ingredienti:

- **Sorgenti**: i punti in cui entrano dati non fidati (letture dalla rete, campi dei moduli, `getenv`, `argv`). I dati che vengono da una sorgente sono marcati come **contaminati**.
- **Propagazione**: la contaminazione scorre nel programma; se dati contaminati vengono copiati, concatenati o derivati, anche il risultato è contaminato.
- **Pozzi** (sink): le operazioni pericolose (una query SQL, `system`, `exec`, una copia in un buffer). Usare dati contaminati in un pozzo viene segnalato o vietato.
- **Sanificatori (decontaminazione)**: i dati validati o con escaping diventano non contaminati, quindi possono arrivare a un pozzo in modo sicuro.

Si può fare **staticamente** (l'analisi del flusso dei dati verifica se una sorgente può raggiungere un pozzo senza passare da un sanificatore, Lezione 7) o **dinamicamente** (il valore porta un bit di contaminazione durante l'esecuzione; il taint mode di Perl e il `$SAFE` di Ruby rifiutano i dati contaminati nei pozzi, Lezione 5, slide 28). È "particolarmente utile per l'injection (SQL, comandi) e il buffer overflow", proprio le vulnerabilità di questo corso, perché sono tutte "dati non fidati che arrivano senza controlli a un pozzo pericoloso".

### Slide 18 · Taint propagation example

```c
buffer = getUntrustedInputFromNetwork(); // Source
copyBuffer(newBuffer, buffer); // Pass-through
exec(newBuffer); // Sink
```

> - Source rule: Function: getUntrustedInputFromNetwork(); Postcondition: return value is tainted
> - Pass-through rule: Function: copyBuffer(); Postcondition: If arg2 tainted, then arg1 tainted
> - Sink rule: Function: exec(); Precondition: arg1 must not be tainted

**Analisi del codice.** Un esempio svolto di taint analysis che mostra i tre tipi di regola che guidano il motore:

- *Regola di sorgente*: `getUntrustedInputFromNetwork()` restituisce dati contaminati, quindi `buffer` è contaminato.
- *Regola di passaggio (propagazione)*: `copyBuffer(dst, src)` copia la contaminazione dal secondo argomento al primo, quindi `newBuffer` diventa contaminato perché lo è `buffer`.
- *Regola di pozzo*: `exec()` richiede che il suo argomento sia **non contaminato**. Poiché `newBuffer` è contaminato e niente l'ha sanificato, lo strumento segnala una vulnerabilità (dati contaminati che arrivano a un pozzo che esegue comandi, una command injection).

È esattamente lo schema di command injection della Lezione 5 espresso come regole. La correzione (aggiungere un passo di validazione che decontamina i dati, o usare un'API sicura) spezzerebbe il percorso dalla sorgente al pozzo e farebbe tacere l'avviso, giustamente. Scrivere buone regole di sorgente, propagazione, pozzo e sanificazione è ciò che rende accurato uno strumento basato sulla contaminazione; dimenticare un percorso di propagazione causa falsi negativi, dimenticare un sanificatore causa falsi positivi.

### Slide 19 · Knowledge Extraction / Program Understanding

> - Create view of software automatically for analysis - Especially useful for large code bases - Visualizes architecture - Enables queries, translation to another language
> - Examples: Hatha Systems' Knowledge Refinery; IBM Rational Asset Analyzer (RAA) \[up-to-date knowledge of application assets from the code, web interface, inventory of mainframe/distributed assets, change-impact analysis, reuse\]; Relativity MicroFocus (COBOL-focused)

**Approfondimento.** Gli strumenti di **estrazione di conoscenza (comprensione dei programmi)** non cercano bug specifici; costruiscono automaticamente una *visione d'insieme* di una base di codice grande, spesso legacy: la sua architettura, i grafi delle chiamate, i flussi di dati e l'inventario degli asset, così che le persone possano capirla, interrogarla, valutare l'impatto di una modifica proposta o migrarla a un altro linguaggio. Conta per la sicurezza perché non si può mettere in sicurezza ciò che non si capisce, e molto codice vulnerabile vive in enormi sistemi vecchi (gli esempi qui riguardano mainframe e patrimoni COBOL). Sostiene l'analisi umana e le attività sul rischio architetturale invece di sostituirle.

### Slide 20 · Source/Byte/Binary code security scanners/analyzers

> - https://www.nist.gov/itl/ssd/software-quality-group/samate/samate-tool-survey - Click on "Source Code Security Analyzers", "Byte Code Scanners", and "Binary Code Scanners"
> - http://www.dwheeler.com/flawfinder

**Approfondimento.** Rimandi a cataloghi degli strumenti disponibili: la rassegna di strumenti **SAMATE** del NIST (Software Assurance Metrics And Tool Evaluation) elenca gli analizzatori di sicurezza secondo il prodotto su cui lavorano, sorgente, bytecode o binario, e la homepage di Flawfinder. Il messaggio pratico: per ogni categoria esistono molti strumenti, e risorse come SAMATE aiutano a scegliere fra di essi per un dato linguaggio e contesto (il "conosci il tuo stack" della slide 11).

## Analisi dinamica / fuzzing (pagine 22-28)

La pagina 21 è il divisore di sezione "Dynamic Analysis".

### Slide 22 · Dynamic analysis' fundamental issue: cannot test all inputs

> - Given trivial program "add two 64-bit integers" - Input space = (2^64)(2^64) = 2^128 possibilities
> - Checking "all inputs" not realistic even in this case - Given 4GHz processor & 5 cycles/input (too fast): time = 2^128 inputs \* (5 cycles/input) \* (1 second/(4GHz cycles)) = 1.35 x 10^22 years (13.5 zettayears aka sextillion years)
> - Using 1 million 8-core processors doesn't help: time = 1.7 x 10^15 years (petayears aka quadrillion years)
> - Real programs have far more complex inputs - Even a 1% sample impossible in human lifetimes

**Approfondimento.** Questa slide quantifica *perché il test non può mai essere esaustivo* (Lezione 1, slide 32). Anche il programma più banale, che somma due interi a 64 bit, ha 2^128 input possibili. Controllarli tutti, con un ottimismo sfrenato di 5 cicli per input su una CPU a 4 GHz, richiede circa 1,35 × 10^22 anni (molto più dell'età dell'universo, \~1,4 × 10^10 anni); anche un milione di macchine a 8 core lo porta solo a \~10^15 anni. I programmi reali hanno spazi di input astronomicamente più grandi, quindi è impossibile perfino campionarne l'1%. **La conseguenza:** l'analisi dinamica può provare solo una minima parte degli input, quindi può trovare bug ma mai dimostrarne l'assenza; tutta l'arte del test dinamico è *scegliere quali input* provare (quelli che hanno più probabilità di rompere le cose), il che motiva il fuzzing.

### Slide 23 · Functional testing for security

> - Use normal testing approaches, but add tests for security requirements - Test both "should happen" and "should not happen" - Often people forget to test what "should not happen" ("Can I read/write without being authorized to do so?"; "Can I access the system with an invalid certificate?")
> - Branch/statement coverage tools may warn you of untested paths
> - As always, automate and rerun

**Approfondimento.** Il test di sicurezza estende il normale test funzionale con i **test negativi**. Di solito i test funzionali verificano che le funzioni *facciano ciò che devono* (requisiti positivi); la sicurezza richiede di verificare anche che il sistema *non faccia ciò che non deve* (Lezione 1, slide 32): un utente non autorizzato può leggere o scrivere dati? un certificato TLS non valido viene rifiutato? Questi test negativi vengono dimenticati di continuo, ed è proprio lì che si nascondono le vulnerabilità. Gli **strumenti di copertura** (copertura di istruzioni e di rami) rivelano i percorsi del codice che nessun test esercita, candidati a nascondere bug. E come sempre i test vanno **automatizzati** e rieseguiti a ogni modifica (test di regressione, integrazione continua), così una correzione non si rompe in silenzio più avanti.

### Slide 24 · Web application scanners

> - Attempt to go through the various web forms and links
> - Send in attack-like and random data - Key issues: Input vector (Query string? HTTP body? JSON? XML?), scan barrier, crawl / input vector extraction, which vulnerabilities it detects (and how well) - Often build on "fuzzing" techniques
> - Shay Chen reviews many in "The Web Application Vulnerability Scanners Benchmark" \[OWASP Top Ten; WAVSEP 2014 discussion; OWASP recommended tools\]

**Approfondimento.** I **web application scanner** (DAST, dynamic application security testing) sono strumenti dinamici automatici specializzati per le applicazioni web: **esplorano** l'applicazione per scoprirne moduli, link e parametri (i *vettori di input*: query string, corpo POST, JSON, XML, intestazioni, cookie), poi mandano **input simili ad attacchi e casuali** (stringhe di SQL injection, payload XSS, sequenze di traversal) e osservano le risposte cercando segni di vulnerabilità. I fattori di qualità chiave sono quanto bene esplorano (trovare tutti i vettori di input, superare le *barriere di scansione* come il login), quali classi di vulnerabilità rilevano, e i loro tassi di falsi positivi e negativi. Si basano sul **fuzzing** (slide successive). Esempi sono OWASP ZAP e Burp Suite; benchmark come WAVSEP (Shay Chen) li confrontano, e la OWASP Top 10 elenca che cosa dovrebbero cercare.

### Slide 25 · Fuzz testing ("fuzzing")

> - Testing technique that: Provides (many!) invalid/random values as inputs; Monitors program for crashes and other signs of trouble (failing code assertions, appearance of memory leaks)… not if the final answer is "correct" (this process is the "oracle")
> - Simplifies "oracle" so can create massive data set
> - Do not need source, might not even need executable - Useful for pen-testers
> - Often quickly finds a number of real defects - Attackers use it; do not have easy-to-find vulnerabilities
> - Can be very useful for security, often finds problems
> - Typically diminishing rate of return

**Approfondimento.** Il **fuzzing** è la tecnica di sicurezza dinamica più importante e il probabile progetto del corso. L'idea: dare in pasto al programma *enormi quantità* di input non validi, malformati o casuali e osservare i **segni di guai**, crash, blocchi, asserzioni fallite, segnalazioni di memory leak o dei sanitizer, invece di controllare se l'output è *corretto*. La mossa furba è questo **oracolo semplificato**: decidere "è andato in crash?" è banale e automatizzabile, quindi si possono eseguire milioni di input senza sorveglianza (il problema dell'oracolo della slide 22 viene aggirato). Il fuzzing non richiede il sorgente e a volte nemmeno di conoscere l'interno di un eseguibile, quindi è ideale tanto per i penetration tester quanto per gli attaccanti, ed è proprio per questo che bisogna fare fuzzing *per primi*: ciò che un fuzzer trova facilmente lo troverà anche un attaccante. Di solito trova bug reali in fretta, poi rende sempre meno una volta corretti quelli superficiali (slide 28).

### Slide 26 · Fuzz testing variations: Input

> - Fuzz testing concept from Barton Miller's 1988 class project Univ. of Wisconsin - Project created "fuzzer" to test reliability of command-line Unix programs - Repeatedly generated random data for them until crash/hang - Later expanded for GUIs, network protocols, etc.
> - Approach quickly found a number of defects
> - Many tools and approach variations created since

**Approfondimento.** La storia: **il fuzzing fu inventato da Barton Miller** (University of Wisconsin) in un progetto per un corso del 1988, ispirato, si racconta, dal rumore su una linea modem che mandava caratteri casuali ai programmi Unix facendoli andare in crash. Il suo fuzzer dava byte casuali in pasto alle utility Unix da riga di comando finché non andavano in crash o si bloccavano, e trovò bug in una frazione sorprendente di esse. In seguito fu esteso alle interfacce grafiche, ai formati di file, ai protocolli di rete e alle API. Le strategie per generare gli input variano:

- Fuzzing **basato sulle mutazioni** (stupido): prendere input validi d'esempio e mutarli a caso.
- Fuzzing **basato sulla generazione** (intelligente): generare gli input da un modello o una grammatica del formato atteso, così sono abbastanza validi nella struttura da raggiungere il codice profondo.
- Fuzzing **guidato dalla copertura** (lo standard moderno, AFL/AFL++, libFuzzer, honggfuzz): strumentare il programma, conservare e mutare ancora gli input che raggiungono percorsi di codice *nuovi*, evolvendo verso una copertura più profonda (è l'idea "evolutiva" della slide 30).

### Slide 27 · Fuzz testing variations: oracle

> - Originally, just "did it crash / hang"?
> - Adding program assertions (enabled!) can reveal more
> - Test other "should not happen": Ensure files/directories unchanged if shouldn't be; Memory leak (e.g., valgrind); Invalid memory access, e.g., using AddressSanitizer (aka ASan) for C/C++/Objective-C to detect buffer overflows and double-frees; More intermediate (external) state checking; Final state "valid" (!= "correct")

**Approfondimento.** Come far trovare al fuzzing *più* dei soli crash, rafforzando l'oracolo:

- L'oracolo originale era solo "crash o blocco". Ma molti bug corrompono la memoria *senza* causare subito un crash, quindi si aggiungono dei rilevatori.
- Le **asserzioni** lasciate attive trasformano violazioni silenziose degli invarianti in fallimenti rilevabili (quindi le asserzioni di debug vanno incluse nella build per il fuzzing).
- **Strumenti per la memoria**: *Valgrind* rileva memory leak e accessi non validi; **AddressSanitizer (ASan)**, una strumentazione del compilatore per C/C++/Objective-C, coglie buffer overflow, use-after-free e double free *nel momento in cui avvengono*, trasformando una corruzione silenziosa dello heap in una segnalazione rumorosa e precisa. Combinare fuzzing e ASan è il modo singolo più efficace per trovare i bug di memoria della Lezione 3.
- Controllare anche che il programma non abbia modificato file che non doveva toccare, e che il suo **stato finale sia valido** (coerente). Si noti la distinzione attenta (slide 25): uno stato finale valido *non* è la stessa cosa di una risposta *corretta*; l'oracolo del fuzzing cerca il *male*, non la piena correttezza.

### Slide 28 · Fuzz testing: Problems

> - Fully random often does not test much - e.g., if input has a checksum, fuzz testing ends up primarily checking the checksum algorithm
> - Fuzz testing only finds "shallow" problems - Special cases ("if (a == 2) …") rare in input space - Sequence of rare-probability events by "random" input will typically not be covered - Can modify generators to increase probability… but you have to know very specific defect pattern before you find defect - In general, only a small amount of program gets covered
> - Once defects found by fuzz testing fixed, fuzz testing has a quickly diminishing rate of return - Fuzz testing is still a good idea… but not by itself

**Approfondimento.** I limiti del fuzzing (ingenuo):

- **L'input casuale non supera i cancelli strutturali.** Se il formato di input ha un **checksum** o un'intestazione magica, le mutazioni casuali lo violano subito, quindi il fuzzer esercita sempre e solo il codice di verifica del checksum e non raggiunge mai la logica vera. (Soluzioni: far correggere il checksum al fuzzer, disattivare il controllo nella build per il fuzzing, o usare un fuzzer che conosce la grammatica.)
- **Solo bug superficiali.** L'input casuale colpisce di rado condizioni strette (`if (a == 2)`) o le precise *sequenze* di eventi rari che servono per raggiungere il codice profondo, quindi la copertura resta bassa. Si può spingere il generatore verso uno schema, ma allora bisogna già sospettare il bug, il che vanifica lo scopo.
- **Rendimenti decrescenti.** Una volta trovati e corretti i crash facili, continuare a fare fuzzing casuale trova poco altro.
- **Conclusione:** il fuzzing è prezioso ma **da solo non basta**; completa l'analisi statica e la revisione. Il fuzzing moderno guidato dalla copertura (slide 26) attenua molto il problema della copertura superficiale, indirizzandosi verso percorsi nuovi.

## Analisi ibrida (pagine 30-32)

La pagina 29 è il divisore di sezione "Hybrid Analysis".

### Slide 30 · More hybrid approaches

> - Concolic testing ("Concolic" = concrete + symbolic) - Hybrid software verification technique that interleaves concrete execution (testing on particular inputs) with symbolic execution - Can be combined with fuzz testing for better test coverage to detect vulnerabilities
> - Sparks, Embleton, Cunningham, Zou 2007 "Automated Vulnerability Analysis: Leveraging Control Flow for Evolutionary Input Crafting" - Extends black box fuzz testing with genetic algorithm - Uses "dynamic program instrumentation to gather runtime information about each input's progress on the control flow graph ... Inputs which make more runtime progress ... or explore new ... regions receive a higher fitness value. Eventually, the inputs achieving the highest fitness are 'mated' ... to produce a new generation of inputs... does not require that source code be available"
> - Hybrid approaches are an active research area

**Approfondimento.** I metodi ibridi combinano il ragionamento statico (simbolico) con l'esecuzione dinamica (concreta) per superare il problema della copertura superficiale del fuzzing:

- Il **testing concolico** (CONCrete + symbOLIC) esegue il programma su un input concreto e intanto segue il percorso in modo *simbolico* (come vincoli sull'input). A ogni ramo non ancora esplorato chiede a un **risolutore di vincoli (SMT solver)** un input che prenda l'*altro* ramo, e riesegue. Questo spinge sistematicamente l'esecuzione lungo percorsi nuovi, raggiungendo proprio le condizioni strette (`if (a == 2)`) che il fuzzing casuale non tocca. Strumenti: SAGE (Microsoft), KLEE, DART/CUTE. Combinato con il fuzzing ("hybrid fuzzing", per esempio Driller) ottiene una copertura profonda.
- Il lavoro di Sparks e colleghi del 2007 citato usa un **algoritmo evolutivo/genetico**: strumenta il programma, dà a ogni input un punteggio in base a quanto avanza nel grafo del flusso di controllo (fitness = codice nuovo o più profondo raggiunto), e "accoppia" gli input più adatti per generarne di migliori, tutto senza il sorgente. È l'antenato concettuale dei fuzzer guidati dalla copertura (AFL).
- Il campo è un'area di ricerca attiva; la lezione è che combinare le tecniche copre i punti ciechi di ciascuna.

### Slide 31 · More hybrid approaches (2)

> - Dao and Shibayama 2011, "Security sensitive data flow coverage criterion for automatic security testing of web applications" (ACM) - proposes new coverage measure, "security sensitive data flow coverage": "This criterion aims to show how well test cases cover security sensitive data flows... security sensitive data flow coverage helps reduce test cost while keeping the effectiveness of vulnerability detection high."

**Approfondimento.** Un raffinamento di che cosa dovrebbe significare "copertura" per il test di *sicurezza*. La copertura ordinaria (di istruzioni e di rami) tratta tutto il codice allo stesso modo, ma per la sicurezza conta se i test esercitano i **flussi dalle sorgenti non fidate ai pozzi sensibili** (i percorsi di contaminazione della slide 17). Questo lavoro propone di misurare la **copertura dei flussi di dati sensibili per la sicurezza**, cioè quanto bene la suite di test copre quei flussi dalla sorgente al pozzo, così lo sforzo di test si concentra dove vivono davvero le vulnerabilità, trovando più bug con meno test. Ricollega l'idea del test dinamico alla visione dell'injection come contaminazione.

### Slide 32 · Penetration testing (pen testing)

> - Pretend to be adversary, try to break in
> - Depends on the skills of the pen testers
> - Need to set rules-of-engagement (RoE) - Problem: RoE often unrealistic
> - Really a combination of static and dynamic approaches

**Approfondimento.** Il **penetration testing** è un attacco autorizzato e mirato a un obiettivo: tester esperti *fingono di essere l'avversario* e cercano di entrare nel sistema, combinando il ragionamento statico (leggere codice e architettura) e gli attacchi dinamici (fuzzing, sfruttamento, scanner). I punti chiave:

- Il suo valore **dipende molto dall'abilità dei tester** (a differenza degli strumenti automatici) e dalla loro creatività nel pensare come un attaccante.
- Le **regole di ingaggio (RoE)** vanno concordate prima: che cosa rientra nel perimetro, quali tecniche sono ammesse, quando, per evitare danni e problemi legali. L'intoppo pratico: le RoE sono spesso *irrealistiche* (gli attaccanti veri non rispettano regole, hanno tempo illimitato e possono colpire bersagli fuori perimetro), quindi un penetration test superato non garantisce la sicurezza.
- È un'attività *tardiva* (il sistema deve esistere per essere attaccato) e campiona le vulnerabilità invece di elencarle (Lezione 1, slide 44), quindi completa le pratiche di sviluppo sicuro precedenti, non le sostituisce.

## Strumenti operativi e adozione (pagine 34-39)

La pagina 33 è il divisore di sezione "Operational".

### Slide 34 · What about when it's fielded?

> - Hook into logging systems - Make sure your logging system is flexible and can hook into common logging systems
> - Support host-based countermeasures - e.g., address randomization, etc. - Make sure your implementation works on them - Microsoft EMET (provide info for it)
> - Host-based sandboxing/wrappers - SELinux (provide starter policy) - Document inputs and outputs (files, ports)
> - Network-based measures - Firewalls, intrusion detection/prevention systems, NATs - Don't assume client IP address you see == IP address client sees
> - When designing & implementing, prepare for security-related tools in the operational (fielded) setting

![Lezione 6, pagina 34](L06_p34.webp "50% 1400x131")

**Approfondimento.** Gli strumenti di sicurezza continuano dopo il rilascio, e il software deve essere *progettato per collaborare con essi*:

- **Logging**: emettere gli eventi rilevanti per la sicurezza in una forma che si colleghi ai comuni sistemi di log e SIEM, così le operazioni possono rilevare e indagare gli attacchi (l'auditing e il rilevamento della Lezione 1, slide 55).
- **Contromisure sull'host**: assicurarsi che il programma *funzioni davvero con* l'irrobustimento del sistema operativo come ASLR (Lezione 3, slide 40) e con le mitigazioni degli exploit (la slide cita EMET di Microsoft, ora ritirato), per esempio compilando in modo indipendente dalla posizione così che ASLR si applichi; fornire le informazioni di cui questi strumenti hanno bisogno.
- **Sandboxing e involucri**: supportare un confinamento come **SELinux**; per farlo bisogna *documentare gli input e gli output del programma* (quali file, quali porte) così si può scrivere una politica stretta (privilegio minimo), meglio ancora fornendo una politica di partenza.
- **Misure di rete**: firewall, IDS/IPS, NAT. Un avvertimento concreto: **non fidarsi dell'IP del client che si osserva**: NAT, proxy e spoofing fanno sì che l'indirizzo visto dal server possa essere diverso da quello reale del client, quindi non va usato per decisioni di sicurezza.
- Il punto generale: **progettare per l'esercizio**, prevedere gli strumenti di sicurezza in esercizio già durante lo sviluppo, non dopo.

### Slide 35 · NIST SAMATE Tool Categories (partial)

> Assurance Case Tools; **Safer Languages**; Design/Modeling Verification Tools; **Source Code Security Analyzers, Byte Code Scanners, Binary Code Scanners**; **Web Application Vulnerability Scanners**; Intrusion Detectors; Network Scanners; Requirements Verification Tools; Architecture Design Tools; **Dynamic Analysis Tools**; Web Services Network Scanners; Database Scanning Tools; Anti-Spyware Tools; Tool Integration Frameworks

**Approfondimento.** Il progetto **SAMATE** del NIST classifica gli strumenti di software assurance in queste categorie (quelle in grassetto erano evidenziate nella slide: linguaggi più sicuri, gli analizzatori di codice sorgente, bytecode e binario, i web app scanner, gli strumenti di analisi dinamica). L'ampiezza dell'elenco ribadisce che nessuno strumento da solo copre tutto: l'assurance di sicurezza richiede un *portafoglio* che copre tutto il ciclo di vita, dalla scelta di linguaggi più sicuri (Lezione 3) e dalla verifica dei progetti, attraverso la scansione del codice e il test dinamico, fino al rilevamento delle intrusioni in esercizio.

### Slide 36 · NAVSEA "Software Security Assessment Tools Review" (2009)

> Static analysis code scanning; Source code fault injection; Dynamic analysis; Architectural analysis; Pedigree analysis; Binary code analysis; Disassembler analysis; Binary fault injection; Fuzzing; Malicious code detector; Byte code analysis

**Approfondimento.** Un'altra tassonomia autorevole (della US Navy, NAVSEA) dei tipi di strumenti di valutazione. Categorie nuove degne di nota oltre a quelle già viste: **fault injection** (iniettare di proposito guasti ed errori, al livello del sorgente, del bytecode o del binario, per testare la gestione degli errori e la robustezza), **analisi architetturale** (valutare il progetto in cerca di difetti), **pedigree analysis** (seguire la provenienza dei componenti: da dove viene questo codice o questa libreria, ed è affidabile? la preoccupazione per la catena di fornitura della Lezione 2, slide 8), **analisi con disassembler** e **analisi del codice binario** (reverse engineering del codice compilato), e i **rilevatori di codice malevolo** (trovare backdoor o malware inseriti). Insieme a SAMATE mostra il panorama completo degli strumenti di analisi del codice.

### Slide 37-38 · Fool with a tool is still a fool

> (37) RealNetworks' RealPlayer/Helix Player vulnerabilities:
>
> - CVE-2005-0455 / iDEFENSE Advisory 03.01.05: `char tmp[256]; /* Flawfinder: ignore */` `strcpy(tmp, pScreenSize); /* Flawfinder: ignore */`
> - CVE-2005-1766 / iDefense Advisory 06.23.05: `sprintf(pTmp, /* Flawfinder: ignore */`
> - CVE-2007-3410 / iDefense Advisory 06.26.07: `strncpy(buf, pos, len); /* Flawfinder: ignore */`
> - Kudos to RealNetworks for revealing what happened!!
> - Flawfinder: trivial static analysis tool - Lexical scanner for C code, reports vulnerability patterns - Comment "Flawfinder: ignore" disables next hit report
>
> (38) - Flawfinder correctly found the vulnerability!! - Someone then modified code, claiming not vulnerable - Yet these are obvious - not complex - vulnerabilities - Likely told "change code until no problems reported"
>
> - Tools are useless unless you understand major types of vulnerabilities and how to fix them - Training on tool not the issue (this tool trivial to run) - Training on developing secure programs is critical (Must understand tools' purpose and what to do with results; e.g., must know what it means and what to do if tool says "potential SQL injection vulnerability at line X")

**Analisi del codice.** Un racconto ammonitore che resta in mente. Flawfinder segnalò delle chiamate pericolose (`strcpy`, `sprintf`, `strncpy`) in RealPlayer di RealNetworks; diventarono vere CVE. Ma nel sorgente rilasciato ogni riga segnalata porta il commento **`/* Flawfinder: ignore */`**, il marcatore speciale che dice a Flawfinder di *sopprimere* l'avviso per la riga successiva.

- *Che cosa è successo.* Lo strumento **aveva trovato correttamente le vulnerabilità**, ma uno sviluppatore, invece di *correggerle*, aveva semplicemente **zittito lo strumento** aggiungendo commenti "ignore", forse credendo (o sentendosi chiedere) di dover far "sparire" gli avvisi. I bug sono stati rilasciati e sfruttati. Non erano falsi positivi sottili, dipendenti dal contesto; erano veri, evidenti bug di buffer overflow (`strcpy(tmp, pScreenSize)` in un buffer di 256 byte senza controllo della lunghezza, esattamente lo schema della Lezione 3).
- *La lezione ("a fool with a tool is still a fool").* Uno strumento aiuta solo chi **capisce le vulnerabilità e come correggerle**. Lanciare lo strumento è banale; sapere che cosa *fare* con "possibile SQL injection alla riga X" è l'abilità difficile ed essenziale. Se gli sviluppatori vengono valutati su "nessun avviso" invece che su "nessuna vulnerabilità", sopprimeranno gli avvisi, rendendo il codice *meno* sicuro mentre sembra pulito. La *correzione* per queste righe è il rimedio della Lezione 3: copie con controllo dei limiti (`snprintf`, `strlcpy`, validare `len`), non un commento "ignore".
- *Il merito*: la slide loda RealNetworks per aver rivelato in modo trasparente che cosa era andato storto, così che altri possano imparare.

### Slide 39 · Adopting tool(s)

> - Culture change required - More than just another tool - Tool will not solve anything in isolation
> - Define objectives
> - Train before use - Esp. software security - types of vulnerabilities, how to fix them
> - Start with pilot - small and friendly group
> - Start by focusing on relevant, easily-understood - Disable detection of most problems at beginning
> - Appoint "champion" to advocate
> - Later, build on success

**Approfondimento.** I consigli organizzativi per ottenere davvero valore dagli strumenti di sicurezza (da Chess, West, Chou, Ritchey):

- **È un cambiamento di cultura, non solo uno strumento.** Lasciare cadere uno scanner in un gruppo che non è pronto produce rapporti ignorati o avvisi soppressi (la slide precedente). Il successo richiede un processo e l'adesione delle persone.
- **Definire gli obiettivi** (che cosa si vuole ottenere dallo strumento?) e **formare prima**, soprattutto sulla *sicurezza del software in sé* (quali sono le vulnerabilità e come si correggono), non solo su dove cliccare nello strumento, perché il fallimento del "fool with a tool" è una lacuna di conoscenza, non di strumenti.
- **Cominciare in piccolo**: un progetto pilota con un gruppo ben disposto, e all'inizio **regolare lo strumento perché segnali solo pochi tipi di problema, di valore alto e facili da capire** (disattivando il resto), così il gruppo non viene sommerso dai falsi positivi e impara a fidarsi dei rapporti e ad agire. Questo gestisce direttamente il problema dell'FPR della slide 4.
- **Nominare un referente** che promuova e sostenga l'adozione, poi **costruire sui primi successi**, attivando gradualmente più controlli. Introdurre tutto in una volta è il modo in cui gli strumenti vengono abbandonati.
