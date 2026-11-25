La Lezione 3 è il cuore del corso: il buffer overflow, storicamente la vulnerabilità del software numero uno. Spiega perché C e C++ lo permettono, come la disposizione della memoria del processo e lo stack delle chiamate lo rendono sfruttabile, presenta una lunga serie di pezzi di codice "spot the defect" con il bug e la correzione, e le contromisure a tempo di esecuzione e di sviluppo. Le slide sono 55. Gli esercizi "spot the defect" sono la parte più importante per l'esame di tutto il corso.

## Il problema (pagine 2-6)

### Slide 2 · Essence of the problem

> Suppose in a C program we have an array of length 4:
>
> `char buffer[4]`
>
> What happens if we execute the statement below?
>
> `buffer[4]='a'`
>
> **Anything** can happen!
>
> If the data written (i.e. the "a") is user input that can be controlled by an attacker, this vulnerability can be exploited: anything that the attacker wants can happen.

**Approfondimento.** L'array `char buffer[4]` ha gli indici validi 0, 1, 2, 3. Scrivere `buffer[4]` tocca il quinto elemento, uno oltre la fine. In C non è un errore che il linguaggio segnala; è **comportamento indefinito**, quindi lo standard non impone nulla su ciò che succede dopo.

- In pratica il byte finisce su qualunque cosa sia memorizzata subito dopo l'array: un'altra variabile locale, un registro salvato, un contatore di ciclo, l'indirizzo di ritorno salvato della funzione, o i metadati dell'allocatore. L'esito va da "niente di visibile" (il byte è finito in un riempimento inutilizzato) a un risultato sbagliato, a un crash (segmentation fault), fino al pieno controllo del programma da parte dell'attaccante.
- La frase **"anything can happen"** va presa alla lettera. Se l'attaccante controlla i dati *e* la quantità scritta, può sovrascrivere un indirizzo di ritorno salvato e dirottare l'esecuzione. Per questo un bug di memory safety è trattato come potenzialmente critico anche quando, durante i test, sembra corrompere solo una variabile vicina.
- Basta un solo elemento fuori dai limiti perché conti; il resto della lezione riguarda i tanti modi in cui si commette questo unico tipo di errore.

### Slide 3 · Solution to the problem

> Check array bounds at runtime
>
> \- Algol 60 proposed this back in 1960!
>
> Unfortunately, C and C++ have not adopted this solution, for efficiency reasons.
>
> (Ada, Perl, Python, Java, C#, and even Visual Basic have.)
>
> As a result, buffer overflows have been the no 1 security problem in software ever since.

**Approfondimento.** La soluzione è nota dal 1960: a ogni accesso a un array, controllare che l'indice sia entro i limiti, e altrimenti segnalare un errore.

- **Perché il C non lo fa.** Il C fu progettato (1972) per la programmazione di sistema come "assembler portabile": della sicurezza è responsabile il programmatore, non il linguaggio, e ogni istruzione macchina ha un costo prevedibile. Un controllo dei limiti aggiunge un confronto e un salto a ogni accesso, cosa che i progettisti giudicarono troppo costosa, soprattutto nei cicli stretti. La filosofia è "fidati del programmatore" e "non paghi ciò che non usi".
- **Linguaggi che controllano**: Java, C#, Python e altri portano con ogni array la sua lunghezza e controllano ogni accesso, lanciando un'eccezione (`ArrayIndexOutOfBoundsException` in Java) in caso di violazione. L'overflow diventa un errore controllato e non sfruttabile.
- **La visione moderna del costo.** Il compilatore spesso riesce a dimostrare che un indice è nei limiti e a togliere il controllo, quindi il costo reale è di pochi punti percentuali. Rust ottiene la memory safety con i controlli dei limiti e un sistema di ownership verificato in compilazione, con prestazioni vicine al C, ed è per questo che oggi viene proposto come sostituto del C (slide 55 e Lezione 1).

### Slide 4 · Problems caused by buffer overflows

> - The first *Internet worm*, and all subsequent ones (CodeRed, Blaster, ...), exploited buffer overflows
> - Buffer overflows cause in the order of 50% of all security alerts
>   - Eg check out CERT, cve.mitre.org, or bugtraq
> - Trends
>   - Attacks are getting cleverer, defeating even more clever countermeasures
> - Attacks are getting easier to do, by script kiddies

**Approfondimento.**

- **I worm.** Il worm di Morris (1988) usava uno stack overflow in `fingerd` (che leggeva l'input con `gets`). **Code Red** (2001) sfruttava un overflow nel servizio di indicizzazione di Microsoft IIS; **Blaster** (2003) sfruttava il servizio DCOM RPC di Windows (MS03-026). Ognuno trasformò un solo bug di memory safety in una compromissione automatica su scala mondiale.
- **"About 50%".** Per due decenni i bug di memory safety sono stati circa la metà di tutte le vulnerabilità gravi. La quota è scesa nei linguaggi gestiti ma resta dominante nel codice C/C++: sia Microsoft sia Google riportano che circa il 70% delle loro vulnerabilità gravi sono problemi di memory safety.
- **Le fonti.** Il *CERT* (CERT/CC alla Carnegie Mellon) pubblica avvisi; *cve.mitre.org* è l'elenco CVE; *Bugtraq* era la storica mailing list della full disclosure.
- **Due tendenze opposte.** Gli attacchi diventano *più sofisticati* (superano ogni nuova difesa: a NX si è risposto con la return-oriented programming, ad ASLR con le fughe di informazioni) e allo stesso tempo *più facili da lanciare* (framework di exploit come Metasploit, strumenti punta-e-clicca), così anche gli "script kiddie" senza abilità possono usare exploit avanzati scritti da altri.

### Slide 5 · Problems caused by buffer overflows: who is at risk

> Any C(++) code acting on untrusted input is at risk. Eg
>
> - code taking input over untrusted network
>   - eg. sendmail, web browser, wireless network driver, ...
> - code taking input from untrusted user on multi-user system,
>   - esp. services running with high privileges (as ROOT on Unix/Linux, as SYSTEM on Windows)
> - code acting on untrusted files
>   - that have been downloaded or emailed
> - also embedded software, eg. in devices with (wireless) network connection such as mobile phones with Bluetooth, wireless smartcards, airplane navigation

**Approfondimento.** Il fattore comune è *l'input non fidato che raggiunge codice C/C++* (Lezione 1, slide 20-21).

- **Input dalla rete**: qualunque programma che analizza byte arrivati dalla rete: server di posta (sendmail), browser, e soprattutto il codice di basso livello come i driver wireless e Bluetooth, che elaborano nel kernel, con pieni privilegi, pacchetti scelti dall'attaccante (per esempio BroadPwn e gli overflow nei driver Wi-Fi Broadcom del 2017).
- **Servizi locali privilegiati**: un buffer overflow in un programma che gira come *root* o *SYSTEM*, o in un binario *setuid-root*, diventa un'escalation completa dei privilegi. È il privilegio in più a rendere prezioso il bug.
- **File non fidati**: un documento, un'immagine, un video o un font costruiti ad arte ed elaborati da un parser vulnerabile (una libreria multimediale, un lettore PDF, un motore di font) eseguono codice solo per essere stati aperti. È il caso di FFmpeg della Lezione 1 e il tipico vettore degli allegati di phishing.
- **Dispositivi embedded e wireless**: telefoni, smart card, automobili e avionica eseguono C con poche protezioni e sono difficili da aggiornare, quindi lì gli overflow sono sia probabili sia longevi.

### Slide 6 · Memory Management in C/C++

> - Program responsible for its memory management
> - Memory management is very error-prone
>   - Who here has had a C(++) program crash with a segmentation fault?
> - Typical bugs:
>   - Writing past the bound of an array
>   - Dangling pointers
>     - missing initialisation, bad pointer arithmetic, incorrect de-allocation, double de-allocation, failed allocation, ...
> - Memory leaks
> - For efficiency, these bugs are not detected at runtime, as discussed before:
>   - behaviour of a buggy program is undefined

**Approfondimento.** In C/C++ il programmatore alloca, usa e libera la memoria a mano, e ogni passo può andare storto. Le principali famiglie di errori di memoria (tutte sfruttabili, non solo crash):

- **Accesso fuori dai limiti** (il buffer overflow): leggere o scrivere prima dell'inizio o dopo la fine di un array (CWE-125 in lettura, CWE-787 in scrittura).
- **Puntatore pendente / use-after-free** (CWE-416): usare la memoria attraverso un puntatore dopo che è stata liberata; se l'allocatore ha riusato quella memoria per un altro oggetto, l'attaccante può corromperlo. Si causa liberando troppo presto, tenendo un puntatore a una variabile locale dopo il ritorno della funzione, ecc.
- **Inizializzazione mancante** (CWE-457): leggere una variabile non inizializzata o un blocco ottenuto con `malloc`, il cui contenuto è imprevedibile e può far uscire dati precedenti.
- **Aritmetica dei puntatori sbagliata**: calcolare male un indirizzo (off-by-one, dimensione dell'elemento sbagliata) e poi dereferenziarlo.
- **Free sbagliata o doppia** (CWE-415): liberare due volte lo stesso blocco, o liberare qualcosa che non è stato restituito da `malloc`, il che corrompe i metadati dell'allocatore.
- **Allocazione fallita**: `malloc` restituisce `NULL` quando fallisce; dereferenziarlo senza controllo manda in crash (o, in passato, era sfruttabile).
- **Memory leak** (CWE-401): non liberare mai la memoria; in un server che resta acceso a lungo è un denial of service lento.

Un *segmentation fault* è il sistema operativo che intercetta un accesso a una memoria che il processo non può toccare; molti bug di memoria *non* causano fault (corrompono memoria che il processo può usare), ed è proprio questo che li rende pericolosi e non solo fastidiosi.

## La memoria del processo e lo stack (pagine 7-13)

### Slide 7 · Process Memory Layout

![Lezione 3, pagina 7](L03_p07.webp "50% 1400x806")

**Figura.** Uno schema dello spazio di indirizzamento virtuale di un processo, con gli indirizzi alti in cima:

| Regione | Contenuto | Cresce |
| --- | --- | --- |
| Indirizzi alti | Argomenti della riga di comando / variabili d'ambiente | - |
|  | **Stack** | verso il basso, con le chiamate di procedura |
|  | *Memoria inutilizzata* (lo spazio in cui crescono stack e heap) | - |
|  | **Heap** (dati dinamici) | verso l'alto, per esempio con `malloc` e `new` |
|  | **Dati statici** (`.data`) | - |
| Indirizzi bassi | **Codice del programma** (`.text`) | - |

**Approfondimento.** La memoria di un programma in esecuzione è divisa in regioni, ognuna con uno scopo e dei permessi tipici:

- **Text (`.text`)**: il codice macchina. In sola lettura ed eseguibile, così il programma non può (e non deve) modificare le proprie istruzioni.
- **Dati statici/globali**: variabili che vivono per tutta l'esecuzione. `.data` contiene le globali inizializzate; `.bss` quelle inizializzate a zero. Lettura e scrittura, non eseguibili.
- **Heap**: la memoria allocata dinamicamente (`malloc`/`free`, `new`/`delete`), gestita dall'allocatore; cresce verso gli indirizzi più alti. Gli overflow qui sono *heap overflow*.
- **Stack**: variabili locali, parametri delle funzioni, indirizzi di ritorno salvati e registri salvati, organizzati in *record di attivazione* (stack frame). Su x86 e sulla maggior parte delle architetture lo stack cresce *verso il basso*, verso gli indirizzi più bassi. Gli overflow qui sono *stack overflow* (slide successive).
- **Argomenti/ambiente**: `argv` e le variabili d'ambiente, messi in cima.
- **La tensione chiave.** Lo stack cresce verso il basso e lo heap verso l'alto, nello spazio inutilizzato fra i due. Ma soprattutto un **buffer si riempie verso l'alto (verso gli indirizzi più alti) mentre lo stack cresce verso il basso**, quindi scrivere oltre la fine di un buffer sullo stack procede *verso* l'indirizzo di ritorno salvato, che sta a un indirizzo più alto del buffer. Questa opposizione è tutto il meccanismo del classico attacco di stack smashing.

### Slide 8-11 · Stack Overflow (il meccanismo)

![Lezione 3, pagina 8](L03_p08.webp "50% 1400x821")

![Lezione 3, pagina 9](L03_p09.webp "50% 1400x818")

![Lezione 3, pagina 10](L03_p10.webp "50% 1400x815")

![Lezione 3, pagina 11](L03_p11.webp "50% 1400x814")

**Figura.** La stessa immagine viene costruita in quattro slide. Lo stack delle chiamate è disegnato come una colonna di record di attivazione, con `AR main()` sopra `AR f()`. Il frame di `f` è mostrato in dettaglio a destra, dall'indirizzo alto (in cima) a quello basso (in fondo):

```
   x                 <- parameter of f (higher address)
   return address    <- where f returns to in main
   buf[4..7]         <- upper half of buf
   buf[0..3]         <- lower half of buf (lower address)
```

Il codice mostrato:

```c
void f(int x) {
    char buf[8];
    gets(buf);
}
void main() {
    f(...); ...
}
void format_hard_disk(){...}
```

Una freccia rossa mostra che far traboccare `buf` verso l'alto sovrascrive il **return address** salvato, dirottando il flusso di controllo del programma (nelle slide successive punta dentro `format_hard_disk`). `buf[0..3]` e `buf[4..7]` diventano rossi man mano che vengono sovrascritti. Una nuvoletta su `gets(buf)` dice **"NEVER use gets()!"**.

**Approfondimento: come funziona uno stack smash, passo per passo.**

1. **La chiamata.** Quando `main` chiama `f`, la CPU mette sullo stack il **return address** (l'indirizzo dell'istruzione di `main` dopo la chiamata); poi il prologo di `f` prepara il frame e riserva lo spazio per la variabile locale `buf`.
2. **La disposizione.** Poiché per costruire il frame lo stack è cresciuto *verso il basso*, `buf` sta a un indirizzo *più basso* del return address salvato. Il buffer si riempie dal suo inizio *verso l'alto*, cioè verso il return address.
3. **L'overflow.** `gets(buf)` copia l'input fino a un a capo o alla fine del file, **senza limite**. Se l'input è più lungo di 8 byte, continua a scrivere oltre `buf`, sopra `buf[4..7]`, poi sopra il return address salvato, poi sopra `x`.
4. **Il dirottamento.** Quando `f` termina, l'istruzione `ret` salta a qualunque valore si trovi ora dove c'era il return address. L'attaccante sceglie i byte in eccesso in modo che quel valore punti dove vuole lui: qui a `format_hard_disk`, una funzione che altrimenti non verrebbe mai chiamata. In un attacco reale punta a uno *shellcode* iniettato (codice messo nel buffer stesso) oppure, quando lo stack non è eseguibile, a codice già esistente (return-to-libc, ROP; Lezione 8).

**Perché `gets` non va mai usata.** A `gets(buf)` non si può passare la dimensione di `buf`; semplicemente non si può usare in modo sicuro con un input che l'attaccante può allungare. È stata tolta dallo standard C in C11. Il sostituto sicuro è `fgets(buf, sizeof buf, stdin)` (slide 14), che riceve la dimensione del buffer.

### Slide 12 · Stack Overflow: lots of details to get right

> - Lots of details to get right:
>   - No nulls in (character-)strings
>   - Filling in the correct return address:
>     - Fake return address must be precisely positioned
>     - Attacker might not know the address of his own string
>   - Other overwritten data must not be used before return from function
> - …

**Approfondimento.** Scrivere un exploit *affidabile* (non solo causare un crash) è delicato; questi sono gli ostacoli classici, e ognuno ha ispirato uno strumento o una tecnica:

- **Niente byte NUL.** Le funzioni sulle stringhe (`gets`, `strcpy`) si fermano al primo `'\0'`. Se il payload deve contenere un byte zero (frequente negli indirizzi), la copia si ferma lì e tronca l'exploit. Gli attaccanti costruiscono shellcode senza NUL (alfanumerico o automodificante) per evitarlo.
- **Un return address preciso.** Il return address sovrascritto deve cadere esattamente nella posizione del return address salvato e contenere un bersaglio utilizzabile. L'attaccante deve conoscere la disposizione dello stack e la distanza del buffer da quella posizione.
- **Non conoscere l'indirizzo esatto del payload.** Gli indirizzi dello stack cambiano da un'esecuzione all'altra (e ASLR li rende casuali di proposito). Il vecchio rimedio è una **NOP sled**: una lunga serie di istruzioni che non fanno nulla prima dello shellcode, così che anche un salto approssimativo scivoli fino al payload.
- **I dati collaterali devono sopravvivere.** L'overflow sovrascrive anche le altre variabili locali e i registri salvati fra `buf` e il return address; se la funzione li usa *prima* di ritornare, può andare in crash prima. Il payload deve mantenere sensati quei valori.

Questi dettagli sono ciò che rende lo sfruttamento un'abilità, e anche ciò a cui mirano le contromisure (i canary rilevano la sovrascrittura, ASLR nasconde gli indirizzi, NX impedisce di eseguire il buffer).

### Slide 13 · Stack Overflow: stack vs heap, and causes

> - **Stack overflow** is overflow of a buffer allocated on the stack
> - **Heap overflow** idem, of buffer allocated on the heap
>
> Common causes:
>
> - poor programming with of arrays and strings
>   - esp. library functions for null-terminated strings
> - problems with format strings
>
> But other low-level coding defects than can result in buffer overflows, eg integer overflows or data races

**Approfondimento.**

- **Stack overflow e heap overflow.** Uno stack overflow sovrascrive la disposizione ordinata del frame (variabili locali, registri salvati, return address), quindi colpisce nel modo più diretto il return address. Uno heap overflow sovrascrive qualunque cosa segua il buffer sullo heap: oggetti adiacenti o i metadati dell'allocatore (intestazioni dei chunk, puntatori delle free list). Gli exploit sullo heap corrompono quei metadati in modo che una `malloc`/`free` successiva scriva un valore scelto dall'attaccante a un indirizzo scelto dall'attaccante. Soprattutto, **gli stack canary non proteggono lo heap** (slide 43).
- **La causa più comune**: l'uso sbagliato delle funzioni C sulle stringhe terminate da NUL (`strcpy`, `strcat`, `sprintf`, `gets`), trattate più avanti.
- Le **format string** (dalla slide 37 in poi) sono una seconda strada verso la stessa corruzione della memoria.
- **Cause indirette**: un *integer overflow* produce una dimensione sbagliata (troppo piccola, o negativa e diventata enorme) che poi viene usata in un'allocazione o in una copia, causando un buffer overflow (slide 22-23, 29-32); una *data race* (Lezione 11) può far cambiare una dimensione o un puntatore fra un controllo e il suo uso.

## Spot the defect: le funzioni sulle stringhe (pagine 14-21)

### Slide 14 · Example: gets()

```c
char buf[20];
gets(buf); // read user input until
           // first EoL or EoF character
```

> - Never use gets
> - Use fgets(buf, size, stdin) instead

**Analisi del codice.**

- *Vulnerabilità.* `gets` legge dallo standard input in `buf` fino a un a capo o alla fine del file, **senza alcun modo di limitare il numero di byte**. Qualunque input più lungo di 19 caratteri (20 meno il terminatore) fa traboccare `buf` e distrugge lo stack. È la CWE-242, Use of Inherently Dangerous Function.
- *Correzione.* `fgets(buf, sizeof buf, stdin)` legge al più `sizeof buf - 1` caratteri e termina sempre con NUL. Si noti che `fgets` mantiene l'a capo finale, che `gets` toglieva, quindi il codice che contava su questo deve rimuoverlo:

```c
char buf[20];
if (fgets(buf, sizeof buf, stdin) != NULL) {
    buf[strcspn(buf, "\n")] = '\0';   // remove the trailing newline, if any
}
```

### Slide 15 · Example: strcpy()

```c
char dest[20];
strcpy(dest, src); // copies string src to dest
```

> - strcpy assumes that
>   - dest is long enough
>   - src is null-terminated
> - Use strncpy(dest, src, size) instead

**Analisi del codice.**

- *Vulnerabilità.* `strcpy` copia byte da `src` finché non incontra un `'\0'`, senza sapere nulla della dimensione di `dest`. Se `src` è più lunga di 19 caratteri, o non è affatto terminata da NUL (così la copia prosegue finché non incontra per caso un byte zero da qualche parte in memoria), `dest` trabocca. Le due ipotesi non dette, "`dest` è abbastanza lungo" e "`src` è terminata da NUL", sono proprio ciò che un attaccante viola.
- *Correzione.* `strncpy(dest, src, sizeof dest)` copia al più `sizeof dest` byte, ma con la sottigliezza che la slide 21 rende esplicita: `strncpy` **non** aggiunge un terminatore se la sorgente è troppo lunga, quindi il risultato può non essere terminato. L'idioma davvero sicuro limita la lunghezza e forza la terminazione (slide 21), e meglio ancora si usano `snprintf` o la `strlcpy` di BSD.

### Slide 16-17 · Spot the defect: strncat

```c
char buf[20];
char prefix[] = "http://";
...
strcpy(buf, prefix);
   // copies the string prefix to buf
strncat(buf, path, sizeof(buf));
   // concatenates path to the string buf
```

**La risposta del docente (pagina 17):** *"strncat's 3rd parameter is number of chars to copy, not the buffer size. Another common mistake is giving sizeof(path) as 3rd argument..."*

**Analisi del codice.**

- *Vulnerabilità.* Il terzo argomento di `strncat(dst, src, n)` è il **numero massimo di caratteri da aggiungere**, *non* la dimensione del buffer di destinazione. `strncat` scrive fino a `n` caratteri **più** un `'\0'` finale, e li aggiunge *dopo* il contenuto già presente in `dst`. Qui `buf` contiene già `"http://"` (7 caratteri), e il codice permette poi di aggiungerne fino a `sizeof(buf)` = 20, quindi può scrivere 7 + 20 + 1 = 28 byte in un buffer di 20 byte: un overflow.
- Anche "l'altro errore comune", cioè passare `sizeof(path)`, è altrettanto sbagliato: limita la copia con la dimensione della *sorgente*, che di nuovo non ha nulla a che fare con lo spazio rimasto in `dst`.
- *Correzione.* Il terzo argomento deve essere lo **spazio rimasto** nella destinazione, lasciando posto al terminatore:

```c
char buf[20];
strcpy(buf, "http://");                    // 7 chars + '\0'
strncat(buf, path, sizeof(buf) - strlen(buf) - 1);  // only the space left
```

Oppure, in modo più robusto, costruire l'intera stringa con una chiamata che controlla la dimensione:

```c
char buf[20];
int n = snprintf(buf, sizeof buf, "http://%s", path);
if (n < 0 || (size_t)n >= sizeof buf) {
    /* output was truncated: handle the error */
}
```

`snprintf` rispetta sempre la dimensione del buffer e termina sempre con NUL (quando la dimensione non è zero), e restituisce la lunghezza che *avrebbe* scritto, quindi il troncamento si può rilevare. La `strlcat(buf, path, sizeof buf)` di BSD (slide 48) riceve direttamente la dimensione della destinazione ed è un'altra correzione pulita.

### Slide 18-20 · Spot the defect: strncpy non terminata

```c
char src[9]; char dest[9];
char base_url = "www.ru.nl";
strncpy(src, base_url, 9);
    // copies base_url to src
strcpy(dest, src);
    // copies src to dest
```

**La risposta del docente (pagine 19-20):** *"base\_url is 10 chars long, incl. its null terminator, so src won't be null-terminated ... so strcpy will overrun the buffer dest."*

**Analisi del codice.**

- *La situazione.* `"www.ru.nl"` sono 9 caratteri visibili più il terminatore = **10 byte**. (La slide scrive `char base_url = ...`, che dovrebbe essere `char base_url[] = ...` o `char *base_url = ...`; la forma con un solo carattere non compila, ed è un refuso.)
- *Vulnerabilità.* `strncpy(src, base_url, 9)` copia esattamente 9 byte, le 9 lettere, e si ferma **prima** del terminatore. La proprietà critica di `strncpy`: se la sorgente è lunga quanto il conteggio o di più, **non** aggiunge un `'\0'`. Così `src` contiene 9 lettere e *non* è terminata da NUL.
- *La conseguenza.* `strcpy(dest, src)` copia poi da `src` finché non trova un `'\0'`. Poiché `src` non ne ha, `strcpy` legge oltre la fine di `src`, attraverso tutti i byte che seguono in memoria, finché non inciampa in un byte zero, e li scrive tutti nel `dest` di 9 byte: un overflow di `dest` (e una lettura oltre i limiti di `src`). È la CWE-170, Improper Null Termination.
- *Correzione.* Riservare lo spazio per il terminatore e impostarlo in modo esplicito, e rendere `dest` abbastanza grande:

```c
char src[10], dest[10];
const char *base_url = "www.ru.nl";
strncpy(src, base_url, sizeof src - 1);
src[sizeof src - 1] = '\0';          // guarantee termination
strcpy(dest, src);                   // now safe: src fits and is terminated
```

### Slide 21 · Example: strcpy and strncpy (l'idioma corretto)

> Don't replace `strcpy(dest, src)` by `strncpy(dest, src, sizeof(dest))` but by
>
> `strncpy(dest, src, sizeof(dest)-1)`
>
> `dst[sizeof(dest-1)] = '\0';`
>
> if dest should be null-terminated!
>
> Btw: a *strongly typed programming language* could of course enforce that strings are always null-terminated...

**Approfondimento.** Questa slide enuncia la regola dietro i due difetti precedenti. Poiché `strncpy` non termina quando la sorgente è troppo lunga, il sostituto sicuro è:

```c
strncpy(dest, src, sizeof(dest) - 1);   // copy at most size-1 bytes
dest[sizeof(dest) - 1] = '\0';          // force the terminator into the last slot
```

- **Nota sulla seconda riga della slide.** Dice `dst[sizeof(dest-1)]`, che è un refuso: `sizeof(dest-1)` prenderebbe la dimensione di un *puntatore* (perché `dest-1` è aritmetica dei puntatori che fa decadere l'array a puntatore), non la dimensione dell'array meno uno. L'espressione voluta è `dest[sizeof(dest) - 1] = '\0';`. Anche la variabile è `dest`, non `dst`. Scrivere esattamente giusto questo è già di per sé facile da sbagliare, ed è il punto più profondo della slide.
- **`strncpy` ha una seconda trappola**: se la sorgente è *più corta* del conteggio, `strncpy` riempie il resto della destinazione con byte `'\0'`, il che può costare in prestazioni per buffer grandi. `strncpy` fu progettata per campi a larghezza fissa, non per copiare stringhe in modo sicuro; `snprintf` o `strlcpy` esprimono meglio l'intenzione.
- **L'osservazione finale** ripete il tema del corso: un sistema di tipi più forte (un vero tipo stringa che porta sempre con sé lunghezza e terminatore, come in Java, C#, Rust o lo `std::string` del C++) elimina per costruzione tutta questa classe di bug.

## Spot the defect: problemi con gli interi e parsing sbagliato (pagine 22-36)

### Slide 22-25 · Spot the defect: lunghezza negativa dalla rete

```c
char *buf;
int i, len;
read(fd, &len, sizeof(len));
       // read sizeof(len) bytes, ie. an int
       // and store these in len
buf = malloc(len);
read(fd, buf, len);
```

**La risposta del docente (pagine 23-25):** *"We forget to check for bytes representing a negative int, so len might be negative ... len cast to unsigned and negative length overflows ... read then goes beyond the end of buf."* E poi: *"Remaining problem may be that buf is not null-terminated."*

**Analisi del codice.** È il classico bug del "campo lunghezza arrivato dalla rete", la forma di innumerevoli CVE reali.

- *Vulnerabilità 1: lunghezza con segno controllata dall'attaccante.* `len` è un `int` con segno letto direttamente dal file o dal socket, quindi l'attaccante lo controlla del tutto, valori **negativi** compresi. Niente lo valida.
- *Vulnerabilità 2: la conversione da signed a unsigned.* `malloc` riceve un `size_t`, che è **senza segno**. Un `int` negativo come -1 si converte in un `size_t` enorme (a 64 bit, 2^64 - 1). L'allocazione allora o fallisce (restituendo `NULL`, che viene usato senza controllo) oppure, per un valore come un numero negativo che si riavvolge in una dimensione positiva piccola, riesce con un buffer molto più piccolo di quanto l'attaccante faccia credere.
- *Vulnerabilità 3: la lettura/scrittura oltre i limiti.* Anche il terzo argomento di `read` è un `size_t`; il `len` negativo diventa un conteggio enorme, quindi `read` scrive molto oltre la fine di `buf`: uno heap overflow guidato soltanto dal campo lunghezza.
- *Problema residuo (slide 24).* Anche dopo aver corretto la lunghezza, `buf` contiene byte grezzi senza terminatore, quindi qualunque operazione sulle stringhe fatta dopo legge oltre i limiti.
- *Correzione (slide 25 più la validazione).* La slide aggiunge un byte e termina la stringa:

```c
buf = malloc(len + 1);
read(fd, buf, len + 1);   // the slide's correction
buf[len] = '\0';          // null terminate buf
```

ma la vera correzione deve *prima validare la lunghezza*, perché senza questo anche `len + 1` può riavvolgersi:

```c
int32_t len;
if (read_full(fd, &len, sizeof len) != sizeof len)   return -1;
if (len < 0 || len > MAX_MESSAGE)                     return -1;  // reject hostile lengths
char *buf = malloc((size_t)len + 1);
if (buf == NULL)                                      return -1;  // check malloc
if (read_full(fd, buf, (size_t)len) != (size_t)len) { free(buf); return -1; }
buf[len] = '\0';
```

(`read` può anche restituire *meno* byte di quelli richiesti, quindi una versione corretta ripete la lettura finché arrivano `len` byte, qui mostrata come `read_full`.) Si definisce un limite superiore ragionevole `MAX_MESSAGE` e si rifiuta tutto ciò che sta fuori da `[0, MAX_MESSAGE]`.

### Slide 26 · Absence of language-level security

> In programming languages with "security" provisions, the programmer would not have to worry about
>
> - writing past the bounds of the array (`IndexOutOfBoundsException` for example)
> - implicit conversion from signed to unsigned integers (forbidden or warned by compiler/typechecker)
> - `malloc` returning null value (`OutOfMemoryException` for example)
> - `malloc` non initializing memory (by default)
> - integer overflow (`IntegerOverflowException` for example)

**Approfondimento.** Ogni bug delle slide precedenti esiste perché il C lascia questi cinque controlli al programmatore. Un linguaggio più sicuro elimina intere classi in un colpo solo:

- I **controlli dei limiti** trasformano un overflow in un'eccezione catturata (la `ArrayIndexOutOfBoundsException` di Java, un `IndexError` di Python, un panic di Rust).
- Le **conversioni fra signed e unsigned** sono vietate o segnalate (Java non ha tipi senza segno in questo senso; Rust richiede un cast esplicito e la conversione con `as` è visibile; in C `-Wconversion`/`-Wsign-conversion` danno un avviso).
- Il **fallimento di un'allocazione** è un'eccezione o un `Result`, non un `NULL` silenzioso che poi viene dereferenziato.
- **La memoria è inizializzata a zero per impostazione predefinita** (i campi Java, Go), quindi niente letture di valori non inizializzati.
- L'**integer overflow** viene rilevato: gli interi di Python sono illimitati; C# ha i blocchi `checked`; Rust va in panic sull'overflow nelle build di debug e offre `checked_add`, `saturating_add`, `wrapping_add`. In C, `-fsanitize=undefined` rileva l'overflow con segno durante l'esecuzione.

La morale ricorrente della lezione: la stessa disciplina che un linguaggio sicuro impone in automatico, in C va applicata a mano, su ogni riga.

### Slide 27-28 · Spot the defect: dimensioni ANSI/Unicode che non coincidono (il bug di Code Red)

```c
#ifdef UNICODE
#define _sntprintf _snwprintf
#define TCHAR wchar_t
#else
#define _sntprintf _snprintf
#define TCHAR char
#endif

TCHAR buff[MAX_SIZE];
_sntprintf(buff, sizeof(buff), "%s\n", input);
```

**La risposta del docente (pagina 28):** *"\_snwprintf's 2nd param is # of chars in buffer, not # of bytes. The CodeRed worm exploited such an ANSI/Unicode mismatch."*

**Analisi del codice.** È un idioma di Windows: `TCHAR` è `char` in una build ANSI e `wchar_t` (2 byte su Windows) in una build Unicode, e `_sntprintf` corrisponde alla funzione stretta o larga adatta.

- *Vulnerabilità.* L'argomento di conteggio della funzione larga `_snwprintf` è un **numero di caratteri**, non un numero di **byte**. In una build Unicode ogni carattere occupa 2 byte, quindi `sizeof(buff)` = `MAX_SIZE * 2` byte. Passare `sizeof(buff)` come numero di caratteri dice a `_snwprintf` che può scrivere `MAX_SIZE * 2` caratteri larghi, cioè fino a `MAX_SIZE * 4` byte, in un buffer di soli `MAX_SIZE * 2` byte: un overflow del doppio.
- *La trappola generale*: confondere `sizeof` (byte) con il numero di elementi ogni volta che l'elemento è più grande di un byte. Nella build ANSI è invisibile (lì `char` occupa 1 byte e i numeri coincidono), quindi sopravvive ai test e si rompe solo nella configurazione Unicode.
- *L'impatto reale*: **Code Red** (2001) sfruttava proprio questo tipo di confusione fra lunghezze ANSI e Unicode nella gestione degli URL di Microsoft IIS per far traboccare un buffer, e si diffuse su centinaia di migliaia di server.
- *Correzione.* Passare la dimensione nell'unità che la funzione si aspetta, il numero di elementi, con un conteggio che funziona in entrambe le build:

```c
TCHAR buff[MAX_SIZE];
_sntprintf(buff, _countof(buff), _T("%s\n"), input);  // _countof = sizeof(a)/sizeof(a[0])
buff[_countof(buff) - 1] = _T('\0');                  // _sntprintf may not NUL-terminate on overflow
```

`_countof(buff)` è `sizeof(buff)/sizeof(buff[0])`, il numero di elementi qualunque sia la larghezza dei caratteri. Si noti anche che su Windows `_sntprintf`/`_snprintf` non terminano sempre con NUL in caso di troncamento, quindi il terminatore va imposto.

### Slide 29-30 · Spot the defect: overflow di uno short in una lunghezza

```c
#define MAX_BUF = 256
void BadCode (char* input)
{   short len;
    char buf[MAX_BUF];
    len = strlen(input);
    if (len < MAX_BUF) strcpy(buf, input);
}
```

![Lezione 3, pagina 30 (2)](L03_p30_2.webp "50% 1188x405")

**La risposta del docente (pagina 30):** *"What if input is longer than 32K? len will be a negative number, due to integer overflow, hence: potential buffer overflow. The integer overflow is the root problem, but the buffer overflow that this enables make it exploitable."*

**Analisi del codice.**

- *Vulnerabilità.* `len` è uno `short`, di solito un intero con segno a 16 bit, con intervallo da -32768 a 32767. `strlen(input)` restituisce un `size_t`; se `input` è più lungo di 32767 byte, assegnarlo a `short len` va in overflow, e `len` diventa **negativo** (per esempio una lunghezza di 32768 diventa -32768). Il controllo `if (len < MAX_BUF)` allora passa banalmente, perché un numero negativo è minore di 256, e `strcpy` copia tutto l'`input` troppo lungo nel `buf` di 256 byte: un grosso stack overflow.
- *La catena delle cause.* La **causa di fondo è l'integer overflow** (un tipo troppo stretto che contiene una dimensione controllata dall'attaccante), e il **buffer overflow è la conseguenza sfruttabile**. È il punto ricorrente della lezione: un bug sugli interi diventa un bug di memory safety quando il numero sbagliato viene usato come dimensione.
- *Nota a margine.* `#define MAX_BUF = 256` è già di per sé sbagliato: la macro si espande in `= 256`, quindi `char buf[MAX_BUF]` diventa `char buf[= 256]`, che non compila. La forma corretta è `#define MAX_BUF 256` (senza `=`).
- *Correzione.* Usare il tipo giusto (senza segno e abbastanza largo) e confrontare con la capacità reale:

```c
#define MAX_BUF 256
void betterCode(const char *input) {
    size_t len = strlen(input);          // size_t: unsigned, cannot go negative
    if (len < MAX_BUF) {                 // room for the terminator too (len <= 255)
        char buf[MAX_BUF];
        memcpy(buf, input, len + 1);     // or snprintf(buf, sizeof buf, "%s", input);
    } else {
        /* input too long: reject it */
    }
}
```

### Slide 31-32 · Spot the defect: integer overflow nella dimensione di un'allocazione

```c
bool CopyStructs(InputFile* f, long count)
{   structs = new Structs[count];
    for (long i = 0; i < count; i++)
        { if !(ReadFromFile(f,&structs[i])))
              break;
        }
}
```

**La risposta del docente (pagina 32):** *"effectively does a malloc(count\*sizeof(type)) which may cause integer overflow. And this integer overflow can lead to a buffer overflow. (Microsoft Visual Studio 2005(!) C++ compiler adds check to prevent this)."*

**Analisi del codice.**

- *Vulnerabilità.* `new Structs[count]` deve allocare `count * sizeof(Structs)` byte. Se `count` è controllato dall'attaccante (arriva dal file che si sta analizzando) ed è grande, il prodotto **va in overflow** nell'intero usato per calcolare la dimensione dell'allocazione e si riavvolge in un valore piccolo. L'allocatore restituisce allora un buffer *piccolo*, ma il ciclo itera comunque `count` volte scrivendo `structs[i]`, molto oltre la piccola allocazione: uno heap overflow. (Sui sistemi a 32 bit, con `count` intorno a 2^28 e una struttura di 16 byte, il prodotto si riavvolge oltre 2^32.)
- *Perché è subdolo*: la moltiplicazione è implicita nel `new` di array, quindi non c'è nessun `*` visibile da segnalare. Lo stesso bug si ha con una `malloc(count * size)` scritta a mano.
- *Nota storica*: l'osservazione della slide che Visual Studio 2005 aggiunse un controllo automatico dell'overflow sul `new` di array mostra che perfino i produttori di compilatori lo consideravano abbastanza comune da mitigarlo nella toolchain.
- *Correzione.* Controllare la moltiplicazione prima di allocare, e allocare con una primitiva che controlla al suo interno:

```c
if (count < 0 || (size_t)count > SIZE_MAX / sizeof(Structs))
    return false;                               // product would overflow: reject
Structs *structs = (Structs*)calloc((size_t)count, sizeof(Structs));  // calloc checks count*size
if (structs == NULL)
    return false;
```

`calloc(n, size)` è tenuta a rilevare l'overflow di `n * size` e a fallire in modo sicuro; in C++ il `new` di array standard ora lancia `std::bad_array_new_length` in caso di overflow. Validare sempre prima `count` rispetto a un massimo ragionevole.

### Slide 33-36 · Spot the defect: ciclo di copia di un URL scritto a mano

```c
char buff1[MAX_SIZE], buff2[MAX_SIZE];
// make sure url a valid URL and fits in buff1 and buff2:
if (!isValid(url)) return;
if (strlen(url) > MAX_SIZE - 1) return;
// copy url up to first separator, ie. first '/', to buff1
out = buff1;
do {
   // skip spaces
    if (*url != ' ') *out++ = *url;
} while (*url++ != '/');
strcpy(buff2, buff1);
...
```

**Le risposte del docente (pagine 34-36):** *"what if there is no '/' in the URL?"* - la correzione di pagina 35 aggiunge `&& (*url != 0)` alla condizione del ciclo - e poi pagina 36: *"Order of tests is wrong (note the first test includes ++). What about 0-length URLs? Is buff1 always null-terminated?"*

**Analisi del codice.** Il ciclo copia i caratteri di `url` in `buff1`, saltando gli spazi, finché non incontra una `/`. Ci sono diversi difetti nascosti.

- *Difetto 1: nessun controllo del terminatore (pagine 33-34).* Il ciclo si ferma solo su `/`. Se l'URL non contiene `/`, il `while (*url++ != '/')` continua a leggere e copiare oltre la fine della stringa `url` (oltre il suo `'\0'`), attraverso memoria qualunque, facendo traboccare `buff1`. Il controllo iniziale `strlen(url) <= MAX_SIZE-1` *non* lo salva, perché quella lunghezza è misurata "fino al primo null", mentre il ciclo può andare oltre quel null.
- *Difetto 2: l'ordine sbagliato dei test (pagine 35-36).* La correzione di pagina 35 aggiunge `&& (*url != 0)`, ma la prima clausola `*url++ != '/'` ha già **incrementato `url`** (post-incremento) prima che venga valutata la seconda, quindi il byte zero viene controllato una posizione troppo tardi, dopo che `url` l'ha già superato. Gli effetti collaterali (`++`) in una condizione composta valutata da sinistra a destra rendono il controllo off-by-one.
- *Difetto 3: URL di lunghezza zero.* Un `do ... while` esegue il corpo almeno una volta, quindi anche un URL vuoto viene elaborato, leggendo `*url` quando potrebbe non esserci nulla di valido da leggere.
- *Difetto 4: `buff1` non terminato da NUL.* Il ciclo copia i caratteri ma non scrive mai un `'\0'` in `buff1`. La successiva `strcpy(buff2, buff1)` legge allora oltre la fine di `buff1` finché non trova un byte zero, facendo traboccare `buff2` (lo stesso bug di mancata terminazione delle slide 18-20).
- *Correzione.* Fermarsi sul separatore **o** sul terminatore, limitare in modo esplicito l'indice di uscita, e terminare il risultato:

```c
char buff1[MAX_SIZE], buff2[MAX_SIZE];
if (!isValid(url)) return;
if (strlen(url) > MAX_SIZE - 1) return;

size_t j = 0;
for (size_t i = 0; url[i] != '\0' && url[i] != '/' && j < MAX_SIZE - 1; i++) {
    if (url[i] != ' ')
        buff1[j++] = url[i];
}
buff1[j] = '\0';                 // always terminate
if (j < sizeof buff2)            // buff1 now fits, and is terminated
    strcpy(buff2, buff1);
```

La condizione controlla il terminatore *e* il separatore *prima* di avanzare, e un indice di uscita separato `j` viene tenuto strettamente sotto `MAX_SIZE - 1`, così il buffer non può mai essere superato.

## Format string (pagine 37-39)

### Slide 37 · Spot the defect: printf(argv\[1\])

```c
#include <stdio.h>
int main(int argc, char* argv[])
{   if (argc > 1)
        printf(argv[1]);
    return 0;
}
```

> This program is vulnerable to *format string attacks*, where calling the program with strings containing special characters can result in a buffer overflow attack.

**Analisi del codice.**

- *Vulnerabilità.* Il primo argomento di `printf` è una **format string**, e qui è `argv[1]`, che arriva direttamente dall'attaccante. Se l'argomento contiene specificatori di formato (`%x`, `%s`, `%n`, ...), `printf` li interpreta e legge (o scrive) argomenti che non sono mai stati passati. È la CWE-134, Use of Externally-Controlled Format String. Le format string sono anticipate qui e sono l'argomento della Lezione 4.
- *Correzione.* Non passare mai dati non fidati come format string. Fornire un formato costante e mettere i dati in un argomento:

```c
printf("%s", argv[1]);   // argv[1] is data, not a format
```

### Slide 38 · Format String attacks

> - Complete new type of attack, invented/discovered in 2000. Like integer overflows, it can lead to buffer overflows.
> - Strings can contain special characters, eg `%s` in `printf("Cannot find file %s", filename);` Such strings are called format strings
> - What happens if we execute the code below? `printf("Cannot find file %s");`
> - What may happen if we execute `printf(string)` where string is user-supplied? Esp. if it contains special characters, eg `%s`, `%x`, `%n`, `%hn`?

**Approfondimento.**

- Una format string dice a `printf` quanti argomenti aspettarsi e di che tipo. In una chiamata corretta, `printf("...%s...", filename)`, il numero di specificatori coincide con il numero di argomenti in più, e tutto va bene.
- `printf("Cannot find file %s")` ha un `%s` ma **nessun argomento corrispondente**. `printf` legge comunque dove *sarebbe* quell'argomento (la posizione successiva secondo la convenzione di chiamata: un registro o una posizione dello stack) e tratta come `char*` qualunque cosa ci sia, poi la dereferenzia, di solito andando in crash o facendo uscire memoria.
- `printf(string)` con una `string` controllata dall'attaccante gli permette di mettere *qualunque* specificatore voglia, trasformando un'istruzione di stampa in uno strumento per leggere e scrivere la memoria (dettagli di seguito).

### Slide 39 · Format String attacks: %x and %n

> - `%x` reads and prints 4 bytes from stack
>   - this may leak sensitive data
> - `%n` writes the number of characters printed so far onto the stack
>   - this allow stack overflow attacks...
> - Note that format strings break the "don't mix data & code" principle.
> - Easy to spot & fix: replace `printf(str)` by `printf("%s", str)`

**Approfondimento.**

- **`%x` legge la memoria (divulgazione di informazioni).** Ogni `%x` fa prendere a `printf` il successivo "argomento" dallo stack e lo stampa in esadecimale. Poiché non sono stati forniti argomenti veri, si tratta in realtà del contenuto dello stack: registri salvati, variabili locali, puntatori, forse segreti come lo stack canary o indirizzi che rendono inutile ASLR. Una stringa `%x %x %x ...` scarica lo stack verso l'alto. `%s` è peggio: tratta il valore preso come un puntatore e stampa la stringa a cui punta, facendo uscire memoria arbitraria (o andando in crash).
- **`%n` scrive la memoria (quello pericoloso).** `%n` è insolito: invece di stampare, **scrive** il numero di caratteri stampati fino a quel momento all'indirizzo dato dall'argomento corrispondente. Con una format string controllata, l'attaccante mette nella stringa un indirizzo bersaglio e usa gli specificatori di larghezza (per esempio `%100x`) per controllare il conteggio, scrivendo un valore arbitrario a un indirizzo arbitrario: basta per sovrascrivere un return address o un puntatore a funzione e prendere il controllo. `%hn` scrive uno `short` a 16 bit, usato per scrivere un indirizzo di 4 byte due byte alla volta.
- **Il principio.** I bug di format string sono una violazione da manuale del *"non mescolare dati e codice"*: i dati dell'utente (la stringa) vengono interpretati come codice (direttive di formato). È la stessa causa di fondo dei buffer overflow (dati trattati come un return address) e dell'injection (dati trattati come SQL o HTML), una delle tre generalizzazioni della slide 54.
- **La correzione è banale**: usare una format string costante, `printf("%s", str)`. Proprio perché è così facile da individuare e correggere, i compilatori danno un avviso (`-Wformat -Wformat-security`), e `%n` è disattivato o limitato su molte piattaforme (Windows, FORTIFY\_SOURCE).

## Contromisure (pagine 40-52)

### Slide 40 · Dynamic Countermeasures

> Protection by kernel
>
> - Non-executable memory (NOEXEC) - Prevents attacker executing her code
> - Address space layout randomisation (SLR) - Generally makes attacker's life harder
> - Instruction set randomisation - Hardware support needed to make this efficient enough
>
> Protection inserted by the compiler
>
> - Stack canaries to prevent or detect malicious changes to the stack; examples to follow
> - Obfuscation of memory addresses
>
> Doesn't prevent against heap overflows

**Approfondimento.** Queste difese non tolgono il bug; rendono più difficile *sfruttarlo*. La Lezione 8 le tratta a fondo.

- **Memoria non eseguibile (NX / DEP / W^X).** La memoria è o scrivibile o eseguibile, mai entrambe le cose. Le pagine di dati (stack, heap) sono marcate come non eseguibili, quindi lo shellcode scritto in un buffer non può partire. Lo impone il bit NX della CPU. Gli attaccanti rispondono con il **riuso del codice** (return-to-libc, return-oriented programming), che esegue codice esistente invece di iniettarne di nuovo.
- **Address Space Layout Randomisation (ASLR; la "SLR" della slide).** Gli indirizzi base di stack, heap, librerie e (con PIE) dell'eseguibile vengono resi casuali a ogni esecuzione, quindi l'attaccante non può scrivere nell'exploit gli indirizzi che gli servono. Si aggira con una *fuga di informazioni* (per esempio un bug di format string con `%x`, slide 39) che rivela un indirizzo, o con la forza bruta sui sistemi a 32 bit, dove l'entropia è piccola.
- **Instruction Set Randomisation (ISR).** Le istruzioni del programma sono codificate (per esempio con uno XOR) con una chiave segreta, quindi il codice iniettato, non codificato con quella chiave, si decodifica in spazzatura e va in fault. Per essere efficiente richiede supporto hardware o emulazione, quindi è per lo più ricerca.
- **Stack canary** e **offuscamento degli indirizzi** sono inseriti dal compilatore (slide successive).
- **L'avvertenza cruciale della slide: nessuna di queste difese ferma gli heap overflow.** I canary proteggono il return address sullo *stack*; NX e ASLR alzano l'asticella ovunque ma non impediscono di corrompere i dati o i metadati dello heap.

### Slide 41 · Dynamic Countermeasures: Stack Canaries

> - introduced in StackGuard in gcc
> - a dummy value - stack canary or cookie - is written on the stack in front of the return address and checked when function returns
> - a careless stack overflow will overwrite the canary, which can then be detected.
> - a careful attacker can overwrite the canary with the correct value.
> - additional countermeasures:
>   - use a random value for the canary
>   - XOR this random value with the return address
>   - include string termination characters in the canary value

**Approfondimento.** Il nome viene dal "canarino nella miniera di carbone": una sentinella che muore per prima per avvisare del pericolo.

- **Il meccanismo.** Il prologo della funzione scrive sullo stack un valore segreto (il canary o cookie) **fra i buffer locali e il return address salvato**. L'epilogo, subito prima di `ret`, lo rilegge e lo confronta con il riferimento conservato. Un overflow lineare che arriva al return address deve prima sovrascrivere il canary, quindi la differenza viene rilevata e il programma si interrompe (`*** stack smashing detected ***`) invece di tornare al codice dell'attaccante.
- **La debolezza.** Un attaccante che può *leggere* il canary (con una fuga di informazioni) o che sovrascrive la memoria in modo non lineare (per esempio attraverso un puntatore) può lasciare intatto il canary o riscriverlo con il suo valore corretto, rendendo inutile il controllo.
- **Irrobustire il canary** (i tre sottopunti):
  - *Valore casuale*: scegliere il canary a caso all'avvio del programma, così non si può indovinare. (È il design standard **terminator-and-random**.)
  - *XOR con il return address*: conservare `canary XOR return_address`, così il controllo rileva anche un return address cambiato e il canary corretto da solo non basta.
  - *Terminator canary*: includere nel canary byte che terminano le stringhe (`'\0'`, `'\n'`, `0xFF`), così le funzioni sulle stringhe come `strcpy`, che si fermano su quei byte, non possono copiarvi attraverso un canary falsificato.
- In GCC/Clang sono `-fstack-protector`, `-fstack-protector-strong` (l'impostazione predefinita più comune) e `-fstack-protector-all`; su Windows è `/GS`.

### Slide 42 · Further Improvements

> - **PointGuard** - also protects other data values, eg function pointers, with canaries
> - **ProPolice's Stack Smashing Protection (SSP)** by IBM - also re-orders stack elements to reduce potential for trouble
> - **Stackshield** has a special stack for return addresses, and can disallow function pointers to the data segment

**Approfondimento.**

- **PointGuard** cifra i puntatori in memoria (compresi i puntatori a funzione) facendone lo XOR con una chiave segreta, e li decifra solo quando un puntatore viene usato. Un attaccante che sovrascrive un puntatore cifrato non può controllare dove punterà dopo la decifratura. Generalizza l'idea del canary dal return address a tutti i puntatori.
- **ProPolice / SSP** (IBM, la base dello stack protector di GCC) aggiunge un canary *e* **riordina le variabili locali** in modo che gli array (i buffer) stiano nel frame *sopra* le variabili scalari e i puntatori. Così l'overflow di un array non può corrompere quegli scalari e puntatori prima di arrivare al canary, riducendo ciò che un overflow può danneggiare.
- **StackShield** tiene uno **shadow stack** separato dei return address: all'ingresso salva il vero return address in un'area protetta, e all'uscita lo ripristina o confronta con quella copia, quindi sovrascrivere il return address sullo stack non ha effetto. Può anche vietare i salti dentro il segmento dati. La versione hardware moderna è lo shadow stack di Intel CET (Lezione 2, slide 14).

### Slide 43 · Dynamic Countermeasures: imperfections

> NB none of these protections is perfect! Eg
>
> - even if attacks to return addresses are caught, integrity of other data on the stack can still be abused
> - clever attacks may leave canaries intact
> - where do you store the "master" canary value
>   - a cleverer attack could change it
> - none of this protects against heap overflows
>   - eg buffer overflow within a struct...
> - ....

**Approfondimento.** La lezione insiste che queste sono *mitigazioni*, non cure, perché il bug di fondo resta lì.

- **Altri dati sullo stack.** Un canary protegge solo il return address. Un overflow può ancora corrompere *altre* variabili locali *sotto* il canary e usarle in modo malevolo (un attacco solo sui dati: sovrascrivere un flag "isAdmin", una lunghezza o un puntatore usato prima che la funzione ritorni, così il canary non viene nemmeno controllato).
- **Canary lasciati intatti.** Scritture non lineari (attraverso un puntatore o un indice di array corrotti) possono raggiungere il return address senza toccare il canary; una fuga di informazioni rivela il canary, che così si può riscrivere correttamente.
- **Dove conservare il canary di riferimento.** Il valore di riferimento deve stare da qualche parte; se l'attaccante riesce a trovarlo e a cambiarlo (o la copia per funzione), il controllo passa. La sua segretezza è un'ipotesi.
- **Heap overflow (ripetuto per sottolinearlo).** Gli stack canary non fanno nulla per lo heap. L'overflow di un buffer *dentro una struct* può sovrascrivere un campo successivo della stessa struct, per esempio un puntatore a funzione, senza che lo stack sia coinvolto affatto. L'irrobustimento dello heap è un problema a parte (safe unlinking, heap cookie, allocatori irrobustiti).

### Slide 44 · Other Countermeasures (quando agire)

> We can take countermeasures at different points in time
>
> - before we even begin programming
> - during development
> - when testing
> - when executing code
>
> to prevent, to detect - at (pre)compile time or at runtime -, and to mitigate problems with buffer overflows

**Approfondimento.** Questa slide presenta le restanti come una sequenza temporale di difesa in profondità, in linea con l'SDLC della Lezione 1:

- *Prima di programmare*: scegliere un linguaggio memory-safe, ridurre la superficie d'attacco, formare gli sviluppatori.
- *Durante lo sviluppo*: usare librerie e API più sicure, attivare gli avvisi e le opzioni di irrobustimento del compilatore.
- *Durante i test*: revisione del codice, analisi statica, fuzzing, sanitizer, perfino la verifica formale.
- *Durante l'esecuzione*: le difese a tempo di esecuzione delle slide 40-43 (NX, ASLR, canary).

I tre verbi sono *prevenire* (impedire che il bug venga scritto o sia raggiungibile), *rilevare* (trovarlo prima o durante l'esecuzione), *mitigare* (limitare i danni quando viene sfruttato).

### Slide 45 · Prevention

> - Don't use C or C++
> - Better programmer awareness & training. Eg read - and make other people read -
>   - Building Secure Software, J. Viega & G. McGraw, 2002
>   - Writing Secure Code, M. Howard & D. LeBlanc, 2002
>   - 19 deadly sins of software security, M. Howard, D LeBlanc & J. Viega, 2005
>   - Secure programming for Linux and UNIX HOWTO, D. Wheeler
>   - Secure C coding, T. Sirainen
>   - The Secure Coding Cookbook for C and C++ by John Viega and Matt Messier
>   - Secure Coding: Principles and Practices by Robert Seacord, 2013

**Approfondimento.** Le due strategie di prevenzione:

- **Evitare C/C++ quando possibile**, cioè usare un linguaggio memory-safe (Java, C#, Go, Python, Rust). Questo elimina per costruzione l'intera classe. La lista di letture è il canone classico della programmazione sicura; il lavoro di Robert Seacord è legato al **SEI CERT C Coding Standard**, l'insieme di regole più autorevole per chi *deve* scrivere in C.
- **Consapevolezza e formazione**: poiché molto codice va ancora scritto in C/C++, gli sviluppatori devono conoscere le trappole, esattamente ciò che insegnano queste slide "spot the defect".

### Slide 46 · Dangerous C system calls

![Lezione 3, pagina 46](L03_p46.webp "50% 1400x796")

**Figura.** Una tabella di funzioni della libreria C ordinate per rischio:

| Rischio | Funzioni |
| --- | --- |
| Rischio estremo | `gets` |
| Rischio alto | `strcpy`, `strcat`, `sprintf`, `scanf`, `sscanf`, `fscanf`, `vfscanf`, `vsscanf`, `streadd`, `strecpy`, `strtrns`, `realpath`, `syslog`, `getenv`, `getopt`, `getopt_long`, `getpass` |
| Rischio moderato | `getchar`, `fgetc`, `getc`, `read`, `bcopy` |
| Rischio basso | `fgets`, `memcpy`, `snprintf`, `strccpy`, `strcadd`, `strncpy`, `strncat`, `vsnprintf` |

**Approfondimento.** La classifica riflette quanto è facile usare male ciascuna funzione con un input non fidato.

- **`gets` (estremo)**: nessun argomento di dimensione, impossibile da usare in modo sicuro, tolta in C11.
- **Rischio alto**: funzioni che scrivono senza un limite di dimensione (`strcpy`, `strcat`, `sprintf`), che leggono in buffer senza limiti (`scanf`/`sscanf`/`fscanf` con `%s`), o che restituiscono dati influenzati dall'attaccante di lunghezza illimitata (`getenv`, `getpass`, `realpath`). `realpath` in passato presupponeva un buffer di `PATH_MAX`; `syslog` è rischiosa per via delle format string.
- **Moderato**: leggono uno o pochi byte (`getc`, `fgetc`, `read`, `bcopy`); un uso sbagliato è possibile ma il raggio dei danni è più piccolo.
- **Rischio basso**: le funzioni limitate da una dimensione (`fgets`, `snprintf`, `strncpy`, `strncat`, `vsnprintf`, `memcpy`). "Basso" **non** vuol dire "sicuro": come hanno mostrato le slide precedenti, `strncpy`/`strncat`/`memcpy` si possono tutte usare male (mancata terminazione, argomento di dimensione sbagliato, unità sbagliata). Sono preferibili *se usate correttamente*.

### Slide 47-49 · Prevention: usare librerie migliori

> (47) there is a choice between using statically vs dynamically allocated buffers
>
> - static approach easy to get wrong, and chopping user input may still have unwanted effects
> - dynamic approach susceptible to out-of-memory errors, and need for failing safely
>
> (48) libsafe.h / libverify / strlcpy / strlcat ; (49) glib.h Gstring / Strsafe.h / C++ string class

**Approfondimento.** Mattoni migliori per gestire le stringhe, con i loro compromessi.

- **Buffer statici e dinamici (slide 47).** I buffer *statici* (a dimensione fissa) sono semplici ma facili da far traboccare, e *troncare* in silenzio un input troppo lungo può a sua volta causare bug (un percorso o un URL tagliato che poi significa un'altra cosa). I buffer *dinamici* (che crescono quanto serve) evitano il troncamento ma l'allocazione può fallire, quindi il codice deve gestire in modo *sicuro* la mancanza di memoria (senza crash, senza proseguire con un `NULL`).
- **libsafe / libverify (slide 48).** `libsafe` intercetta le funzioni pericolose (`strcpy`, ecc.) durante l'esecuzione e impedisce che scrivano oltre lo stack frame corrente; `libverify` in più tiene copie dei return address sullo heap e le controlla. Entrambe sono involucri a tempo di esecuzione, non correzioni del codice.
- **`strlcpy` / `strlcat` (slide 48).** Funzioni BSD che ricevono la **dimensione della destinazione** (non un numero di caratteri da copiare) e terminano *sempre* con NUL: `strlcpy(dst, src, sizeof dst)`. Sono la risposta pulita alle trappole di `strncpy`/`strncat` delle slide 16-21 e sono usate in modo sistematico in OpenBSD.
- **`GString` di glib (slide 49).** Un tipo stringa per il C che cresce dinamicamente ed è sempre terminato; l'avvertenza è che un'allocazione fallita interrompe il programma, il che può essere inaccettabile per un server.
- **`Strsafe.h` di Microsoft (slide 49).** Funzioni (`StringCchCopy`, `StringCchCat`, ...) che ricevono sempre la dimensione della destinazione e garantiscono la terminazione con NUL.
- **`std::string` del C++ (slide 49).** Gestisce da sé memoria e lunghezza, togliendo la gestione manuale dei buffer, ma `.data()`/`.c_str()` restituiscono un `char*` grezzo (prima di C++11 `.data()` non era garantita terminata da NUL), quindi appena si torna alle API del C ritornano i vecchi rischi.

### Slide 50 · Detection (prima del rilascio)

> - Testing - Difficult! How to hit the right cases? Fuzz testing - test for crash on long, random inputs - can be successful in finding some weaknesses
> - Code reviews - Expensive & labour intensive
> - Code scanning tools (aka static analysis) Eg RATS (also for PHP, Python, Perl), Flawfinder, ITS4, Deputy, Splint, PREfix, PREfast by Microsoft plus other commercial tools

**Approfondimento.** Tre tecniche di rilevamento (sviluppate nelle Lezioni 6 e 7):

- **Test / fuzzing.** Il test ordinario colpisce di rado proprio l'input troppo lungo o malformato che attiva un overflow. Il *fuzzing* dà in pasto enormi quantità di input lunghi, casuali o malformati e osserva i crash; insieme ai sanitizer (ASan) è molto efficace nel trovare i bug di memoria, ed è l'(eventuale) progetto del corso.
- **Revisione del codice.** Le persone che leggono il codice trovano difetti che gli strumenti non vedono (soprattutto errori di logica e di progettazione), ma è lenta e costosa.
- **Analisi statica (scansione del codice).** Gli strumenti esaminano il sorgente senza eseguirlo, segnalando gli schemi pericolosi (`gets`, `strcpy` non controllate, dati contaminati che arrivano a una copia). *RATS*, *Flawfinder* e *ITS4* sono semplici riconoscitori di schemi; *Splint* e *Deputy* fanno un'analisi più profonda; *PREfix/PREfast* sono quelli di Microsoft. Scalano e girano a ogni build, al prezzo di falsi positivi e falsi negativi.

### Slide 51 · More prevention & detection: program verification

> The most extreme form of static analysis:
>
> - Program verification - Proving by mathematical means (eg hoare logic) that memory management of a program is safe - Extremely labour-intensive - E.g. hypervisor verification project by microsoft & verisoft.

**Approfondimento.** La *verifica formale* dimostra matematicamente, per **tutti** gli input, che il programma soddisfa una proprietà (qui la memory safety), invece di limitarsi a provare alcuni input. La **logica di Hoare** ragiona sul codice con precondizioni e postcondizioni (`{P} C {Q}`). Dà la garanzia più forte ma richiede moltissimo lavoro e competenze specialistiche, quindi è riservata a componenti piccoli e critici. Il progetto **VCC** citato ha verificato l'hypervisor Hyper-V di Microsoft; **Verisoft** era un progetto tedesco per verificare un intero stack di sistema; altre pietre miliari sono il microkernel verificato **seL4** e il compilatore C verificato **CompCert** (Lezione 2, slide 25).

### Slide 52 · Reducing attack surface

> Not running or even installing certain software, or enabling all features by default, mitigates the threat

**Approfondimento.** Meno codice gira, meno codice c'è da attaccare. *Ridurre la superficie d'attacco* significa: non installare software che non serve; non eseguire servizi che non si usano; non attivare per impostazione predefinita le funzioni facoltative; chiudere le porte; rinunciare ai privilegi. Un buffer overflow in un componente mai installato o mai raggiungibile non si può sfruttare. È il principio di progettazione dell'*economia dei meccanismi* e delle *impostazioni predefinite sicure* (Lezione 10), e richiama anche la lezione di Tandberg della Lezione 1 (le funzioni di debug vanno consegnate disattivate).

## Riepilogo e generalizzazione (pagine 53-55)

### Slide 53 · Summary

> - Buffer overflows are the top security vulnerability
> - Any C(++) code acting on untrusted input is at risk
> - Getting rid of buffer overflow weaknesses in C(++) code is hard (and may prove to be impossible)
>   - Ongoing arms race between countermeasures and ever more clever attacks.
>   - Attacks are not only getting cleverer, using them is getting easier

**Approfondimento.** La conclusione onesta: in C/C++ i buffer overflow non si possono eliminare del tutto con la sola disciplina, solo rendere più rari e più difficili da sfruttare. Difese e attacchi si evolvono insieme (canary e fughe di informazioni, NX e ROP, ASLR e fughe di indirizzi), e gli strumenti rendono gli attacchi avanzati utilizzabili da chiunque. L'unico modo per *eliminare* la classe è cambiare linguaggio (slide 55).

### Slide 54 · More general

> Buffer overflow is an instance of three more general problems:
>
> 1. Lack of *input validation*
> 2. Mixing *data & code* - Data and return address on the stack
> 3. Believing in & relying on an *abstraction* - In this case, the abstraction of procedure calls offered by C
>
> Attacks often exploit holes in abstractions that are not 100% enforced

**Approfondimento.** Questa slide generalizza tutta la lezione in tre temi che ritornano in tutto il corso:

1. **Mancanza di validazione dell'input.** L'overflow avviene perché il programma si fida di un input di cui non ha mai controllato lunghezza o contenuto (Lezione 5). Si valida al confine.
2. **Mescolare dati e codice.** Sullo stack i *dati* (il buffer) e le *informazioni di controllo* (il return address salvato) vivono insieme, quindi scrivere dati può sovrascrivere il controllo. La stessa confusione sta alla base delle format string (dati letti come direttive di formato), della SQL injection (dati letti come SQL) e dell'XSS (dati letti come HTML/JS). "Non mescolare dati e codice" è un principio cardine.
3. **Affidarsi a un'astrazione che perde.** Il C offre l'*astrazione* delle chiamate di procedura strutturate (chiamata e ritorno), ma non la *impone*: il meccanismo del ritorno è solo un valore su uno stack scrivibile. Gli attacchi sfruttano la distanza fra l'astrazione (le funzioni tornano sempre a chi le ha chiamate) e l'implementazione (un return address che chiunque può sovrascrivere). Ogni volta che un'astrazione non è imposta al 100%, gli attaccanti vivono in quella distanza.

### Slide 55 · Moral of the story

> - Don't use C(++), if you can avoid it - But use a language that provides memory safety, such as java or C#
> - If you do have to use c(++), become or hire an expert
> - Reading - A Comparison of Publicly Available Tools for Dynamic Buffer Overflow Prevention, by John Wilander and Mariam Kakkar

**Approfondimento.** Le indicazioni pratiche:

- **Preferire un linguaggio memory-safe.** Java, C#, Go, Python e soprattutto **Rust** (memory-safe senza garbage collector, adatto al codice di sistema) eliminano per progetto i buffer overflow. È la direzione attuale dell'industria (CISA e l'ONCD statunitense spingono verso i linguaggi memory-safe; Rust nel kernel Linux, in Android e in Windows).
- **Se si deve usare C/C++, servono vere competenze** più ogni aiuto disponibile: librerie sicure, opzioni di irrobustimento, analisi statica, fuzzing, sanitizer, revisione del codice. Un C scritto alla leggera in contesti sensibili per la sicurezza è pericoloso.
- L'articolo di Wilander e Kakkar citato confronta sperimentalmente le difese dal buffer overflow a tempo di esecuzione (canary, controllori dei limiti) e mostra che all'epoca nessuna fermava tutti gli attacchi, rafforzando il messaggio della slide 43: nessuna difesa da sola è perfetta.
