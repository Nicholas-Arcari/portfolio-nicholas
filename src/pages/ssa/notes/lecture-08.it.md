La Lezione 8 è il complemento della Lezione 3 sulle contromisure: un catalogo delle difese dal buffer overflow, raggruppate per chi le applica (pratiche di ingegneria del software, metodi find-and-patch, strumenti del linguaggio, strumenti di analisi, strumenti del compilatore, strumenti del sistema operativo), ognuna con pregi e difetti; poi uno sguardo più da vicino a **StackGuard** e agli stack canary e a come si possono aggirare, ai **problemi aritmetici (sugli interi)** che trasformano i controlli di lunghezza in overflow, e al perché Java non è immune quando chiama codice nativo. Le slide sono 35. Gli esempi di codice (slide 31, 32 e 35) sono importanti per l'esame.

## Tipi di difese (pagina 2)

### Slide 2 · Kind of Defences

> - Better software engineering practices
> - Find-and-patch methods
> - Language tools
> - Analysis tools
> - Compiler tools
> - Operating system tools

**Approfondimento.** Le sei famiglie agiscono in momenti diversi della vita del software (Lezione 3, slide 44: "prima di programmare, durante lo sviluppo, durante i test, durante l'esecuzione"):

- Le *migliori pratiche di ingegneria del software* e gli *strumenti del linguaggio* agiscono **prima e durante lo sviluppo**: scrivere meno bug.
- Gli *strumenti di analisi* agiscono **durante lo sviluppo e i test**: trovare i bug prima del rilascio.
- Gli *strumenti del compilatore* agiscono **in fase di build**, con effetto **durante l'esecuzione**: aggiungono controlli al binario.
- Gli *strumenti del sistema operativo* agiscono **durante l'esecuzione**, su ogni programma, senza toccare il codice.
- I *metodi find-and-patch* agiscono **dopo il rilascio**, una volta noto un bug o un attacco.

Lo schema di tutta la lezione è che ogni famiglia ha un beneficio chiaro e un costo chiaro, e che nessuna basta da sola: la difesa in profondità (Lezione 10) significa combinarne diverse.

## Migliori pratiche di ingegneria del software (pagine 3-4)

### Slide 3 · Better Code Engineering Practices - Code Inspection

> **Pros:**
>
> - Code inspection *may catch* many buffer overflows that testing won't
>
> **Cons:**
>
> - Time is money
> - When using vendor software, you cannot do a code inspection if you do not have the source code

**Approfondimento.**

- **Perché l'ispezione trova ciò che il test non vede.** Un buffer overflow spesso richiede un input specifico e insolito (una stringa troppo lunga, una lunghezza negativa) che i test ordinari non forniscono mai, e anche quando avviene può corrompere la memoria in silenzio, senza alcun malfunzionamento visibile. Un revisore che legge `strcpy(dest, src)` e si chiede "quanto può essere lunga `src`?" trova il bug senza bisogno dell'input che lo attiva. È l'analisi manuale della Lezione 6, slide 10.
- **I contro.** L'ispezione è lenta e richiede revisori esperti, quindi è costosa e di solito limitata al codice più sensibile (parsing dell'input, componenti privilegiati). E richiede il sorgente: per i componenti di terze parti a sorgente chiuso sono possibili solo l'analisi del binario o il test (Lezione 6, slide 8).

### Slide 4 · Better Code Engineering Practices - Documentation

> **Pros:**
>
> - Good documentation of reusable software components will allow people who use your code in their own projects to test and inspect it
>
> **Cons:**
>
> - Time is money, and the cost of documenting the code gets passed on to the customers
> - Often software companies do not want to release the source code for libraries that they sell

**Approfondimento.** Molti overflow nascono al confine fra componenti: una funzione di libreria presume che chi la chiama passi un buffer di almeno N byte, o una stringa terminata da NUL, e chi la chiama non lo sa. Documentare questi contratti (dimensioni dei buffer, terminazione, lunghezze massime, comportamento in caso di errore) permette a chi usa un componente di chiamarlo correttamente e di testarlo ai suoi limiti; l'errore sul "terzo parametro" di `strncat` della Lezione 3, slide 16-17, è proprio un contratto letto male. I contro sono economici (la documentazione costa tempo, e il costo si riversa su altri) e commerciali (chi vende librerie chiuse non vuole esporne il sorgente).

## Metodi find-and-patch (pagine 5-7)

### Slide 5 · Find-and-patch Methods

> - *Software patches*
>   - released by vendors when a security problem in their software is found, to fix the vulnerability.
> - *Programs that block known attacks*
>   - Programs that keep a list of known attacks and watch for those attacks on your system

**Approfondimento.** Entrambi i metodi sono **reattivi**: funzionano solo *dopo* che una vulnerabilità o un attacco sono stati scoperti. La patch toglie il bug dal codice; il blocco lascia il bug al suo posto e filtra gli attacchi noti che lo sfruttano. Prima della scoperta c'è la finestra dello **zero-day** (Lezione 1, slide 23-24); fra il rilascio di una patch e la sua installazione c'è la finestra che Slammer ha sfruttato (Lezione 1, slide 9-10: la patch era stata pubblicata sei mesi prima).

### Slide 6 · Find-and-patch Methods - Software Patches

> Example: The vendor, the customer, or a group concerned about software security finds a buffer overflow and a patch is written and released
>
> **Pros:**
>
> - Very effective at preventing known buffer overflow attacks for specific vulnerabilities
>
> **Cons:**
>
> - No protection against unknown attacks or known attacks for which a patch has not been released
> - Not all patches fix the buffer overflow, some are specific to one attack but leave the buffer overflow itself in place
> - The customer must regularly check for patches for their system (at the vendor's website or www.cert.org) and install them.

**Approfondimento.**

- **Una buona patch corregge la causa di fondo**: sostituisce la copia illimitata con una limitata, o aggiunge il controllo di lunghezza mancante. Una cattiva patch filtra la specifica stringa di exploit vista in giro, e un input leggermente diverso raggiunge lo stesso overflow: l'errore del black-listing della Lezione 4, slide 35-36, applicato alle patch.
- **Una patch protegge solo i sistemi su cui è installata.** I sistemi non aggiornati restano vulnerabili per anni: Slammer (Lezione 1, slide 9-10), o WannaCry nel 2017, che si diffuse sfruttando un difetto di SMB di Windows corretto due mesi prima. Oggi i produttori spingono gli aggiornamenti automatici, e gli avvisi sono pubblicati dai produttori e dai CERT (www.cert.org è il CERT Coordination Center del Software Engineering Institute della Carnegie Mellon).

### Slide 7 · Find-and-patch Methods - Programs that block known attacks

> Example: An anti-virus program that checks files and other inputs to the system for signatures of known attacks
>
> **Pros:**
>
> - Very effective against specific attacks that are known
>
> **Cons:**
>
> - Not effective against unknown attacks or attacks for which the anti-virus program does not yet have the signature
> - The program must keep a current list of signatures for known attacks and must be updated regularly

**Approfondimento.** Il blocco basato su firme (antivirus, sistemi di prevenzione delle intrusioni, web application firewall) riconosce gli *schemi di byte* degli exploit noti. Le sue due debolezze sono strutturali: non può riconoscere un attacco che nessuno ha ancora visto (zero-day), e gli attaccanti **eludono** una firma cambiando il payload senza cambiarne l'effetto (codificando lo shellcode, inserendo istruzioni che non fanno nulla, spezzando l'input): lo stesso gioco di elusione mostrato per la SQL injection nella Lezione 9, slide 9-11. È utile come uno dei livelli, mai come l'unico.

## Strumenti del linguaggio (pagine 8-12)

### Slide 8 · Language Tools

> - Languages less susceptible to buffer overflows
>   - Languages other than C/C++ that are less susceptible to buffer overflows when used properly.
> - Languages based on C
>   - Languages like Cyclone that were designed with preventing buffer overflows in mind.
> - "Safe" buffers
>   - Buffers that automatically truncate inputs, generate exceptions, grow bigger.
> - Safer library functions
>   - Library functions that are less susceptible to buffer overflow than the standard libraries.

**Approfondimento.** Le quattro opzioni scambiano compatibilità con sicurezza, dalla più radicale (cambiare linguaggio) alla meno invasiva (cambiare libreria). Ognuna è sviluppata nelle slide 9-12.

### Slide 9 · Languages Less Susceptible to Buffer Overflows

> Examples: Ada, Java, Perl, Python, etc.
>
> **Pros:**
>
> - Automatic bounds checking makes them less susceptible to the buffer overflow problem
> - Exception handling can greatly ameliorate the problem
>
> **Cons:**
>
> - Using different languages can increase development cost
> - None of these languages give the programmer access to the machine at a low level
> - None of these languages give you the performance of C/C++, most require distributable run-time environments
> - C/C++ are popular languages that many programmers are familiar with
> - What happens when a string that is too long is entered or an array is referenced out of bounds, is an exception generated, does the buffer grow, does the program just halt, is the user asked to provide different input?
> - Programmer still must be aware of buffer overflows to provide exception handlers to do what they want (Exception handling comes with its own set of problems)

**Approfondimento.**

- **Come i linguaggi memory-safe impediscono gli overflow.** Ogni accesso a un array viene controllato durante l'esecuzione rispetto alla lunghezza dell'array (in Java, `a[i]` con `i >= a.length` lancia `ArrayIndexOutOfBoundsException`), le stringhe portano con sé la propria lunghezza, e non c'è aritmetica dei puntatori. Una scrittura fuori dai limiti diventa un'eccezione invece di una corruzione silenziosa della memoria: questi linguaggi tolgono la conseguenza *sfruttabile*, non l'errore di logica.
- **I contro, oggi.** Prestazioni e accesso a basso livello sono i motivi classici per restare con C/C++ (kernel, driver, codice embedded, browser). **Rust** risponde in gran parte: è memory-safe (controlli dei limiti più un sistema di ownership verificato in compilazione, senza garbage collector) con prestazioni paragonabili al C, e permette codice di basso livello dentro blocchi `unsafe` marcati esplicitamente. I linguaggi memory-safe sono ora la raccomandazione ufficiale delle agenzie di sicurezza (Lezione 3, slide 55).
- **Le eccezioni non sono un pasto gratis.** Un overflow trasformato in un'eccezione non catturata ferma comunque il programma: un **denial of service**. E ogni gestore deve decidere che cosa fare (troncare? rifiutare? chiedere di nuovo?); uno scritto alla leggera fallisce in modo insicuro (Lezione 10, "fail securely": il `catch` vuoto o troppo ampio).
- Anche i linguaggi "sicuri" girano sopra codice C (i loro runtime e le librerie native): slide 34-35.

### Slide 10 · Language based on C

> Example: *Cyclone* is a different dialect of C that handles pointers in a much safer manner
>
> **Pros:**
>
> - The transition from C to Cyclone is an easy one because Cyclone is nearly identical to C
>
> **Cons:**
>
> - Existing C source code must be recompiled and probably modified
> - Code ported to Cyclone must be debugged, and gdb (a commonly used UNIX-based debugger) does not work well with Cyclone
> - Using pointers in Cyclone is considerably more complicated than using pointers in C (`*` is replaced with `*`, `@`, and `?`)
> - Cyclone does not provide object-oriented features

**Approfondimento.** **Cyclone** (AT&T Labs Research e Cornell University, primi anni 2000) è un dialetto sicuro del C: mantiene la sintassi e il controllo a basso livello del C ma vieta le operazioni insicure e inserisce controlli dove servono. I tipi di puntatore del terzo contro sono la sua idea chiave:

- `*` è un puntatore *sottile*, forse NULL, su cui l'aritmetica dei puntatori non è ammessa;
- `@` è un puntatore **mai NULL**, che non richiede controlli di null quando viene dereferenziato;
- `?` è un puntatore **grasso** che porta con sé i limiti dell'array in cui punta, quindi l'aritmetica dei puntatori è ammessa e ogni dereferenziazione è controllata rispetto ai limiti.

Cyclone usa anche una gestione della memoria basata su regioni per impedire i puntatori pendenti. Era un linguaggio di ricerca e non è più mantenuto, ma le sue idee (tipi non null, puntatori "grassi" con i limiti, regioni) hanno influenzato direttamente **Rust**, e i successivi tentativi di "C sicuro" (Checked C di Microsoft, le capability CHERI in hardware) seguono la stessa strada. I contro della slide sono quelli di ogni migrazione di linguaggio: costi di porting, di debug e di strumenti.

### Slide 11 · «Safe» Buffers

> Example: C++ class objects that do bounds checking like **cstring**, or "limitless" strings like **libmib**
>
> **Pros:**
>
> - Much safer than standard string handling in C
> - Exceptions can be handled instead of a program halt
>
> **Cons:**
>
> - Require the use of different library functions, meaning that existing code has to be modified or interfaced with in a low-level way
> - A "limitless" string has to continually be reallocated meaning a bigger heap and a performance cost
> - What if you do not want the buffer to grow and accept a bigger input?

**Approfondimento.**

- **Due progetti.** Una classe stringa *con controllo dei limiti* conosce la propria capacità e si rifiuta di scriverci oltre (lanciando un'eccezione o troncando); una stringa *senza limiti*, come le stringhe allocate dinamicamente di libmib, si rialloca in modo che un input troppo lungo non trabocchi mai. Gli equivalenti di oggi sono `std::string` e `std::vector::at()` del C++ (Lezione 3, slide 49).
- **Crescere non è sempre ciò che si vuole** (ultimo contro): accettare input di dimensione illimitata permette a un attaccante di esaurire la memoria, un denial of service, e molti protocolli *dovrebbero* rifiutare i campi troppo lunghi. Se crescere, troncare o rifiutare è una decisione di progetto: la scelta fra statico e dinamico della Lezione 3, slide 47.

### Slide 12 · Safer library functions

> Example: Use of a different library than the standard C libraries
>
> **Pros:**
>
> - Eliminates problems with unsafe library function calls in C/C++
>
> **Cons:**
>
> - Existing code has to be modified
> - Programmers have to become familiar with a different set of libraries
> - Often string and memory handling libraries are replaced, but not standard library functions specific to an operating system, like file handling and environment variable functions which can also lead to buffer overflows
> - Not all buffer overflows are caused by library functions
> - What happens when a buffer's limit is reached? Does the program halt? Is the string truncated? Is an exception generated?

**Approfondimento.** Sono le librerie della Lezione 3, slide 47-49 (`strlcpy`/`strlcat`, `Strsafe.h` di Microsoft, `GString` di glib) e le "bounds-checking interfaces" dell'Annex K di C11 (`strcpy_s`, `strcat_s`, ...). I loro limiti, come dice la slide:

- Correggono solo le funzioni che sostituiscono: le chiamate specifiche del sistema operativo che trattano percorsi e variabili d'ambiente (`realpath`, `getenv`, Lezione 3, slide 46) possono ancora traboccare.
- **Non tutti gli overflow vengono da chiamate di libreria**: un ciclo di copia scritto a mano (il ciclo sull'URL della Lezione 3, slide 33-36) o un indice off-by-one non hanno bisogno di alcuna funzione di libreria per traboccare.
- Ogni libreria ha il suo comportamento in caso di fallimento (troncare, restituire un errore, interrompere), che il programma deve controllare e gestire; altrimenti il troncamento stesso può diventare una vulnerabilità (un percorso o un comando troncati possono significare un'altra cosa).

## Strumenti di analisi (pagine 13-14)

### Slide 13 · Analysis Tools - Static

> Examples: Software that searches source code for unsafe library function calls like **ITS4**
>
> **Pros:**
>
> - Can be a very effective tool during code inspection by finding unsafe library function calls and making recommendations
>
> **Cons:**
>
> - Only effective against buffer overflows caused by unsafe standard C library function calls
> - Produces many false positives, only a fraction of the library function calls that are reported are actually unsafe

**Approfondimento.** **ITS4** ("It's The Software, Stupid! Security Scanner", Cigital, 2000) è uno dei primi *scanner testuali di difetti di sicurezza* (Lezione 6, slide 15, con RATS e Flawfinder): divide in token il codice C/C++, cerca ogni chiamata in un database di funzioni rischiose (`gets`, `strcpy`, `sprintf`, ...) ordinate per rischio, e fa un po' di analisi in più (per esempio se una format string è una costante) per ridurre il rumore. I suoi contro sono quelli di ogni scanner lessicale: vede le *chiamate*, non i *dati*, quindi non sa distinguere una `strcpy` sicura (si sa che la sorgente ci sta) da una insicura, il che dà molti **falsi positivi**, e non vede gli overflow che non coinvolgono funzioni elencate (**falsi negativi**). Per fare meglio serve un'analisi semantica: l'analisi del flusso dei dati e l'interpretazione astratta (Lezione 7).

### Slide 14 · Analysis Tools - Dynamic

> Examples: Tools that analyze memory use of a program during testing, like **Purify**
>
> **Pros:**
>
> - Can detect buffer overflows that occur during testing
> - Sometimes testing will not catch buffer overflows where data is corrupted but program behavior is not affected, dynamic analysis will
>
> **Cons:**
>
> - Buffer overflows that lead to erratic program behavior can usually be found during testing without dynamic analysis tools

**Approfondimento.** **Purify** (Pure Software, poi Rational e IBM) strumenta il programma in modo che ogni accesso alla memoria venga confrontato con una mappa della memoria valida: segnala una scrittura fuori dai limiti nel momento in cui avviene, anche se poi il programma prosegue "normalmente" (la corruzione silenziosa che il test ordinario non vede, secondo pro). Gli equivalenti moderni sono **Valgrind Memcheck** e **AddressSanitizer** basato sul compilatore (`-fsanitize=address`), che circonda ogni oggetto di "redzone" avvelenate. Insieme al fuzzing (Lezione 6, slide 25-28) sono oggi il modo più efficace per trovare gli overflow. Il loro limite è quello di tutta l'analisi dinamica (Lezione 7, slide 10-13): vedono solo le esecuzioni che i test fanno davvero.

## Strumenti del compilatore (pagine 15-17)

### Slide 15 · Compiler Tools

> - Add bounds checking to all buffers
> - Protect the return pointer on the stack

**Approfondimento.** Il compilatore vede ogni buffer e ogni funzione, quindi può inserire protezioni nel codice generato in automatico, senza modifiche al sorgente: o controllare ogni accesso (completo ma costoso, slide 16) o proteggere solo il bersaglio più attaccato, il return address salvato (economico ma parziale, slide 17).

### Slide 16 · Compiler Tools - Bounds Checking

> Example: Attempts to add bounds checking to **gcc**
>
> **Pros:**
>
> - Does not require modification of the source code, although you do still have to recompile
>
> **Cons:**
>
> - Very significant decrease in performance, code size and execution time can double
> - All of the programs that a systems administrator wants to protect must be recompiled
> - Cannot prevent every possible buffer overflow

**Approfondimento.** I compilatori C con controllo dei limiti (la patch di Jones e Kelly per gcc, 1997, e i suoi successori) tengono traccia dei limiti di ogni oggetto e controllano rispetto a essi ogni operazione di aritmetica dei puntatori e ogni dereferenziazione. I puntatori C non portano con sé i propri limiti, quindi il codice compilato deve cercarli in una tabella ausiliaria durante l'esecuzione, ed è per questo che il costo è così alto. "Cannot prevent every overflow", perché del codice sfugge alla strumentazione (librerie compilate senza, cast e trucchi con i puntatori). L'idea sopravvive in forme più economiche: `_FORTIFY_SOURCE` (controlli su `memcpy`, `strcpy` e chiamate simili quando la dimensione della destinazione è nota in compilazione), AddressSanitizer per i test (slide 14), e il supporto hardware (Intel MPX, ora abbandonato; le capability CHERI, slide 21).

### Slide 17 · Compiler Tools - Protect the Return Pointer

> Examples: Placing a canary on the stack to detect buffer overflows such as **StackGuard**, or adding automatic bounds checking for all strings on the stack like **libsafe**.
>
> **Pros:**
>
> - Does not require that existing code be modified (although it sometimes must be recompiled)
> - Will effectively prevent stack smashing attacks
>
> **Cons:**
>
> - Not all buffer overflow attacks are stack-smashing attacks, program execution can be hijacked using heap-based attacks and data can always be corrupted
> - Significant performance overhead
> - StackGuard causes the program to halt upon detection of a buffer overflow leaving it open to denial-of-service attacks
> - StackGuard requires that the target program to be protected is recompiled, libsafe doesn't

**Approfondimento.**

- **StackGuard** (Cowan e colleghi, 1998) è un'estensione di gcc: il compilatore aggiunge a ogni funzione un prologo che mette una parola *canary* accanto al return address e un epilogo che la controlla prima di ritornare (slide 24-25; Lezione 3, slide 41). Richiede di ricompilare.
- **libsafe** (Bell Labs, 2000) non richiede di ricompilare: è una libreria dinamica caricata prima della libreria C (`LD_PRELOAD`) che sostituisce `strcpy`, `strcat`, `sprintf`, `gets`, ... con versioni che calcolano, dai frame pointer, quanto spazio resta prima del return address salvato dello stack frame corrente, e si rifiutano di scriverci oltre (Lezione 3, slide 48).
- **I contro** sono quelli di ogni protezione solo dello stack: gli heap overflow, gli overflow di altri dati locali (puntatori, flag) e gli attacchi solo sui dati non vengono fermati (slide 28-29; Lezione 3, slide 43); e poiché il rilevamento finisce con la terminazione, un attaccante può comunque far cadere il programma a piacere, un denial of service. Il "significant overhead" era reale per le prime versioni; il moderno `-fstack-protector-strong` costa circa l'1-2% ed è attivo per impostazione predefinita nella maggior parte delle distribuzioni Linux.

## Strumenti del sistema operativo (pagine 18-21)

### Slide 18 · Operating System Tools

> - Disable execution of code outside the code space
>   - It is possible on some architectures to distinguish between code and data, and not allow data to be executed as code.
> - Intrusion detection systems (IDS)
>   - These are programs that watch for abnormal behavior or behavior that is similar to attack behavior.
> - Generation of an interrupt
>   - With hardware support it is possible to set bounds on a buffer and generate an interrupt when an attempt is made to access or change memory outside those bounds.

**Approfondimento.** Le difese del sistema operativo proteggono *ogni* programma della macchina, compresi i vecchi binari che non si possono ricompilare: è il loro grande vantaggio sugli strumenti del compilatore. I tre approcci sono sviluppati nelle slide 19-21. La memoria non eseguibile, insieme alla randomizzazione dello spazio di indirizzamento (ASLR, Lezione 3, slide 40), è oggi la mitigazione standard del sistema operativo.

### Slide 19 · OS Tools - Disable Code Execution

> Example: A patch for Linux that disables execution of code on the stack as well as maps library function calls to addresses with a zero byte in them
>
> **Pros:**
>
> - Currently, the most common and most devastating buffer overflow exploit is stack smashing and this patch makes stack smashing much more difficult
> - Does not require that existing software be modified or recompiled
> - A zero byte in the address of a system call forces the attacker to have a null character in the attack string
>
> **Cons:**
>
> - Does not prevent all stack smashing attacks, often attack code can be placed in global variables or on the heap, or library code to spin a shell already exists in the code space (i.e., `system()` or `execv()`)
> - Crashing still leaves programs open to denial-of-service and core dump attacks
> - A null character in just the right place in an attack string is not always impossible for an attacker to accomplish, and they can always jump to a small piece of code in variable space that contains a second jump to the desired location
> - Some legitimate programs execute code on the stack, but very few, and there is a workaround for this.

**Approfondimento.** È la **patch per lo stack non eseguibile di Linux** di Solar Designer (Openwall, 1997), l'antenata dell'NX/DEP di oggi:

- **Stack non eseguibile.** Lo stack smashing classico (Lezione 3, slide 8-11) mette lo shellcode nel buffer traboccato e ci ritorna dentro; se lo stack non è eseguibile, il salto finisce nei dati e la CPU solleva un fault. Non richiede modifiche ai programmi, ed è per questo che l'idea si è diffusa: il bit NX dell'hardware, il DEP di Windows, ExecShield e PaX su Linux (slide 23).
- **Indirizzi con un byte zero ("ASCII-armor").** La patch mappa anche le librerie condivise a indirizzi che contengono un byte zero. Un exploit consegnato attraverso una funzione sulle stringhe come `strcpy` non può contenere un byte NUL, perché la copia si ferma lì, quindi non può scrivere un indirizzo del genere sullo stack. Questo prende di mira il **return-into-libc**, in cui l'attaccante ritorna direttamente in `system()` invece di iniettare codice (slide 23).
- **I contro sono gli aggiramenti.** Lo shellcode si può ancora mettere in altre aree scrivibili (heap, variabili globali) se sono eseguibili; si può riusare codice esistente (`system()`, `execv()`: il return-into-libc, e la sua generalizzazione, la return-oriented programming); il byte NUL a volte si può fornire (un input che non viene copiato come stringa, o il terminatore scritto dalla copia stessa) o evitare con un salto in due passi attraverso memoria controllata dall'attaccante (un "trampolino"). E un attacco rilevato fa comunque cadere il programma: un denial of service, e un core dump che può far uscire il contenuto della memoria.
- **Stack eseguibili legittimi**: pochi programmi ne hanno bisogno (i trampolini di gcc per le funzioni annidate, alcuni compilatori just-in-time); il rimedio è marcare quei binari come bisognosi di uno stack eseguibile.

### Slide 20 · OS Tools - Intrusion Detection

> Example: An intrusion detection system could keep track of what patterns of system calls programs usually exhibit, and then report or react to anomalies such as an "`execv()`" call when the next system call is usually to close a file
>
> **Pros:**
>
> - Could be able to detect a variety of hijacking attacks, not just stack smashing
> - Could be able to detect many attacks on unknown vulnerabilities
>
> **Cons:**
>
> - Intrusion detection is a developing technology
> - The offending process will probably be killed, leaving it open to a denial-of-service attack

**Approfondimento.** È il rilevamento delle intrusioni sull'host **basato sulle anomalie**, nello stile di "A Sense of Self for Unix Processes" di Forrest e colleghi (1996): imparare le sequenze normali di chiamate di sistema di un programma, poi segnalare le deviazioni. Un processo dirottato si comporta in modo diverso da se stesso (un web server che d'un tratto chiama `execve("/bin/sh")`) qualunque sia la vulnerabilità usata per dirottarlo, quindi, a differenza del blocco basato su firme (slide 7), può cogliere attacchi **sconosciuti**. Le sue debolezze: falsi allarmi quando il comportamento legittimo cambia; i *mimicry attack*, che dirottano il programma imitando le sue sequenze di chiamate normali; e il denial of service causato dall'uccisione del processo. I discendenti moderni sono le sandbox sulle chiamate di sistema (seccomp-bpf su Linux, pledge su OpenBSD), che impongono una allow list di chiamate di sistema invece di impararla, e i prodotti di endpoint detection and response (EDR).

### Slide 21 · OS Tools - Generation of an Interrupt

> Example: With hardware support the program could set the bounds of every buffer and an interrupt would be generated if an attempt was made to access or change memory outside of those bounds
>
> **Pros:**
>
> - Would prevent many buffer overflows if done properly
>
> **Cons:**
>
> - Pointer arithmetic would still be unbounded as a pointer might be pointing to an array of 100 bytes, an array of 50 bytes, or to the 40th byte of an array of 50 bytes
> - Programmers would still have to be educated about buffer overflows because they need to write an interrupt handler to do what they want it to (halt, truncate the buffer, ask the user for different input?)

**Approfondimento.** L'hardware controlla ogni accesso rispetto ai limiti del buffer a cui appartiene. Il primo contro è il problema centrale del C: un puntatore non dice in quale oggetto, o in quale parte di un oggetto, punti, quindi l'hardware non può sapere quali limiti si applicano a `p[i]` a meno che ogni puntatore non porti con sé i propri limiti. Tentativi in questa direzione: i limiti dei segmenti su x86 (usati di rado), Intel **MPX** (registri dei limiti, 2015, poi abbandonato per il costo e la complessità), e le capability **CHERI** (University of Cambridge, realizzate nel prototipo Morello di Arm), dove ogni puntatore è una capability hardware che porta limiti e permessi, quindi un accesso fuori dai limiti genera una trap. Anche così il programma deve decidere che cosa fare con la trap (secondo contro), e un crash resta un denial of service.

## StackGuard (pagine 22-29)

La pagina 22 è il divisore di sezione "StackGuard".

### Slide 23 · Preventing BO without Programming

> - **Idea:** make the heap and stack non-executable
>   - Because many buffer overflow attacks aim at executing code in the data that overflowed the buffer
> - Does not prevent "return into libc" overflow attacks
>   - Because the return address of the function on the stack points to a standard "C" function (e.g., "system"), this attack does not execute code on the stack
> - e.g., ExecShield for Fedora Linux (used to be RedHat Linux)

**Approfondimento.**

- **W⊕X ("write xor execute").** Una pagina di memoria è o scrivibile o eseguibile, mai entrambe le cose: stack e heap (i dati) sono scrivibili ma non eseguibili, il codice è eseguibile ma non scrivibile. Lo shellcode iniettato in un buffer quindi non può mai partire. Il supporto hardware (il bit NX/XD) è arrivato con i processori AMD64 nel 2003-2004; **ExecShield** (Red Hat, 2003) lo emulava sulle CPU x86 più vecchie usando i limiti dei segmenti, e rendeva anche casuali gli indirizzi.
- **Return-into-libc.** L'attaccante sovrascrive il return address con l'indirizzo di una funzione esistente, di solito `system()`, e sistema lo stack in modo che il suo argomento punti alla stringa `"/bin/sh"`. Non viene eseguito alcun codice iniettato, quindi W⊕X non aiuta. La sua generalizzazione, la **return-oriented programming** (ROP, 2007), concatena brevi frammenti di codice esistente che finiscono con `ret` ("gadget") per eseguire calcoli arbitrari. Le difese contro il riuso del codice sono ASLR (rendere casuale dove si trova `system()`), gli stack canary (slide 24) e la control-flow integrity (per esempio gli shadow stack di Intel CET).

### Slide 24 · Canaries on a Stack

> - Add a few bytes containing special values between variables on the stack and the return address.
> - Before the function returns, check that the values are intact.
>   - If not, there has been a buffer overflow!
>     - Terminate program
> - If the goal was a Denial-of-Service, then it still happens, but at least the machine is not compromised
> - If the canary can be read by an attacker, then a buffer overflow exploit can be made to rewrite it

**Approfondimento.** Il meccanismo della Lezione 3, slide 41, in poche parole:

- Un overflow contiguo che va da un buffer locale fino al return address deve prima attraversare il canary (lo stack cresce verso il basso, il buffer si riempie verso l'alto: Lezione 3, slide 7), quindi sovrascrivere il return address senza cambiare il canary è impossibile **per un overflow lineare**.
- Quando viene rilevato, l'unica reazione sicura è **terminare**: lo stack è già corrotto, e proseguire non sarebbe sicuro. Da qui il compromesso della slide: l'integrità è preservata (nessuna esecuzione di codice), la disponibilità no (denial of service).
- **La segretezza è essenziale.** Se l'attaccante può leggere il canary (una fuga di informazioni, per esempio una lettura con `%x` da una format string, Lezione 4, o una lettura oltre i limiti come Heartbleed), include il valore corretto nell'overflow e il controllo passa. Sui server che fanno fork il canary viene ereditato da ogni processo figlio, quindi si può perfino indovinare un byte alla volta (l'attacco "Blind ROP").

### Slide 25 · StackGuard - Detect

> Add Canary Word next to return address
>
> - Observation (true only for BO)
>   - Return address is unaltered IFF canary word is unaltered (?)
> - Guessing the Canary?
>   - Randomize
> - When compiling the function, it adds prologue and epilogue
>   - Before execution of function, push word canary into canary vector
>     - in addition to the stack
>   - After execution, before returning from function check whether canary is intact
>   - Function returns ONLY if canary is intact

![Lezione 8, pagina 25](L08_p25.webp "40% 715x551")

**Figura.** Uno stack frame disegnato dagli indirizzi alti (**FFFF**, in cima) a quelli bassi (**0000**, in fondo): **Attack code**, una posizione vuota, **return address**, **canary**, **Local variables**, **buffer**. Una freccia con l'etichetta **String Growth** punta in su e una con l'etichetta **Stack Growth** in giù; una freccia curva va dal return address fino all'attack code: il dirottamento che il canary è messo lì per rilevare.

**Approfondimento.**

- **L'osservazione e il suo "(?)".** Per un buffer overflow classico (una scrittura contigua verso l'alto a partire da un buffer), il return address può cambiare solo se cambia anche il canary, quindi controllare il canary equivale a controllare il return address. Il punto di domanda è meritato: l'equivalenza vale solo per gli overflow lineari, e una scrittura attraverso un puntatore corrotto può cambiare il return address saltando il canary (slide 28-29).
- **Indovinare il canary → randomizzare.** Un canary fisso si potrebbe semplicemente includere nell'exploit. StackGuard sceglie un canary **casuale** all'avvio del programma, oppure usa un *terminator canary* fatto di byte come NUL, CR, LF e 0xFF che le funzioni sulle stringhe non possono copiare (Lezione 3, slide 41).
- **Prologo ed epilogo.** Il compilatore inserisce codice all'inizio di ogni funzione (prologo: scrivere il canary accanto al return address, tenendo il valore di riferimento in un "canary vector" separato) e alla fine (epilogo: confrontare la copia sullo stack con il riferimento prima di `ret`). La funzione ritorna solo se sono uguali; altrimenti il programma viene interrotto. Il `-fstack-protector` di GCC fa lo stesso, con il valore di riferimento nel thread-local storage (`%fs:0x28` su Linux x86-64) e il gestore di fallimento `__stack_chk_fail`, che stampa `*** stack smashing detected ***`.

### Slide 26 · StackGuard - Prevent

> - While function is active, make the return address read-only
>   - attacker cannot change the return address
>   - any attempt will be detected
>   - Use a library called **MemGuard**
> - mark virtual memory pages as read-only and trap every write
>   - legitimate writes to stack cause trap
>   - Performance penalty

**Approfondimento.** Invece di *rilevare* la sovrascrittura a cose fatte, la variante MemGuard di StackGuard la *impedisce*: la parola che contiene il return address viene resa di sola lettura mentre la funzione gira, quindi un overflow che la raggiunge causa una trap nel momento della scrittura. Il problema è la granularità: la protezione della memoria lavora su **pagine** intere (di solito 4 KB), e il return address condivide la sua pagina con tutti gli altri dati dello stack che il programma scrive legittimamente in continuazione. Ognuna di queste scritture finisce in una trap nel kernel, che deve controllare se ha toccato una parola protetta e altrimenti emularla: un'enorme **penalità di prestazioni**. Per questo ha vinto il rilevamento (i canary); la protezione precisa dei return address è tornata solo con il supporto hardware, gli **shadow stack** di Intel CET e la pointer authentication di Arm (Lezione 3, slide 42).

### Slide 27 · Canary Implementations

> - StackGuard
> - Stack-Smashing Protector (SSP)
>   - gcc modification
>   - Used in OpenBSD
>   - http://www.trl.ibm.com/projects/security/ssp/
> - Windows: /GS option for Visual C++ .NET
> - These can be useful when testing too!

**Approfondimento.**

- **SSP / ProPolice** (Hiroaki Etoh, IBM Research Tokyo) ha migliorato StackGuard: oltre al canary **riordina le variabili locali**, mettendo gli array sopra scalari e puntatori in modo che un overflow non possa raggiungerli prima del canary (Lezione 3, slide 42). È stato adottato da OpenBSD ed è diventato il `-fstack-protector` standard di GCC (GCC 4.1, 2006); la variante `-fstack-protector-strong` (GCC 4.9) è oggi l'impostazione predefinita più comune. (L'URL di IBM della slide non è più online.)
- **`/GS` di Microsoft** (da Visual C++ .NET 2002) inserisce un "security cookie" con la stessa idea; è attivo per impostazione predefinita nei Visual Studio moderni.
- **Utile durante i test**: il fallimento di un canary indica direttamente la funzione il cui buffer è traboccato, quindi le build protette trasformano una corruzione silenziosa dello stack in un crash riproducibile durante i test e il fuzzing, lo stesso ruolo di AddressSanitizer (slide 14).

### Slide 28-29 · StackGuard Bypass

> (28)
>
> - Guarding a stack is not the answer, as B.O. is not a stack problem but a pointer problem (controlling a pointer --the instruction pointer in this case--).
> - Consider a function with several local variables, some of which are pointers: if we overflow B, we can overwrite pointer A. If this is a function pointer, it will be called, then pointing to our code.
>
> (29)
>
> - The return address can be overwritten without touching the canary value (trampolining)
> - Another possibility is to modify pointer A to point to a structure that holds function pointers, modifying an address there; point one of these back to buffer. If function gets called and buffer still around, control achieved.

![Lezione 8, pagina 28](L08_p28.webp "21% 383x786") ![Lezione 8, pagina 29](L08_p29.webp "25% 451x786")

**Figura (pagine 28-29).** Lo stack frame della funzione, dall'alto: **Arguments**, **Return Address**, **canary**, **LocVar: buffer A**, **LocVar: pointer A**, **LocVar: buffer B**, poi due posizioni vuote. A pagina 29 si aggiunge a destra una freccia che va da **LocVar: pointer A** fino a **Return Address**.

**Approfondimento.** Perché il canary non chiude la questione:

- **L'attacco di pagina 28.** Il buffer B sta *sotto* il puntatore A nel frame, quindi un overflow di B verso l'alto sovrascrive A senza mai raggiungere il canary, che sta sopra il buffer A. Se A è un **puntatore a funzione** che la funzione chiama più avanti, la chiamata salta dove vuole l'attaccante, per esempio nello shellcode nel buffer B; il controllo del canary, fatto solo al ritorno, non scatta mai. Il canary protegge un puntatore (il return address), ma il vero asset è *ogni* puntatore che guida il programma: da qui "a pointer problem, not a stack problem".
- **Il trampolino di pagina 29 (la freccia).** Se A è un puntatore a dati attraverso cui la funzione scrive più avanti (`*A = value`, con `value` anch'esso controllato dall'attaccante), l'attaccante imposta A all'indirizzo del return address: la scrittura finisce direttamente sul return address, saltando il canary, che resta intatto. La sovrascrittura avviene in modo indiretto, attraverso un puntatore, invece che come un overflow contiguo.
- **Corrompere le tabelle di puntatori a funzione.** Far puntare A a una struttura di puntatori a funzione (una tabella virtuale del C++, la voce della GOT di una funzione di libreria, un elenco di gestori `atexit`) e sovrascriverne una voce con l'indirizzo del buffer dà il controllo alla successiva chiamata di quella funzione.
- **Le difese.** SSP riordina le variabili locali in modo che i buffer stiano sopra i puntatori (slide 27; Lezione 3, slide 42); PointGuard cifra i puntatori (Lezione 3, slide 42); RELRO rende la GOT di sola lettura; la control-flow integrity limita le chiamate indirette ai bersagli legittimi; e la memoria non eseguibile (slide 23) ferma il "salto nel buffer", anche se non il riuso del codice.

## Problemi aritmetici (pagine 30-33)

### Slide 30 · Arithmetic Issues

> - In mathematics, integers form an infinite set, but in systems they are binary strings of fixed length (precision), so a finite set. Familiar rules of arithmetic do not apply.
> - In unsigned 8-bit integer arithmetic
>   1. 255+1= 0,
>   2. 16 X 17=16 and
>   3. 0-1=255
> - In particular, a negative value (as in 3.) can be interpreted as a 'large' positive one

**Approfondimento.** Gli interi della macchina sono aritmetica **modulo 2ⁿ**: i valori senza segno a 8 bit stanno in 0..255, e ogni risultato viene ridotto modulo 256.

- 255 + 1 = 256 ≡ **0** (riavvolgimento, overflow);
- 16 × 17 = 272 = 256 + 16 ≡ **16**;
- 0 - 1 = -1 ≡ **255** (riavvolgimento sotto lo zero).

In C l'aritmetica **senza segno** è definita in modo da riavvolgersi così, mentre l'overflow **con segno** è *comportamento indefinito*: in pratica di solito si riavvolge in complemento a due, ma il compilatore può presumere che non avvenga mai e cancellare i controlli che vi si basano. Le conversioni sono l'altra trappola: un valore con segno negativo reinterpretato come senza segno (per esempio quando viene passato a un parametro `size_t`) diventa un enorme numero positivo, -1 diventa 0xFFFFFFFF = 4.294.967.295 a 32 bit. Gli errori sugli interi sono pericolosi perché lunghezze e dimensioni sono interi: una dimensione riavvolta fa passare un controllo dei limiti o rende un'allocazione troppo piccola, e ne segue il buffer overflow (Lezione 3, slide 22-32; Lezione 1, slide 12).

### Slide 31 · Example (case 1)

> Consider the following code snippet that copies two character strings into a buffer and checks the combined length so they fit
>
> ```c
> char buf [128]
> combine(char *s1, size_t len1, char *s2,size_t len2) {
>     if (len1+len2+1 <= sizeof(buf)) {
>     strncpy(buf, s1, len1);
>     strncat(buf, s2, len2);
>     }
>  }
> ```
>
> The system could be attacked by constructing s1 so that len1<= sizeof(buf) and set len2=0xFFFFFFFF (as unsigned integer, it corresponds to 4294967295)
>
> Now, since len1+0xFFFFFFFF+1 = len1 <= sizeof(buf), the strncat is executed and the buffer is overrun.

(Nella slide la dichiarazione di `buf` non ha il punto e virgola e `combine` non ha un tipo di ritorno; si intende `void`.)

**Analisi del codice.**

- *Che cosa fa il codice.* `combine` concatena `s1` (di lunghezza `len1`) e `s2` (di lunghezza `len2`) nel buffer globale `buf` di 128 byte; l'`if` dovrebbe garantire che entrambe le stringhe più il NUL finale ci stiano.
- *Vulnerabilità: il controllo stesso va in overflow.* `len1 + len2 + 1` viene calcolato in `size_t`, un tipo senza segno che si riavvolge modulo 2³² su un sistema a 32 bit (come nella slide; 2⁶⁴ sui sistemi a 64 bit). Con `len2 = 0xFFFFFFFF` la somma `len2 + 1` si riavvolge a 0, quindi il totale è solo `len1`, che supera il test ogni volta che `len1 <= 128`.
- *Exploit.* Dentro l'`if`, `strncat(buf, s2, len2)` può aggiungere fino a 4.294.967.295 caratteri, cioè di fatto senza limite. Copia tutta `s2` (controllata dall'attaccante, lunga quanto vuole) dopo `s1`, molto oltre la fine di `buf`: un classico buffer overflow, qui nel segmento dati, reso possibile da un integer overflow.
- *Correzione.* Controllare ciascuna lunghezza separatamente, in una forma che non può riavvolgersi:

```c
char buf[128];

int combine(const char *s1, size_t len1, const char *s2, size_t len2) {
    if (len1 >= sizeof(buf) || len2 >= sizeof(buf) - len1)
        return -1;                      /* does not fit: reject */
    memcpy(buf, s1, len1);              /* now len1 + len2 + 1 <= sizeof(buf) */
    memcpy(buf + len1, s2, len2);
    buf[len1 + len2] = '\0';
    return 0;
}
```

Il test `a + b < max` viene riscritto come `b < max - a` dopo aver controllato `a < max`, così nessun risultato intermedio può riavvolgersi (lo stesso riordino della versione corretta della Lezione 1, slide 40-42). GCC e Clang offrono anche l'aritmetica controllata (`__builtin_add_overflow`). Naturalmente le lunghezze devono essere quelle reali delle stringhe: le calcola chi chiama con `strlen`, oppure la funzione le misura con `strnlen`.

### Slide 32 · Example (case 2)

> Consider the following code snippet:
>
> ```c
> int main(int argc, char* argv[])
>  { char _t[10]
>    char p[]="xxxxxxx"; char k[]="zzzz";
>    strncpy(_t, p, sizeof(_t);
>    strncat(_t, k, sizeof(_t) - strlen(_t)-1);
>    return 0;
>  }
> ```
>
> After execution, the resulting string in `_t` is xxxxxxxzz;
>
> Now if we supply 10 chars in p (xxxxxxxxxx), then sizeof(`_t`) and strlen(`_t`) are equal and the third argument is -1.
>
> Since strncat expects unsigned as third argument, it is interpreted as 0xFFFFFFFF and therefore the strcat is unbounded and the buffer is overrun again.

(Nella slide le stringhe usano virgolette tipografiche e il segno meno è un trattino lungo, `char _t[10]` non ha il punto e virgola e alla chiamata a `strncpy` manca la parentesi di chiusura; in un vero programma C sono `"..."`, `-`, `char _t[10];` e `strncpy(_t, p, sizeof(_t));`.)

**Analisi del codice.**

- *Che cosa vuole fare il codice.* Copiare `p` nel `_t` di 10 byte, poi aggiungere tanto di `k` quanto ci sta ancora, tenendo un byte per il terminatore: il terzo argomento di `strncat` viene calcolato come lo spazio rimasto, `sizeof(_t) - strlen(_t) - 1`. Con la `p` di 7 caratteri, `_t` contiene "xxxxxxx", lo spazio rimasto è 10 - 7 - 1 = 2, e `strncat` aggiunge "zz": `_t` diventa "xxxxxxxzz" (9 caratteri più il NUL), come dice la slide.
- *Vulnerabilità 1: la `strncpy` non terminata.* Se `p` ha 10 o più caratteri, `strncpy(_t, p, sizeof(_t))` riempie tutti i 10 byte e non scrive **alcun terminatore NUL** (Lezione 3, slide 18-21). `strlen(_t)` allora legge oltre la fine di `_t` finché non incontra per caso un byte zero, quindi restituisce almeno 10 (la slide presume esattamente 10).
- *Vulnerabilità 2: la sottrazione si riavvolge.* `sizeof(_t) - strlen(_t) - 1` viene calcolato in `size_t`, che è senza segno: 10 - 10 - 1 non fa -1 ma 0xFFFFFFFF (2³² - 1 a 32 bit, 2⁶⁴ - 1 a 64 bit). `strncat` riceve un limite enorme, quindi si comporta come una `strcat` senza limiti: aggiunge tutta `k` dopo il contenuto non terminato, scrivendo oltre la fine di `_t` sullo stack. Uno stack overflow, raggiungibile ogni volta che l'attaccante controlla `p`.
- *Correzione.* Terminare dopo `strncpy` e calcolare lo spazio rimasto solo quando è positivo, o meglio usare una funzione che riceve la **dimensione della destinazione**:

```c
char t[10];
strncpy(t, p, sizeof t - 1);
t[sizeof t - 1] = '\0';                  /* always terminated: strlen(t) <= 9 */
size_t used = strlen(t);
if (used < sizeof t - 1)                 /* room left for at least one character */
    strncat(t, k, sizeof t - used - 1);  /* cannot wrap: used <= 8 here */

/* or simply: snprintf(t, sizeof t, "%s%s", p, k);  truncates, never overflows */
```

### Slide 33 · Important Lesson

> - Declare all integers as unsigned integers, unless negative ones are really needed. While measuring size of objects, negative ones are not needed. If compiler flags signed-unsigned mismatch, check if both representations are needed; if so, care needed to the checks implemented.
> - Most arithmetic bugs are caused by type mismatch

**Approfondimento.**

- **Perché senza segno per le dimensioni.** Dimensioni e lunghezze non possono mai essere negative, e la libreria C usa per esse il `size_t` senza segno. Conservare una lunghezza in un `int` con segno invita al bug della Lezione 3, slide 22-25: una lunghezza negativa supera un controllo `len < MAX` e poi diventa un enorme `size_t` in `malloc` o `read`. Usare `size_t` dappertutto elimina la conversione da signed a unsigned, dove avviene il danno.
- **Ma senza segno non è una cura.** Le slide 31-32 mostrano che anche l'aritmetica senza segno si riavvolge: `a + b` e `a - b` su `size_t` vanno comunque controllati prima di essere calcolati (`b <= max - a`, `a >= b`). La vera lezione è il secondo punto: **mescolare i tipi** (con e senza segno, 32 e 64 bit, `short` e `int` come nella Lezione 3, slide 29-30) è da dove vengono la maggior parte dei bug aritmetici.
- **Farsi aiutare dal compilatore.** Attivare `-Wall -Wextra -Wsign-compare -Wconversion` e trattare gli avvisi su signed e unsigned come problemi veri (come dice la slide: "if compiler flags signed-unsigned mismatch"); usare i builtin per l'aritmetica controllata (`__builtin_add_overflow`, `__builtin_mul_overflow`) e `calloc` per `n * size` (Lezione 3, slide 31-32); testare con UndefinedBehaviorSanitizer (`-fsanitize=undefined`, più il `-fsanitize=integer` di Clang). Le regole SEI CERT C INT30-C, INT31-C e INT32-C riguardano proprio questi casi.

## Buffer overflow e Java (pagine 34-35)

### Slide 34 · Buffer Overflow in Java?

> - Not really, since Java has a type-safe memory model, and 'falling off' the end of an object is not possible.
> - Exploits against Java-based systems are typically language-based (type confusion) attacks and trust exploits (code signing errors)
> - Problem overflows typically occur in supporting code external to the JVM: use, by Java-based services, of components and services written in weakly typed languages like C and C++
> - Java supports loading of DLLs and code libraries, so that exported functions can be used directly

**Approfondimento.**

- **Perché il codice Java in sé non può traboccare.** Ogni accesso a un array è controllato dalla JVM rispetto ai limiti, gli oggetti si raggiungono solo attraverso riferimenti tipati, non c'è aritmetica dei puntatori, e la memoria è gestita dal garbage collector (slide 9). Un indice fuori dai limiti lancia `ArrayIndexOutOfBoundsException` invece di corrompere la memoria.
- **Che cosa si attacca invece in Java.** La *type confusion*: bug nella JVM o nel verificatore del bytecode che permettono al codice di trattare un oggetto come un tipo diverso (per esempio un `int[]` come un riferimento a oggetto), rompendo il modello della memoria dall'interno; molte evasioni dalla sandbox delle applet Java funzionavano così. Gli *exploit della fiducia*: abusare del modello di firma del codice e dei permessi (un'applet firmata che gira con pieni privilegi, una firma falsificata o validata male).
- **La JVM sta sopra codice nativo.** La JVM stessa, le parti native della libreria standard (decoder di immagini e font, compressione, rete) e ogni libreria nativa caricata con la **Java Native Interface (JNI)** sono scritte in C/C++. Un overflow lì è un vero bug di corruzione della memoria dentro il processo Java, raggiungibile da Java con un input costruito ad arte; diverse vulnerabilità critiche di Java erano overflow nelle librerie native di elaborazione delle immagini del JRE. Lo stesso vale per ogni linguaggio "sicuro" con un'interfaccia nativa (le estensioni C di Python, Rust `unsafe`, P/Invoke di C#).

### Slide 35 · Example (Java calling native code)

> ```java
> Public class MyJavaPacketEngine extends Thread
> {
>   public MyJavaPacketEngine ()
>     {
>         }
>   static
>   {
>   System.loadLibrary("packet_driver32");
>     }
> }
> ```
>
> Now calls can be made directly to the DLL.
>
> For example
>
> ```c
> wsprintf(lpAdapter->SymbolicLink,
>  TEXT("\\\\.\\%s%s"), DOSNAMEPREFIX,
>  p_AdapterName);
> ```
>
> Assigns the binding string to an unterminated string buffer

(Nella slide le stringhe sono delimitate da coppie di apici singoli tipografici, e `class` è preceduto da `Public` con la P maiuscola; in un vero programma Java e C sono `"..."` e `public`.)

**Analisi del codice.**

- *Che cosa fa il codice.* La classe Java carica una libreria nativa, `packet_driver32` (`packet_driver32.dll` su Windows), nel suo inizializzatore statico: `System.loadLibrary` viene eseguita quando la classe viene caricata, e da quel momento i metodi `native` della classe sono implementati da codice C che gira fuori dalla protezione della JVM. Il secondo frammento è codice C dentro un driver del genere (somiglia al codice di apertura dell'adattatore della libreria di cattura dei pacchetti WinPcap): `wsprintf` formatta il nome del dispositivo, `\\.\` seguito da `DOSNAMEPREFIX` e `p_AdapterName`, in `lpAdapter->SymbolicLink`.
- *Vulnerabilità.* `wsprintf` è l'equivalente Windows di `sprintf`: scrive l'intera stringa formattata **senza alcun limite legato alla dimensione della destinazione** (il suo unico limite è un massimo interno di 1024 caratteri). `p_AdapterName` è un nome di adattatore che può arrivare, attraverso JNI, dal lato Java, quindi è influenzato dall'attaccante. Se il nome formattato è più lungo di quanto `SymbolicLink` possa contenere, la scrittura va oltre la fine del campo e corrompe il resto della struttura dell'adattatore e tutto ciò che la segue in memoria. La frase della slide ("assigns the binding string to an unterminated string buffer") indica la stessa debolezza: niente limita la copia alla dimensione del buffer, quindi non è garantito che ci stia, né che vi sia terminata correttamente.
- *Exploit.* Un nome di adattatore lungo passato dall'applicazione Java fa traboccare `SymbolicLink` dentro la libreria nativa: corruzione della memoria dentro il processo Java, che i controlli dei limiti di Java non possono impedire perché non vedono mai questa memoria.
- *Correzione.* Usare una chiamata limitata dalla dimensione e che termina sempre la stringa, e validare l'input al confine JNI:

```c
HRESULT hr = StringCchPrintf(lpAdapter->SymbolicLink,
                             _countof(lpAdapter->SymbolicLink),
                             TEXT("\\\\.\\%s%s"), DOSNAMEPREFIX, p_AdapterName);
if (FAILED(hr)) {
    /* name too long: reject it instead of truncating or overflowing */
}
```

`StringCchPrintf` (da `Strsafe.h`, Lezione 3, slide 49) riceve la dimensione della destinazione, termina sempre con NUL e fallisce invece di traboccare; `_snwprintf_s` o `snprintf` sono alternative. Sul lato Java, controllare la lunghezza e i caratteri del nome dell'adattatore prima di passarlo al codice nativo: la validazione dell'input al confine di fiducia (Lezione 5).
