const e=`La Lezione 19 guarda alla sicurezza dal lato del linguaggio di programmazione: che cosa un linguaggio può garantire da solo (memory safety, type safety, thread safety, controllo degli accessi attraverso la visibilità, controllo del flusso dell'informazione) e che cosa può solo rendere più facile (buone API, eccezioni, ragionamento modulare). Distingue la safety dalla security, spiega perché le astrazioni di un linguaggio sono meccanismi di sicurezza solo finché non si possono rompere, e passa in rassegna i tre principali tipi di safety: la **memory safety** (limiti degli array non controllati, aritmetica dei puntatori, puntatori nulli, gestione manuale della memoria), la **type safety** (che cosa garantiscono i tipi, come la type confusion li rompe, come si può verificare la correttezza di un sistema di tipi) e la **thread safety** (data race, riordinamenti nel modello di memoria di Java, aliasing e mutazione). La lezione continua con un secondo gruppo di slide, "Lecture 19 (part 2)", sul trattamento formale dei tipi. Le slide sono 42.

## Sicurezza basata sul linguaggio e safety (pagine 1-16)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Language-Based Security

### Slide 2 · Language-based Security

> Programming Languages can provide security features and guarantees
>
> - safety guarantees
>   - memory safety
>   - type safety (different levels depending on expressivity)
>   - thread safety
> - Access Control (in some form)
>   - visibility and access restrictions (public, private, ...)
>   - sandboxing mechanisms
> - Information Flow Control (in some form)
>   - JFlow/Jif or next generation Javascript
>
> These features often interdependent (type needs memory, sandboxing needs memory and type, ...)

**Approfondimento.** La maggior parte delle vulnerabilità di questo corso è possibile perché il linguaggio le lascia accadere: un buffer overflow (Lezione 3) è una scrittura fuori dai limiti che il C non impedisce, un use-after-free è un accesso alla memoria che il C non controlla. La **sicurezza basata sul linguaggio** (language-based security) sposta una parte della protezione dentro il linguaggio e la sua implementazione, così che intere classi di bug diventino impossibili in ogni programma scritto in esso. La slide elenca tre famiglie di garanzie:

- **Garanzie di safety**: la **memory safety** (nessun accesso fuori dalla memoria allocata), la **type safety** (i dati vengono usati solo secondo il loro tipo, con livelli più o meno forti a seconda di quanto è espressivo il sistema di tipi) e la **thread safety** (il codice concorrente si comporta in modo prevedibile). Sono l'argomento di questa lezione.
- **Controllo degli accessi**: i modificatori di **visibilità** (\`public\`, \`private\`, ...) limitano quale codice può toccare quali dati, e il **sandboxing** limita che cosa può fare in assoluto il codice non fidato (la sandbox delle applet Java, la sandbox JavaScript dei browser).
- **Controllo del flusso dell'informazione**: il sistema di tipi tiene traccia di dove possono fluire i dati segreti o non fidati (**JFlow/Jif**, un'estensione di Java con etichette di sicurezza, e la ricerca sul controllo del flusso dell'informazione per JavaScript); è l'argomento della Lezione 20.

L'ultima riga è importante: le garanzie dipendono l'una dall'altra. La type safety non ha senso senza la memory safety (una scrittura vagante può sovrascrivere qualunque valore tipizzato), e una sandbox basata sulla visibilità ha bisogno di entrambe, altrimenti il codice non fidato potrebbe fabbricare un riferimento a un oggetto privato ed evadere.

### Slide 3 · Other ways to help

> A programming language can help security also if it
>
> - offers good APIs and libraries
>   - API with parametrized queries for SQL
>   - secure string libraries for C
> - supports external languages
> - offers useful features
>   - such as exceptions and their handling
> - makes assurance easier
>   - understand code in modular way ...
>
> Insecure programs can be written in ANY language (forget input validation, flaw in program logic, ...)

**Approfondimento.** Oltre alle garanzie forti, un linguaggio e il suo ecosistema aiutano la sicurezza in modi più morbidi:

- Le **buone API** rendono la strada sicura quella più facile: le **query parametrizzate** impediscono la SQL injection per costruzione (Lezione 9, slide 12-14), e le **librerie di stringhe sicure** per il C (funzioni con limite come \`strlcpy\`, o le funzioni dell'Annex K del C11) riducono i buffer overflow (Lezione 3, slide 40-52).
- Il **supporto per i linguaggi esterni** (SQL incorporato, query builder, sistemi di template che conoscono l'HTML) lascia al compilatore o alla libreria l'escaping che i programmatori sbagliano negli attacchi di injection (Lezioni 4-5).
- Le **eccezioni** rendono esplicita la gestione degli errori e più difficile da ignorare rispetto ai codici di errore, il che aiuta contro i bug che falliscono aperti (Lezione 10, slide 32-40).
- La **modularità** (incapsulamento, interfacce) rende più facile ottenere garanzie (assurance), perché ogni modulo si può capire e rivedere in isolamento.

L'ultima riga tiene realistiche le aspettative: nessun linguaggio impedisce gli errori di logica, i controlli di autorizzazione mancanti o l'input non validato. Un linguaggio memory-safe elimina i buffer overflow, non la SQL injection.

### Slide 4 · Safety vs. Security

> sometimes confused
>
> - SAFETY: system protected against accidental failures
> - SECURITY: system protected against induced failures (active attacker)
>
> separation line not clear, but good for safety also good for security

**Approfondimento.** La **safety** riguarda gli incidenti: guasti casuali, errori di programmazione, input inattesi, senza alcuna intenzione dietro. La **security** riguarda un **attaccante attivo** che cerca e provoca deliberatamente il guasto che fa più danni (Lezione 1). Le due si sovrappongono perché lo stesso bug serve a entrambe: un indice di array non controllato è un problema di safety quando per caso fa andare in crash il programma, e un problema di security quando un attaccante lo usa per sovrascrivere un indirizzo di ritorno (Lezione 3). Ecco perché la "language safety" è un tema di sicurezza: ogni garanzia che elimina una classe di guasti accidentali elimina anche la classe di attacchi corrispondente. La differenza si vede nelle ipotesi: un ragionamento di safety può contare sul fatto che i guasti siano rari e casuali, uno di security no, perché l'attaccante sceglie ogni volta l'input peggiore.

### Slide 5-7 · General Idea

> when does the assignment \`a[i] = (byte)b ;\` make sense?
>
> \`a\` must be a non-null byte array
>
> \`i\` a non-negative integer < arraylength
>
> \`b\` should be a byte or converted to one
>
> Two approaches
>
> - the programmer is responsible for verifying these conditions
>   - unsafe approach
> - the language is responsible for checking these conditions
>   - safe approach

La pagina 5 mostra solo la domanda, la pagina 6 aggiunge le tre condizioni e la pagina 7 i due approcci.

**Approfondimento.** Già un solo assegnamento dipende da diverse ipotesi: \`a\` si riferisce a un array di byte esistente, l'indice \`i\` è dentro i suoi limiti, e il valore di \`b\` sta in un byte. Se una di esse è falsa, l'assegnamento scrive in memoria che non dovrebbe toccare, il che è esattamente un buffer overflow o una type confusion. Ci sono due modi di garantire le ipotesi:

- In un linguaggio **unsafe** come il C è il programmatore a doverle verificare; se si dimentica un controllo, il programma ha un comportamento indefinito e forse una vulnerabilità.
- In un linguaggio **safe** come Java è il linguaggio a verificarle: il sistema di tipi garantisce che \`a\` sia un array di byte e che \`b\` venga convertito, e il runtime controlla che \`a\` non sia null e che \`i\` sia nei limiti, lanciando un'eccezione altrimenti. Il bug può ancora esistere, ma non può più corrompere la memoria.

Il resto della lezione riguarda il modo in cui i linguaggi realizzano il secondo approccio.

### Slide 8 · SAFE programming languages

> Safe programming languages
>
> - impose some discipline (via restrictions) on the programmer
> - offer **abstractions** (enforced with associated guarantees) to the programmer
>
> reduced freedom and flexibility in exchange for added safety and clearer understanding

**Approfondimento.** Un linguaggio safe **vieta** alcune cose che un linguaggio unsafe permette: l'aritmetica arbitraria dei puntatori, i cast fra tipi non correlati, la deallocazione manuale. In cambio offre **astrazioni con garanzie**: un array è una sequenza di elementi di un certo tipo a cui si può accedere solo dentro i limiti, un riferimento a un oggetto punta sempre a un oggetto vivo della classe giusta. Si scambia meno libertà (niente manipolazione diretta della memoria, a volte prestazioni più basse) con la safety e con programmi più facili da capire, perché le garanzie valgono ovunque e non dipendono dalla prudenza di ogni singolo programmatore.

### Slide 9 · Example abstractions

> - programming languages constructs provide *abstraction from CPU instructions*
> - programming language variables and types provide *abstraction of memory*
> - procedure call mechanism provides abstraction over *call stack mechanism*
> - ...

**Approfondimento.** Ogni linguaggio ad alto livello è un insieme di astrazioni sopra la macchina: le strutture di controllo (\`if\`, \`while\`) nascondono salti e diramazioni, variabili e tipi nascondono gli indirizzi di memoria e i byte grezzi, e le chiamate di procedura nascondono lo stack, l'indirizzo di ritorno salvato e il frame pointer. Queste astrazioni sono esattamente ciò che gli attacchi rompono: un buffer overflow sullo stack sovrascrive l'indirizzo di ritorno salvato, un dettaglio di implementazione che l'astrazione della *chiamata* promette che il programma non potrà mai toccare (Lezione 3, slide 7-13).

### Slide 10 · Example OS abstractions

> - OS provides virtual memory as abstraction of raw memory
> - OS provides process as abstraction of CPU and memory
> - OS provide security by
>   - separating processes
>   - controlling access to resources by process
>   - BUT this security breaks whenever these abstractions break !

**Approfondimento.** Il sistema operativo funziona allo stesso modo: la **memoria virtuale** dà a ogni processo il proprio spazio di indirizzamento, e l'astrazione del **processo** gli dà la propria CPU virtuale. La sicurezza fra processi poggia su queste astrazioni: un processo non può leggere la memoria di un altro perché non può nemmeno nominarla, e il sistema operativo controlla l'accesso a file e dispositivi processo per processo. Quando un'astrazione si rompe, si rompe anche la sicurezza costruita sopra di essa: bug del kernel che permettono a un processo di scrivere in memoria fisica arbitraria, o attacchi come Meltdown (2018), in cui l'esecuzione speculativa permetteva a un processo di leggere la memoria del kernel che l'astrazione della memoria virtuale avrebbe dovuto nascondere.

### Slide 11 · Abstractions

> - abstractions are crucial to reduce complexity
>   - reducing complexity reduces **bugs**
> - abstractions provide security (*access control*)
>   - memory access control by paging/segmentation
>   - access to files (bits of hard disk) by processes
>
> **provided** the abstractions are rigorously enforced
>
> - but ... some abstractions may be broken
>   - stack overflows to break the procedure call mechanism
>   - uninitialized virtual memory may leak information
>   - timing attacks may reveal the virtual memory abstraction

**Approfondimento.** Le astrazioni hanno due benefici per la sicurezza: **riducono la complessità**, e meno cose su cui ragionare significano meno bug; e **sono** controllo degli accessi, perché paginazione e segmentazione decidono quale memoria un processo può toccare, e l'astrazione del file decide chi può leggere quali blocchi del disco. La parola chiave è **provided** (a patto che): tutto vale solo se l'astrazione viene imposta in modo rigoroso. La slide dà tre modi in cui le astrazioni si rompono:

- Gli **stack overflow** rompono l'astrazione della chiamata di procedura sovrascrivendo l'indirizzo di ritorno (Lezione 3).
- La **memoria non inizializzata** rompe l'astrazione della "variabile nuova": la memoria consegnata senza essere ripulita può contenere ancora i segreti del suo proprietario precedente (una fuga di informazioni classica nei kernel e nei programmi C che fanno \`malloc\` senza ripulire).
- Gli **attacchi a tempo** (timing attack) rompono l'astrazione della memoria virtuale: il tempo che richiede un accesso rivela se il dato era nella cache o se una pagina è mappata, informazioni che l'astrazione doveva nascondere (la base dei side channel sulla cache e degli aggiramenti del KASLR).

### Slide 12 · General definition of Safety (?)

> a programming language can be considered safe if
>
> 1. the abstractions provided by the language can be trusted
>    - enforced and cannot be broken
>    - boolean always \`true\` or \`false\`, never \`35\` or \`null\`, independently of representation \`0x00 / true\`
> 2. programs have precise and well-defined semantics
>    - undefined behavior is source of trouble
> 3. the behavior of programs can be understood in a modular way

**Approfondimento.** Una definizione di lavoro di linguaggio safe, con tre condizioni:

1. **Astrazioni affidabili**: un booleano è sempre \`true\` o \`false\`, mai 35 o null, e il programma non può osservare come è rappresentato in memoria (se \`true\` sia \`0x00\` o qualunque altra cosa; la slide 29 sviluppa questo punto).
2. **Semantica ben definita**: ogni programma ha un significato definito. Il **comportamento indefinito** (undefined behavior) del C (accesso fuori dai limiti, overflow con segno, dereferenziazione di null) è l'opposto: il compilatore può presumere che non accada mai, e se accade può seguirne qualunque cosa, compreso codice che elimina in silenzio i controlli di sicurezza.
3. **Comprensione modulare**: il comportamento di un modulo si può capire dal suo codice e dalle interfacce che usa, senza sapere che cosa fa alla memoria ogni altro modulo. In C, un bug in qualunque punto può corrompere dati in qualunque punto.

Il punto interrogativo nel titolo è onesto: non esiste un'unica definizione formale di "linguaggio safe"; il trattamento formale (parte 2) definisce nozioni specifiche come la type safety.

### Slide 13 · unsafe → safe languages

> - oversimplistic
> - easier if data is immutable (no side-effects) as in functional languages

![Lezione 19, pagina 13](L19_p13.webp "50% 1400x522")

**Figura.** Nomi di linguaggi disposti lungo un asse. A sinistra: "machine code", "C", "MISRA-C", "C++"; al centro: "Java", "Scala", "C#", "Rust"; a destra: "Haskell", "Clean", "ML", "OCaml", "Prolog". Sotto di essi: *more 'unsafe'* con una freccia verso sinistra, *'safe'* al centro, ed *even more 'safe'* con una freccia verso destra.

**Approfondimento.** Una classifica approssimativa: il codice macchina e il C non danno garanzie, il MISRA-C (un sottoinsieme ristretto del C per i sistemi critici per la safety, come le automobili) elimina le caratteristiche più pericolose, e il C++ aggiunge astrazioni ma conserva l'insicurezza del C. Java, Scala, C# e Rust sono memory-safe e type-safe (Rust ci riesce senza garbage collector, grazie al suo sistema di ownership). I linguaggi funzionali come Haskell, Clean, ML e OCaml (e il linguaggio logico Prolog) vanno oltre, soprattutto perché i **dati immutabili** eliminano intere classi di problemi: se i dati non cambiano mai dopo la creazione, non ci sono data race né ipotesi rotte a causa dell'aliasing (slide 38-41). La slide stessa definisce l'immagine **oversimplistic** (troppo semplificata): ogni linguaggio ha angoli unsafe (la JNI di Java, i blocchi \`unsafe\` del C#, l'\`unsafe\` di Rust, l'\`unsafePerformIO\` di Haskell), e la safety ha diverse dimensioni (slide successiva).

### Slide 14 · dimensions and levels of safety

> memory safety, type safety, thread safety, arithmetic safety, non-null safety, aliasing safety, ...
>
> within each dimension, there can be (increasing) levels of safety
>
> - e.g., index of array out-of-bounds
>   1. let attacker inject arbitrary code
>   2. possibly crash program or corrupt data
>   3. definitely crash program
>   4. throw exception, caught by the program for graceful handling
>   5. ruled-out at compile-time

**Approfondimento.** La safety non è una proprietà sì/no ma un insieme di **dimensioni** (memoria, tipi, thread, aritmetica, riferimenti null, aliasing, ...), e in ciascuna ci sono dei **livelli**. Per un indice di array fuori dai limiti i livelli sono:

1. **C senza protezioni**: la scrittura va dovunque punti l'indice, e un attaccante può iniettare codice (Lezione 3).
2. **Protezioni parziali** (canary, ASLR; Lezione 8): il programma può andare in crash o corrompere i dati in silenzio.
3. **Crash sicuro**: per esempio una pagina di guardia o un sanitizer che interrompe il programma; nessuna esecuzione di codice, ma un denial of service.
4. **Eccezione** (Java, C#, Python): l'accesso fuori dai limiti lancia un'eccezione che il programma può catturare e gestire in modo ordinato.
5. **Escluso in compilazione**: il sistema di tipi dimostra che ogni indice è nei limiti (tipi dipendenti, o linguaggi e verificatori come quelli della Lezione 7 che controllano staticamente i limiti degli array), quindi l'errore non può mai verificarsi a run time.

Ogni livello è migliore del precedente; la sicurezza richiede almeno il livello 3, e il livello 5 è l'ideale, al prezzo di più lavoro per il programmatore o per il compilatore.

### Slide 15 · Safety : how?

> Mechanisms to provide safety include
>
> - compile time checks (e.g., type checking)
> - run time checks (for array bounds, null pointers, runtime type checks, ...)
> - garbage collector for automated memory management (no need to \`free()\` dynamic memory)
> - execution engine
>   - in JVM, bytecode verifier to type-check code, runtime checks, garbage collector invoked periodically

**Approfondimento.** I quattro meccanismi che i linguaggi safe combinano:

- **Controlli in compilazione**: il type checker rifiuta i programmi che potrebbero usare male i dati, senza costi a run time.
- **Controlli a run time**: ciò che non si può decidere in compilazione (un indice calcolato dall'input, un riferimento che potrebbe essere null, un downcast) viene controllato quando il programma gira.
- **Garbage collection**: la memoria viene liberata automaticamente solo quando non ne resta alcun riferimento, il che rende impossibili i dangling pointer, gli use-after-free e i double free (slide 21).
- **Il motore di esecuzione**: in Java, il **verificatore del bytecode** della JVM ricontrolla i tipi quando il codice viene caricato (così che un bytecode costruito a mano o corrotto non possa aggirare i controlli del compilatore), la JVM esegue i controlli a run time, e il suo garbage collector gira periodicamente.

### Slide 16 · Safety : how?

> Compiled binary runs on bare hardware
>
> Any defensive measures must be compiled into the code
>
> Execution engine isolates code from hardware
>
> The programming language is still "there" at runtime and the execution engine can provide checks at runtime

![Lezione 19, pagina 16](L19_p16.webp "50% 1400x432")

**Figura.** Due pile affiancate. A sinistra, "high level code" passa attraverso una freccia verde con l'etichetta "compiler" fino a "compiled binary", che poggia direttamente sullo strato "hardware". A destra, "high level code" passa attraverso il "compiler" fino a "lower level code (eg Java bytecode)", che gira su un "execution engine (eg Java VM)" che poggia sullo strato "hardware".

**Approfondimento.** Due architetture. Un linguaggio **compilato** come il C diventa codice macchina che gira direttamente sull'hardware: qualunque protezione abbia il programma deve stare nel codice generato stesso (controlli dei limiti, canary), e una volta che il binario è in esecuzione nient'altro lo controlla. Un linguaggio **gestito** (managed) come Java o C# viene compilato in un codice intermedio (bytecode) eseguito da una macchina virtuale: le regole del linguaggio sono ancora presenti a run time, perché la VM verifica il codice quando viene caricato ed esegue controlli mentre gira, isolando il programma dall'hardware. È ciò che rende possibile la sandbox di Java: il codice non fidato può girare dentro la VM perché la VM gli impone le garanzie del linguaggio. Il prezzo è che la VM stessa entra a far parte della trusted computing base (slide 26).

## Memory safety (pagine 17-21)

### Slide 17 · Memory Safety

> A programming language is *memory-safe* if it guarantees that
>
> 1. programs can never access *unallocated* or *de-allocated* memory
>    - hence, no segmentation faults at runtime
>    - so: OS access control for memory not necessary (if there are no bugs in execution engine)
> 2. (maybe) programs can never access uninitialized memory
>    - so there is no need to zero-out memory before deallocating to avoid information leaks (if there ...)

**Approfondimento.** La **memory safety** significa che ogni accesso alla memoria tocca memoria allocata e appartenente all'oggetto a cui si accede:

1. Nessun accesso a memoria **non allocata** (fuori dai limiti, indirizzi casuali) o **deallocata** (dangling pointer). Conseguenze: niente segmentation fault, e in linea di principio nessun bisogno che il sistema operativo protegga la memoria fra componenti che girano nello stesso runtime del linguaggio, ed è così che una JVM può eseguire codice non fidato nello stesso processo del codice fidato, a patto che il motore di esecuzione stesso non abbia bug.
2. (A volte inclusa) nessun accesso a memoria **non inizializzata**: ogni variabile e ogni oggetto viene inizializzato prima di poter essere letto (Java azzera ogni nuovo oggetto e richiede che le variabili locali siano assegnate prima dell'uso). Allora un programma non può mai leggere i resti di dati precedenti, quindi non serve ripulire la memoria per evitare fughe di informazioni.

La memory safety è la proprietà la cui assenza causa la quota più grande di vulnerabilità gravi: Microsoft e Google hanno entrambe riportato che circa il 70% dei bug di sicurezza che correggono nel codice C e C++ sono bug di memory safety, ed è per questo che governi e industria oggi spingono verso i linguaggi memory-safe.

### Slide 18 · Memory Safety

> Unsafe language features that can break memory-safety
>
> 1. unchecked array bounds
> 2. pointer arithmetic
> 3. null pointers (only when behavior is undefined)

**Approfondimento.** Le tre caratteristiche del C che permettono a un programma di accedere a memoria che non dovrebbe toccare:

1. **Limiti degli array non controllati**: \`a[i]\` con \`i\` fuori dall'intervallo legge o scrive la memoria adiacente: il buffer overflow (Lezione 3).
2. **Aritmetica dei puntatori**: \`p + n\` può puntare ovunque, e nulla controlla che il risultato punti ancora dentro lo stesso oggetto.
3. **Puntatori nulli**, *quando dereferenziarli è un comportamento indefinito*: in Java dereferenziare \`null\` è definito come il lancio di un'eccezione, quindi è safe; in C è indefinito, e le prossime slide mostrano perché conta.

### Slide 19 · Pointers in C

> Folklore:
>
> - dereferencing a NULL pointer will crash the program
>
> but the C standard says
>
> - the result of dereferencing a null pointer is undefined
>
> so the program *may* crash but anything else may happen
>
> - (see CERT Secure Coding Guidelines for C for discussion on security vulnerability in PNG library caused a null pointer dereference that did not crash)

**Approfondimento.** I programmatori considerano spesso innocua la dereferenziazione di un puntatore nullo, "al massimo va in crash". Lo standard del C dice altro: il comportamento è **indefinito**, quindi il programma può andare in crash, ma può anche fare qualcos'altro. Due motivi per cui può essere sfruttabile:

- Su alcuni sistemi l'indirizzo 0 è mappato (i kernel vecchi permettevano ai programmi utente di mappare la pagina 0, e alcuni sistemi embedded hanno memoria lì), quindi la dereferenziazione legge o scrive memoria valida scelta dall'attaccante.
- Se il codice calcola \`p + offset\` a partire da un \`p\` nullo, l'accesso va all'indirizzo \`offset\`, che può essere ovunque. La regola CERT sui puntatori nulli (EXP34-C) descrive esattamente questo in una versione della libreria **libpng**: un'allocazione fallita restituiva NULL, il codice scriveva a NULL più una lunghezza influenzata dall'attaccante, e sul dispositivo colpito la scrittura non andava in crash ma sovrascriveva la memoria.

Inoltre, poiché il compilatore può presumere che un puntatore dereferenziato non sia nullo, può eliminare come codice morto un controllo \`if (p == NULL)\` successivo, riducendo a nulla un controllo difensivo.

### Slide 20 · From C standard: ISO/IEC 9899:2011

> *"If an invalid value has been assigned to the pointer, the behavior of the unary operator \\* is undefined.<sup>102</sup>*
>
> *<sup>102</sup> Among the invalid values for dereferencing a pointer by the unary \\* operator are a null pointer, [...]"*
>
> more from the standard
>
> *"A null-pointer constant is either an integral constant expression that evaluates to zero (such as \`0\` or \`0L\`) or a value of type \`nullptr_t\` (such as \`nullptr\`)."*

**Approfondimento.** La prima citazione viene dallo standard C11 (ISO/IEC 9899:2011, §6.5.3.2 sull'operatore \`*\` e la sua nota 102): dereferenziare un puntatore non valido, null compreso, è un **comportamento indefinito**, non "un crash". La seconda definisce che cosa conta come costante puntatore nullo: l'intero 0 (in qualunque forma intera, come \`0L\`) oppure, nella formulazione più recente, la costante \`nullptr\` di tipo \`nullptr_t\` (questa formulazione viene dal C++11, e anche il C23 ha adottato \`nullptr\`). Il punto è che per il compilatore il puntatore nullo è solo un valore come un altro, e nulla nel linguaggio ne impedisce l'uso.

### Slide 21 · Memory Safety

> Unsafe language features that can break memory-safety
>
> 1. unchecked array bounds
> 2. pointer arithmetic
> 3. null pointers (only when behavior is undefined)
> 4. manual memory management
>    - de-allocation e.g., \`free()\` in C causing dangling pointers, use-after-free and double-free bugs
>    - can be avoided by
>      - not using the heap at all (in MISRA C)
>      - automating it with garbage collection
>        - first used in LISP in 1959, then accepted with Java in 1995

**Approfondimento.** La quarta caratteristica unsafe è la **gestione manuale della memoria**. Quando il programmatore chiama \`free()\` esplicitamente, diventano possibili tre bug: un **dangling pointer** (un puntatore a memoria liberata), un **use-after-free** (usarlo: la memoria potrebbe ora appartenere a un altro oggetto, forse controllato dall'attaccante, una tecnica di exploit molto comune nei browser) e un **double free** (liberare due volte, il che corrompe le strutture dati dell'allocatore). Due modi per evitarli:

- **Nessuno heap**: il MISRA C vieta l'allocazione dinamica della memoria, quindi tutta la memoria è statica o sullo stack. È praticabile per piccoli sistemi embedded, non per il software in generale.
- **Garbage collection**: il runtime libera la memoria solo quando non è più raggiungibile, quindi nessun riferimento può mai puntare a memoria liberata. Inventata per il LISP da John McCarthy nel 1959, è entrata nell'uso comune con Java nel 1995.

Una terza strada, non presente nella slide, è il sistema di **ownership e borrowing** di Rust: il compilatore tiene traccia in compilazione di quale parte del programma possiede ogni pezzo di memoria e lo libera quando il proprietario esce dal suo ambito, quindi i riferimenti pendenti vengono rifiutati senza garbage collector.

## Type safety (pagine 22-33)

### Slide 22 · Types and type safety

> **TYPES** assert invariant properties of elements of a program
>
> - this variable will always hold an integer
> - this function will always return an object of class C
> - this array will never store more than 10 elements
>
> **Type checking** verifies these assertions and can be done
>
> - at compile time (static typing)
> - at runtime (dynamic typing)
>
> **Type soundness** (type-safety / strong typing) refers to a system that guarantees that the assertions hold at runtime

**Approfondimento.** Un **tipo** è una promessa su un elemento del programma che vale per tutta l'esecuzione: questa variabile è sempre un intero, questa funzione restituisce sempre un \`C\`, questo array non ha mai più di 10 elementi (l'ultimo genere di promessa richiede sistemi di tipi più ricchi di quelli della maggior parte dei linguaggi). Il **type checking** verifica le promesse, prima di eseguire il programma (**tipizzazione statica**, come in Java, C, Rust) oppure durante l'esecuzione (**tipizzazione dinamica**, come in Python o JavaScript, dove ogni valore porta con sé il suo tipo e le operazioni lo controllano). La **correttezza del sistema di tipi** (type soundness) è la proprietà cruciale: le promesse del sistema di tipi valgono davvero a run time per ogni programma che esso accetta. Lo slogan di Robin Milner la riassume: "well-typed programs cannot go wrong". Il C ha tipi statici ma non è corretto: un cast o un buffer overflow possono far contenere qualunque cosa a una variabile \`int\`.

### Slide 23 · Type safety

> **Type-safe** programming languages guarantee that programs that pass the type-checker verification can only manipulate data in ways allowed by their type
>
> - *booleans* are not multiplied
> - *integers* are not dereferenced
> - references not the argument of square roots
> - in OO languages, never \`Method_not_found\` errors at runtime

**Approfondimento.** In un linguaggio **type-safe** ogni operazione viene applicata solo a dati del tipo giusto: niente moltiplicazioni di booleani, niente uso di un intero come puntatore (che è il modo in cui un attaccante trasforma un numero in un accesso alla memoria), niente radice quadrata di un riferimento, e, nei linguaggi a oggetti, nessuna chiamata di un metodo che l'oggetto non ha. L'ultimo esempio mostra che cosa si guadagna con la type safety: se il type checker accetta la chiamata \`o.m()\`, allora a run time \`o\` è davvero un oggetto che ha un metodo \`m\`, quindi il programma non può mai saltare a un metodo inesistente, o al suo posto a un indirizzo scelto dall'attaccante.

### Slide 24 · Memory and type safety

> Programming languages can be
>
> - memory-safe, typed and type safe
>   - Java, C#, Rust, Go, and functional languages such as Haskell, ML, Clean, F#
> - memory-safe and untyped
>   - LISP, Prolog, many interpreted languages
> - memory-unsafe, typed and type unsafe
>   - C, C++
>     - pointer arithmetic can break any guarantee by the type system
>     - impossible to ensure type safety without memory safety

**Approfondimento.** Le due proprietà si combinano in tre modi che si incontrano in pratica:

- **Memory-safe, tipizzati e type-safe**: Java, C#, Rust, Go e i linguaggi funzionali tipizzati; la categoria più sicura.
- **Memory-safe ma non tipizzati** (o tipizzati dinamicamente): LISP, Prolog, Python, JavaScript; la memoria non si può corrompere, e gli errori di tipo vengono intercettati a run time invece che in compilazione.
- **Memory-unsafe, tipizzati ma type-unsafe**: C e C++. Hanno i tipi, ma l'aritmetica dei puntatori e gli accessi non controllati possono scrivere qualunque byte ovunque, quindi i tipi sono solo suggerimenti.

L'ultimo sotto-punto è la dipendenza chiave: **la type safety richiede la memory safety**. Se un programma può sovrascrivere memoria arbitraria, può sovrascrivere un valore di un tipo con byte che il programma leggerà poi come un altro tipo, e ogni garanzia di tipo è perduta.

### Slide 25 · Buffer overflow in Java or C#

> Ruled-out at the language level by combination of
>
> - compile-time (static) type checking
>   - also at *load-time* by *bytecode verifier* (bcv)
> - runtime (dynamic) checks
>
> what runtime checks are performed during the execution of

\`\`\`java
public class A extends Super{
  protected int[] d;
  private A next;
  public A() { d = new int[3] ; }
  public void m(int j) { d[0] = j ;}
  public setNext(Object s) {
     next = (A)s ;
  }
}
\`\`\`

> runtime check for non-nullness of d and array bound
>
> runtime check for type downcast

**Analisi del codice.** Le due annotazioni sono accanto a \`m\` e accanto a \`setNext\` nel codice.

- *Che cosa fa.* La classe \`A\` ha un array di interi \`d\` (allocato con 3 elementi dal costruttore) e un riferimento \`next\` a un altro \`A\`. \`m(j)\` salva \`j\` in \`d[0]\`; \`setNext(s)\` riceve un \`Object\` qualsiasi e lo salva in \`next\` dopo un cast ad \`A\`. (Così com'è scritto, a \`setNext\` manca il tipo di ritorno, \`void\`, e un compilatore Java lo rifiuterebbe.)
- *I controlli a run time.* Il compilatore non può sapere tutto, quindi la JVM controlla a run time:
  - per \`d[0] = j\`: che \`d\` **non sia null** (una sottoclasse o altro codice potrebbe averlo impostato a \`null\`; altrimenti viene lanciata una \`NullPointerException\`) e che l'indice 0 sia **dentro i limiti** dell'array (altrimenti una \`ArrayIndexOutOfBoundsException\`);
  - per \`(A)s\`: che l'oggetto sia davvero un \`A\` (o una sottoclasse), il controllo del **downcast**; altrimenti viene lanciata una \`ClassCastException\`.
- *Perché questo esclude i buffer overflow.* Il controllo statico dei tipi (da parte del compilatore e di nuovo da parte del verificatore del bytecode al caricamento) garantisce che \`d\` sia un \`int[]\` e \`next\` un \`A\`; i controlli dinamici coprono ciò che i tipi statici non possono: null, limiti e downcast. Insieme garantiscono che ogni accesso resti dentro un oggetto reale del tipo giusto. Il costo è qualche confronto per accesso, che i compilatori JIT moderni spesso eliminano quando riescono a dimostrare che il controllo riesce sempre.

### Slide 26 · Buffer overflow in Java or C#

> Buffer overflow can still be present
>
> - in native code
> - in C# in code blocks declared unsafe
> - through bugs in the Virtual Machine (VM) implementation (typically written in C++)
> - through bugs in the implementation of the type-checker or in the type system (*unsound*)
>
> The *VM* (along with the *bcv*) is part of the *Trusted Computing Base* (TCB) for both *memory and type safety*

**Approfondimento.** Le garanzie di un linguaggio safe valgono solo dentro il linguaggio. I buffer overflow possono comparire ancora:

- Nel **codice nativo** chiamato dal linguaggio safe (la JNI di Java, il P/Invoke del C#, le estensioni C di Python): quel codice è C e ha tutti i problemi del C.
- Nel codice C# marcato esplicitamente come **\`unsafe\`**, dove i puntatori sono permessi.
- Nella **macchina virtuale** stessa, di solito scritta in C o C++: un bug nella JVM o in un motore JavaScript è un bug di memory safety che colpisce ogni programma che esegue, ed è il modo classico per evadere dalla sandbox di un browser.
- Nel **type checker o nel sistema di tipi**: se il checker accetta un programma che dovrebbe rifiutare, o se il sistema di tipi stesso è **non corretto** (unsound), diventa possibile la type confusion (slide 27-28).

Per questo la VM e il verificatore del bytecode fanno parte della **trusted computing base** (TCB) delle garanzie di safety: tutto il resto può essere non fidato, ma questi devono essere corretti (il principio della "TCB piccola" della Lezione 10).

### Slide 27 · How to break type safety?

> Type safety is not a robust property
>
> Data values and objects are just memory locations.
>
> If type confusion is created (e.g., by *having different references with different types referring to the same memory locations*), there can be NO type guarantees
>
> Attack on Java in Netscape 3.0
>
> \`public class A[] { ... }\`
>
> Netscape's Java execution engine confused this type with the type \`array of A\`
>
> **Input validation problem**: use of [ and ] in class names

**Approfondimento.** La type safety è **fragile**: in fondo tutti i valori sono byte in memoria, e le garanzie valgono solo finché ogni riferimento a una posizione di memoria ha il tipo giusto. Una sola **type confusion**, due riferimenti di tipo diverso alla stessa posizione, rompe tutto: attraverso un riferimento di tipo \`int\` l'attaccante scrive un numero, attraverso l'altro riferimento, di tipo "oggetto", il programma lo usa come puntatore, quindi l'attaccante può leggere e scrivere memoria arbitraria. L'esempio storico è un attacco a Netscape Navigator 3.0 (1996, scoperto dal gruppo Secure Internet Programming di Princeton): un'applet poteva definire una classe il cui *nome* era \`A[]\`, e la JVM del browser confondeva quella classe con il vero tipo array "array di \`A\`". La causa di fondo era un difetto di **validazione dell'input** (Lezione 5): la VM non rifiutava \`[\` e \`]\` nei nomi delle classi, caratteri che hanno un significato speciale nei nomi interni dei tipi.

### Slide 28 · Another type confusion attack

\`\`\`java
public class A {
...
  public Object x;
...
}
\`\`\`

\`\`\`java
public class A {
  public int x;
...
}

public class B {
  void setX(A a) {
     a.x = 12 ;
  }
}
\`\`\`

> What happens if B is compiled against A but run against A?
>
> *Pointer arithmetic*!
>
> If JVM allowed binary incompatible classes to be loaded, the type system would break

**Analisi del codice.** Nella slide la prima versione di \`A\` (con \`public Object x\`) è in blu e la seconda (con \`public int x\`) in verde; la domanda dice "compiled against A (green) but run against A (blue)".

- *Lo scenario.* \`B\` viene compilata rispetto alla versione di \`A\` in cui \`x\` è un \`int\`, quindi \`a.x = 12\` è un assegnamento corretto di un intero. A run time però viene caricata l'altra versione di \`A\`, in cui \`x\` è un riferimento (\`Object\`).
- *L'attacco.* Se la JVM eseguisse \`B\` senza controlli, l'assegnamento salverebbe l'intero 12 in un campo che il resto del programma usa come riferimento: un numero arbitrario diventa un puntatore, cioè "aritmetica dei puntatori" in un linguaggio che la vieta. Un attaccante che controlla il numero controlla dove punta il riferimento, e può leggere o scrivere qualunque memoria attraverso di esso.
- *La difesa.* La JVM deve rifiutarsi di collegare classi **incompatibili a livello binario**: quando \`B\` viene collegata, la JVM risolve il campo \`A.x\` per nome *e* descrittore di tipo (\`I\` per int), scopre che la classe \`A\` caricata ha \`x\` di tipo \`Object\`, e lancia un errore (\`NoSuchFieldError\`) invece di eseguire il codice. Questo controllo fa parte della verifica del bytecode e del collegamento (linking) che rendono la JVM parte della TCB (slide 26).

### Slide 29 · How to know a type system is sound?

> Representation independence (for booleans)
>
> - no difference if \`true\` is represented as \`0\` and \`false\` as \`1\` (or \`FF\`) or viceversa
>   - given program with either representation guaranteed to produce same result
> - test for it or prove it
>   - given formal definition of language, prove that the representation of \`true/false\` has no effect on any program
> - similar properties should hold for all datatypes

**Approfondimento.** Un modo per verificare che un tipo sia una vera astrazione è l'**indipendenza dalla rappresentazione**: se nessun programma può capire come sono rappresentati in memoria i booleani (se \`true\` sia 0, 1 o \`0xFF\`), allora i programmi possono usare i booleani solo come booleani, e l'astrazione non si può rompere. Questo si può **testare** (eseguire i programmi con rappresentazioni diverse e confrontare i risultati) o, meglio, **dimostrare** a partire da una definizione formale del linguaggio. In C fallisce subito: un programma può convertire un booleano in un intero, o ispezionarne i byte attraverso un \`char *\`, e vederne la rappresentazione. La stessa idea si estende a ogni tipo di dato: un linguaggio type-safe nasconde la rappresentazione di tutti i suoi valori.

### Slide 30 · How to know a type system is sound?

> Give two formal definitions of the programming language
>
> - a *typed* operational semantics, which records and checks type information at runtime
> - an *untyped* operational semantics which does not
>
> and prove their equivalence for all *well-typed* programs
>
> in other words, prove the equivalence of
>
> - a defensive execution engine (which records and checks all type information at runtime) and
> - a normal execution engine which does not
>
> for any program accepted by the type checker

**Approfondimento.** Una seconda tecnica di dimostrazione, più generale. Si definiscono due interpreti del linguaggio: uno **difensivo**, che tiene a run time il tipo di ogni valore e si ferma con un errore ogni volta che un'operazione viene applicata al tipo sbagliato, e uno **normale**, che non tiene i tipi e si limita a eseguire (come l'hardware vero). Poi si dimostra che, per ogni programma che **supera il type checker**, i due si comportano in modo identico. Se è così, i controlli difensivi non falliscono mai sui programmi ben tipizzati, quindi sono inutili: il type checker statico ha già escluso ogni errore di tipo. È questo che significa formalmente "il sistema di tipi è corretto", ed è la base del teorema di type safety della parte 2 (Lezione 19 parte 2, slide 32-34).

### Slide 31 · Ongoing evolution to richer type systems

> Many ways to enrich type systems (further)
>
> - distinguish non-null and possibly-null types **\`public @nonNull String hello = "hello";\`** to
>   - improve efficiency
>   - prevent null pointer bugs or catch them earlier, at compile time
> - alias control to restrict interferences due to 'double names'
> - information flow to control the way tainted information flows through

**Approfondimento.** La ricerca e l'industria continuano ad aggiungere garanzie ai sistemi di tipi:

- **Tipi non nulli**: un tipo che esclude \`null\` (attraverso annotazioni come \`@NonNull\` nei checker per Java, o direttamente nel linguaggio, come in Kotlin, Swift e nei nullable reference type del C# 8). Il compilatore rifiuta allora il codice che potrebbe dereferenziare un valore forse null, intercettando i bug da puntatore nullo in compilazione, e il runtime può saltare i controlli di null per i riferimenti non nulli (efficienza).
- **Controllo degli alias**: tipi che limitano quanti riferimenti a un oggetto possono esistere e chi può modificarlo, riducendo l'interferenza attraverso i "doppi nomi" (slide 39-41). L'ownership e il borrowing di Rust sono l'esempio meglio riuscito.
- **Tipi per il flusso dell'informazione**: tipi che tengono traccia del fatto che un dato sia segreto o contaminato (tainted) e gli impediscono di fluire nel posto sbagliato (Lezione 20).

### Slide 32 · Other language-based guarantees

> - visibility : \`public, private\`, etc
> - immutability
>   - of primitive values (constants)
>     - in Java: **\`final int i = 4;\`**
>     - in C(++): **const int \`BUFF_SIZE=128;\`**
>       - meaning of const confusing for C(++) pointers and objects!
>   - of objects
>     - in Java, **String** objects are constant

**Approfondimento.** Altre due garanzie che i linguaggi offrono:

- **Visibilità**: ai campi e ai metodi \`private\` non si può accedere da altre classi, e la garanzia viene imposta (dal compilatore e dalla JVM a run time), quindi può proteggere lo stato interno di un oggetto dal codice non fidato nello stesso programma.
- **Immutabilità**: un valore o un oggetto che non può cambiare dopo la creazione. Per le costanti, il \`final\` di Java e il \`const\` del C impediscono la riassegnazione. In C e C++, \`const\` è fonte di confusione con i puntatori: \`const char *p\` è un puntatore a caratteri costanti, \`char * const p\` un puntatore costante a caratteri modificabili, e il \`const\` si può togliere con un cast. In Java gli oggetti \`String\` sono immutabili, il che li rende sicuri da condividere fra thread e da usare per le decisioni di sicurezza (slide 41).

### Slide 33 · Safe arithmetic

> What happens if \`i=i+1;\` overflows ?
>
> 1. *Unsafest approach*: leaving this as an undefined behavior (as in C and C++)
> 2. *Safer approach*: specify how over/under flow behaves (as in Java and C#)
> 3. *Safer still:* integer overflow results in an exception (as in checked mode in C#)
> 4. *Safest approach:* have infinite precision integers and reals, so that overflow never happens (in some experimental functional languages)

**Approfondimento.** La sicurezza aritmetica in quattro livelli:

1. In C e C++ l'overflow **con segno** è un comportamento indefinito: il compilatore può presumere che non accada mai e, per esempio, eliminare un controllo di overflow scritto come \`if (i + 1 < i)\` (l'overflow senza segno è definito e si riavvolge).
2. Java e C# **definiscono** l'overflow: gli interi si riavvolgono in complemento a due. Il comportamento è prevedibile, ma un valore riavvolto è comunque sbagliato, e gli integer overflow portano ancora a vulnerabilità, per esempio un'allocazione troppo piccola (Lezione 8, slide 30-33).
3. La modalità **checked** del C# lancia una \`OverflowException\` invece di riavvolgere (Java offre \`Math.addExact\` e metodi simili; Rust va in panic nelle build di debug; Solidity dalla versione 0.8 annulla la transazione, Lezione 16, slide 15).
4. Gli interi a **precisione arbitraria** non vanno mai in overflow: crescono quanto serve (gli interi di Python, l'\`Integer\` di Haskell, i bignum del Lisp, quindi non solo linguaggi sperimentali), a scapito della velocità. I numeri reali non si possono memorizzare in modo esatto con una memoria finita, quindi gli "infinite precision reals" restano un tema di ricerca.

## Thread safety e aliasing (pagine 34-42)

### Slide 34 · (Lack of) thread safety

> Two concurrent execution threads executing the same statement
>
> \`x = x+1;\`
>
> at the end, x can have value 2 or 1
>
> Cause: data race since \`x = x+1;\` is **not** an atomic operation, but consists of two steps which may be interleaved in unexpected ways
>
> (and can cause security problems ...)

**Approfondimento.** La race condition della Lezione 11 al livello di una sola istruzione. Partendo da \`x = 0\`, due thread eseguono entrambi \`x = x+1\`. L'istruzione non è atomica: ogni thread **legge** \`x\`, poi **scrive** il valore incrementato. Se i passi si intrecciano come "il thread 1 legge 0, il thread 2 legge 0, il thread 1 scrive 1, il thread 2 scrive 1", un incremento va perso e il risultato è 1 invece di 2. Anche un linguaggio memory-safe e type-safe lo permette, perché il problema non è la corruzione della memoria ma un intreccio inatteso. Diventa un problema di sicurezza quando il valore condiviso è un saldo, un contatore di riferimenti o un controllo di permessi (gli attacchi TOCTOU della Lezione 11).

### Slide 35-36 · Multi-threading behavior in Java

\`\`\`java
class A {
  private int i;
  A() {i=4;}
  int geti() {return i;}
}
\`\`\`

> Can \`geti()\` ever return something different that 4 ?
>
> **Thread 1** initializing \`x\`: \`static A x = new A();\`
>
> **Thread 2** accessing \`x\`: \`j = x.geti();\`
>
> Execution of thread 1 takes 3 steps
>
> 1. allocate \`new object m\`
> 2. \`m.i = 4;\`
> 3. \`x = m;\`
>
> compiler or VM can swap 2. and 3. since independent
>
> Hence in thread 2, \`x.geti();\` can return 0 instead of 4

La pagina 35 pone la domanda; la pagina 36 aggiunge la spiegazione a partire da "Execution of thread 1 takes 3 steps".

**Analisi del codice.** Un risultato sorprendente del modello di memoria di Java.

- *Il codice.* Il costruttore di \`A\` imposta a 4 il campo privato \`i\`, e \`geti()\` lo restituisce. Il thread 1 crea un \`A\` e lo pubblica nel campo statico condiviso \`x\`; il thread 2 legge \`x\` e chiama \`geti()\`. Sembra che \`geti()\` possa restituire solo 4, visto che \`i\` viene impostato nel costruttore.
- *Perché può restituire 0.* \`new A()\` è fatto di tre passi: allocare l'oggetto (campi azzerati, quindi \`i\` vale 0), eseguire il costruttore (\`m.i = 4\`), salvare il riferimento (\`x = m\`). I passi 2 e 3 scrivono in posizioni diverse, quindi per un solo thread il loro ordine non conta, e il compilatore, il JIT o la CPU possono **riordinarli**. Il thread 2 può allora vedere il riferimento in \`x\` *prima* che la scrittura di \`i\` fatta dal costruttore sia visibile, e \`geti()\` restituisce 0: un oggetto costruito a metà.
- *Perché conta per la sicurezza.* Se \`A\` fosse un oggetto di sicurezza (un insieme di permessi, un percorso validato), un altro thread potrebbe osservarlo in uno stato incoerente, prima che i suoi invarianti valgano.
- *Correzione.* Pubblicare l'oggetto in modo sicuro: rendere \`x\` \`volatile\`, sincronizzare gli accessi (Lezione 11, slide 7-9), o rendere il campo \`final\` (slide successiva).

### Slide 37 · (Lack of) thread safety

\`\`\`java
class A {
  private final int i;
  A() {i=4;}
  int geti() {return i;}
}
\`\`\`

> Now \`geti()\` always returns 4
>
> Declaring a private field as **\`final\`** fixes this particular problem (because of ad-hoc restrictions on the initialization of final fields)
>
> only since the revision (2004) of Java Memory Model, which specifies how compilers and VM can deal with concurrency
>
> API implementation of **\`String\`** was fixed only in Java 2 (aka 1.5)

**Analisi del codice.** Con \`final\`, il modello di memoria di Java (rivisto dalla JSR-133, inclusa in J2SE 5.0, la versione 1.5, del 2004) dà una garanzia speciale: un thread che ottiene un riferimento a un oggetto *dopo* che il suo costruttore è terminato vede i valori corretti di tutti i suoi campi \`final\`, quindi \`geti()\` restituisce sempre 4. Prima di quella revisione la garanzia non esisteva, e perfino una \`String\`, i cui caratteri sono conservati in un array \`final\`, poteva essere vista da un altro thread con il contenuto sbagliato: una stringa controllata come \`"/tmp"\` poteva apparire a un altro thread come un valore diverso, un problema serio per il codice che usa le stringhe nei controlli di sicurezza. La lezione sta nel termine "ad-hoc" della slide: \`final\` corregge questo caso particolare, ma pubblicare oggetti attraverso data race resta pericoloso per i campi non final.

### Slide 38 · Data races and thread safety

> - a program contains a data race if two threads simultaneously access (not in read only) the same variable
> - **thread-safety** = the behavior of a program consisting of several threads can be understood as interleaving of those thread
> - in Java, the semantics of programs with data races is effectively undefined, so only programs without data races are thread-safe
> - MORAL: even "safe" programming languages can sport weird behavior in presence of concurrency

**Approfondimento.** Le definizioni: si ha una **data race** quando due thread accedono alla stessa variabile nello stesso momento, almeno uno dei due in scrittura, senza sincronizzazione. Un programma è **thread-safe** se il suo comportamento si può spiegare come un qualche **intreccio** dei passi dei suoi thread (consistenza sequenziale). Java lo garantisce solo per i programmi senza data race ("data-race-free programs are sequentially consistent"); per i programmi con data race, riordinamenti come quello della slide 36 producono comportamenti che nessun intreccio spiega. Java, a differenza di C e C++, mantiene comunque memory-safe i programmi con data race, ma il loro comportamento è molto difficile da prevedere. La morale: nemmeno i linguaggi safe sono al riparo dai bug di concorrenza. Alcuni linguaggi eliminano le data race per costruzione: il sistema di tipi di Rust rifiuta il codice che condivide dati mutabili fra thread senza un lock.

### Slide 39 · Typing breaks in C, Java, C# ...

> Dangerous combinations: aliasing & mutation
>
> threads or objects A and B both have references to a mutable object \`shared\`
>
> this can cause many problems, not just with concurrency
>
> 1. in concurrent (multi-threaded) context: data races
>    - locking objects (as with \`synchronized\` in Java) can help but is expensive and risks deadlock
> 2. in single-threaded context: dangling pointers
>    - who is responsible for free-ing \`shared\`? A or B ?
> 3. in single-threaded context: broken assumptions
>    - if A changes the \`shared\` object, B's assumptions about shared may not hold and B's code broken

![Lezione 19, pagina 39](L19_p39.webp "35% 631x219")

**Figura.** Due cerchi verdi, **A** e **B**, ciascuno con una freccia verso lo stesso riquadro verde, "SomeObject shared".

**Approfondimento.** L'**aliasing** (due riferimenti allo stesso oggetto) è innocuo se l'oggetto non cambia mai, e la **mutazione** è innocua se esiste un solo riferimento; è la combinazione a creare problemi:

1. Le **data race** nei programmi concorrenti (slide 34-38). I lock (\`synchronized\`) le impediscono ma costano tempo e possono causare **deadlock**.
2. I **dangling pointer** nei linguaggi con gestione manuale della memoria: se A libera \`shared\` mentre B lo usa ancora, B accede a memoria liberata (slide 21). Bisogna decidere chi possiede l'oggetto, e quindi chi lo libera.
3. Le **ipotesi rotte** anche con un solo thread: B controlla una proprietà di \`shared\` (per esempio che un percorso stia in una directory permessa), poi A lo modifica, e B continua a fare affidamento su un controllo che non vale più; lo stesso schema TOCTOU della Lezione 11, senza alcuna concorrenza.

Il sistema di tipi di Rust attacca proprio questa combinazione: in ogni momento un oggetto può avere o molti riferimenti di sola lettura o un solo riferimento mutabile, mai entrambi.

### Slide 40 · Danger of references to mutable data

> In multi-threaded programs, references to mutable data structures can be a problem, since referenced data can change even in safe languages (like Java or C#)

\`\`\`java
public void f(char[] x) {
    if (x[0] != 'a' {throw new Exception();}
    // cannot assume first element is 'a'
    ...
}
\`\`\`

> Another thread with reference to \`x\` can change the content of the array at any moment, also just after the if-statement has been executed

**Analisi del codice.** (Alla condizione dell'\`if\` nella slide manca la parentesi chiusa.)

- *Che cosa fa.* \`f\` controlla che il primo carattere dell'array sia \`'a'\` e altrimenti lancia un'eccezione, poi prosegue presumendo che il controllo sia passato.
- *Il problema.* \`x\` è un riferimento a un array **mutabile** che chi chiama (o un altro thread) tiene ancora. Fra il controllo e l'uso, un altro thread può cambiare \`x[0]\`, quindi il codice dopo l'\`if\` non può presumere nulla: una race time-of-check-to-time-of-use in un linguaggio memory-safe (Lezione 11).
- *Correzione.* Fare prima una **copia difensiva** (\`char[] c = x.clone();\`) e lavorare solo sulla copia, o prendere come parametro un tipo immutabile (slide successiva). La copia difensiva degli input mutabili è una regola standard della programmazione sicura in Java, soprattutto per i controlli di sicurezza.

### Slide 41 · References to immutable data less dangerous

> In multi-threaded programs, references to immutable data structures are safer

\`\`\`java
public void g(String x) {
    if (x.charAt(0) != 'a' {throw new Exception();}
    // can assume here that first character is 'a'
    ...
}
\`\`\`

> Another thread with a reference to the same string x cannot change the content of the array (value of the string) since Java strings are immutable

**Analisi del codice.** Lo stesso controllo su una \`String\` (di nuovo con una parentesi mancante nella slide). Le stringhe di Java sono **immutabili**: una volta create, il loro contenuto non può più cambiare, quindi dopo il controllo il codice può presumere senza rischi che il primo carattere sia \`'a'\`, qualunque cosa facciano gli altri thread con i loro riferimenti alla stessa stringa. Ecco perché le API Java sensibili per la sicurezza prendono \`String\` invece di \`char[]\` per nomi di file, URL e nomi di classi, e perché l'immutabilità è uno degli strumenti più efficaci sia contro i bug di concorrenza sia contro i problemi TOCTOU. (La garanzia dipende dalla semantica di \`final\` della slide 37.)

### Slide 42 · "Secure" programming languages

> - Languages like Java and .NET can provide security guarantees in the presence of untrusted code
> - the languages can guarantee restrictions on the possible interactions between different modules by using a combination of
>   - typing
>   - visibility
> - enforced by a combination of static and runtime checks
>   - static checks at load-time rather than at compile-time

**Approfondimento.** La conclusione: linguaggi come Java e C# possono eseguire **codice non fidato** nello stesso processo del codice fidato, perché è il linguaggio stesso a limitare il modo in cui i moduli interagiscono. La **tipizzazione** impedisce di fabbricare riferimenti o di usare male gli oggetti, e la **visibilità** impedisce l'accesso allo stato privato; insieme permettono a una libreria fidata di distribuire riferimenti ai propri oggetti senza timori. I controlli sono in parte statici e in parte a run time, e quelli statici vengono rifatti **al caricamento** dal verificatore, perché il codice non fidato arriva come bytecode che potrebbe non venire da un compilatore corretto. È il principio dietro i modelli di sicurezza di Java e di .NET, e oggi dietro WebAssembly, che esegue codice non fidato nei browser con un verificatore e una sandbox. Il suo punto debole è quello della slide 26: le garanzie sono forti solo quanto il verificatore e la macchina virtuale che le impongono.
`;export{e as default};
