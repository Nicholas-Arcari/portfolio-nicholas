La Lezione 4 tratta le vulnerabilità di format string: perché passare dati controllati dall'attaccante come formato di `printf` gli permette di leggere e scrivere memoria arbitraria, il caso di studio della compromissione di root di `cfingerd`, e poi il tema più ampio della code injection e della sanificazione dell'input (black list contro white list). Le slide sono 41. Gli esempi di codice sono importanti per l'esame.

## Che cos'è una vulnerabilità di format string (pagine 2-11)

### Slide 2 · Format String (indice)

> - What is a format string vulnerability
> - Fundamental "C" problem
> - Survey of unsafe functions and how to format strings safely with regular C functions
> - Case study: cfingerd 1.4.3 vulnerabilities
> - Preventing format string vulnerabilities without programming
> - Tools to find string format issues

### Slide 3 · What is a Format String?

> In "C", you can print using a format string:
>
> - `printf(const char *format, ...);`
> - `printf("Mary has %d cats", cats);`
>   - %d specifies a decimal number (from an int)
>   - %s would specify a string argument,
>   - %x would specify an unsigned uppercase hexadecimal (from an int)
>   - %f expects a double and converts it into decimal notation, rounding as specified by a precision argument
>   - ...

**Approfondimento.** `printf` è una funzione **variadica**: il suo primo argomento è una *format string* che stampa testo letterale e contiene *specificatori di conversione* (`%d`, `%s`, `%x`, `%f`, ...), ognuno dei quali consuma uno degli argomenti successivi e decide come stamparlo. La format string quindi *codifica quanti altri argomenti ci sono e di che tipo*.

- **Il significato preciso degli specificatori** (la slide descrive `%x` in modo un po' impreciso): `%d` è un `int` decimale con segno; `%u` un decimale senza segno; `%x` un `unsigned int` in esadecimale *minuscolo* (`%X` maiuscolo; il "uppercase" della slide è impreciso); `%s` si aspetta un `char*` e stampa la stringa a cui punta; `%f` si aspetta un `double`; `%p` stampa un puntatore; `%c` un carattere. I modificatori di larghezza e precisione (`%10x`, `%.5f`, `%100d`) controllano la larghezza del campo e la precisione, e contano negli exploit perché controllano quanti caratteri vengono emessi.
- Quello cruciale e pericoloso, introdotto più avanti, è **`%n`**, che non stampa ma *scrive* il numero di caratteri emessi fino a quel momento all'indirizzo del suo argomento.

### Slide 4 · Fundamental «C» problem

> - No way to count arguments passed to a "C" function, so missing arguments are not detected
> - Format string is interpreted: it mixes code and data
> - What happens if the following code is run?
>
> ```c
> int main () {
>        printf("Mary has %d cats");
> }
> ```

**Analisi del codice.**

- *Il problema di fondo.* Una funzione variadica in C **non ha modo di sapere quanti argomenti le siano stati davvero passati**. `printf` si fida della format string: vede `%d` e *presume* che ci sia un argomento `int`, prendendolo dalla posizione successiva stabilita dalla convenzione di chiamata (un registro o una posizione sullo stack), che chi chiama l'abbia fornito o no. Niente controlla il numero o i tipi.
- *La format string viene interpretata*: mescola **codice** (le direttive che dicono a `printf` che cosa fare) e **dati** (il testo letterale). Quando le direttive vengono da un attaccante, i dati sono diventati codice, lo stesso difetto di fondo dei buffer overflow (Lezione 3, slide 54).
- *Questo frammento* ha un `%d` ma **non** passa alcun argomento. `printf` legge qualunque cosa si trovi nella posizione dell'argomento successivo (un registro non inizializzato o un valore rimasto sullo stack) e lo stampa come intero decimale.

### Slide 5 · Result

> ```
> % ./a.out
> Mary has -1073742416 cats
> ```
>
> - Program reads missing arguments off the stack!
>   - And gets garbage (or interesting stuff if you want to probe the stack)

**Approfondimento.** Il grande numero negativo è il valore che si trovava dove avrebbe dovuto esserci l'argomento mancante, stampato come `int` con segno. È già una **divulgazione di informazioni**: fornendo molti specificatori, un attaccante può leggere parole successive dello stack (registri salvati, variabili locali, puntatori, canary, return address), il che fa uscire segreti e rende inutile ASLR rivelando indirizzi in uso. Il valore cambia da un'esecuzione all'altra e da una macchina all'altra, perché è solo ciò che è rimasto sullo stack.

### Slide 6 · User-specified Format String

> What happens if the following code is run, assuming there is an argument input by a user?
>
> ```c
> int main(int argc, char *argv[])
> {
>     printf(argv[1]);
>     exit(0);
> }
> ```
>
> Try it and input "%s%s%s%s%s%s%s%s%s" How many "%s" arguments do you need to crash it?

**Analisi del codice.** È *il* bug di format string per eccellenza: `printf(argv[1])` usa l'input controllato dall'attaccante **come format string**.

- Ogni `%s` fa prendere a `printf` la posizione successiva dello stack, la tratta come un **puntatore** `char*` e stampa la stringa a cui punta. Poiché non è stato passato alcun argomento, questi "puntatori" sono valori qualunque dello stack. La maggior parte non sono puntatori validi, quindi dereferenziarne uno accede a memoria non mappata o protetta e il programma va in crash.
- L'esperimento ("quanti `%s` servono per mandarlo in crash?") chiede solo fin dove bisogna risalire lo stack prima di incontrare un valore che non è un indirizzo leggibile, di solito solo pochi.

### Slide 7 · Result

> ```
> % ./a.out "%s%s%s%s%s%s%s"
>   Bus error
> ```
>
> - Program was terminated by OS
>   - Segmentation fault, bus error, etc... because the program attempted to read where it was not supposed to
> - User input is interpreted as string format (e.g., %s, %d, etc...)
> - Anything can happen, depending on input!
> - How would you correct the program?

**Approfondimento.** Un *segmentation fault* o un *bus error* è il sistema operativo che uccide il processo perché ha toccato memoria a cui non può accedere, il sintomo visibile di un `%s` che dereferenzia un puntatore fasullo. "Anything can happen" va preso alla lettera: con `%x` l'attaccante legge lo stack, con `%s` legge memoria arbitraria e con `%n` *scrive* in memoria, fino all'esecuzione di codice arbitrario. La correzione è nella slide successiva.

### Slide 8 · Corrected Program

> ```c
> int main(int argc, char *argv[])
> {
>     printf("%s", argv[1]); exit(0);
> }
> ```
>
> ```
> % ./a.out "%s%s%s%s%s%s%s"
>   %s%s%s%s%s%s%s
> ```

**Analisi del codice.** La correzione è fornire una **format string costante** e passare i dati dell'utente come semplice argomento: `printf("%s", argv[1])`. Ora `argv[1]` viene trattato solo come *dati* da stampare con l'unico `%s`; ogni carattere `%` che contiene viene stampato così com'è, come mostra l'output. Questo solo cambiamento neutralizza l'intera vulnerabilità. (Una nota di robustezza: il programma dovrebbe anche controllare che `argc > 1` prima di leggere `argv[1]`, altrimenti dereferenzia `NULL`.)

### Slide 9 · Format String vulnerabilities

> - Limitation of "C" family languages
> - Versatile
>   - Can affect various memory locations
>   - Can be used to create buffer overflows
>   - Can be used to read the stack
> - Not straightforward to exploit, but examples of root compromise scripts available on the web
>   - "Modify and hack from example"

**Approfondimento.** I bug di format string sono un limite della famiglia del C (C, C++, Objective-C) dovuto al meccanismo variadico non controllato; i linguaggi sicuri o non hanno funzioni variadiche in stile printf o ne controllano i tipi. Sono **versatili**: a differenza di un buffer overflow, che di solito sovrascrive la memoria adiacente, una format string con `%n` può scrivere a un indirizzo *arbitrario* scelto dall'attaccante (write-what-where), e con `%x`/`%s` può leggere lo stack e memoria arbitraria. Anche se delicati da sfruttare (l'attaccante deve allineare gli offset sullo stack), gli script di exploit già pronti permettono anche ad attaccanti poco abili di adattarli ("modify and hack from example", il punto sugli script kiddie della Lezione 3).

### Slide 10 · Definition of a Format String Vulnerability

> - A call to a function with a format string argument, where the format string is either:
>   - Possibly under the control of an attacker
>   - Not followed by appropriate number of arguments
> - Difficult to establish whether a data string could possibly be affected by an attacker; considered very bad practice to place a string to print as the format string argument.
>   - Sometimes the bad practice is confused with the actual presence of a format string vulnerability

**Approfondimento.** Due condizioni rendono ciascuna vulnerabile una chiamata: (1) la format string è controllabile dall'attaccante, oppure (2) ha più specificatori degli argomenti forniti. Poiché è difficile dimostrare che una data stringa non potrà *mai* essere influenzata da un attaccante (i flussi di dati sono complessi, e il codice viene ristrutturato), la regola sicura è **non mettere mai una stringa variabile nella posizione del formato**: sempre `printf("%s", s)`, mai `printf(s)`. L'ultimo punto nota una sfumatura: `printf(s)` dove `s` è di fatto sempre una costante fidata è una *cattiva pratica* ma non necessariamente una *vulnerabilità* sfruttabile; la pratica resta comunque vietata, perché la distinzione è fragile.

### Slide 11 · How important are Format String vulnerabilities

> - Search National Vulnerability Database (NIST) for "format string": Over 890 records overall; 132 last 3 years (as of 2022)
> - Search Database a Mitre (cve.mitre.org) for "format string": 667 (11 from 2018, 15 from 2017) records of vulnerabilities
> - Various applications: Databases (Oracle); Unix services (syslog, ftp,...); Linux "super" (for managing setuid functions); cfingerd CAN 2001-0609
> - Arbitrary code execution is a frequent consequence

**Approfondimento.** I bug di format string sono reali e numerosi (centinaia di CVE), in database, servizi Unix e programmi di supporto setuid. L'**esecuzione di codice arbitrario** è una conseguenza frequente per via della primitiva di scrittura `%n`. ("CAN-2001-0609" è un vecchio identificatore *candidato* di MITRE, poi promosso alla CVE `CVE-2001-0609`, il bug di cfingerd studiato più avanti.) I numeri sono più bassi di quelli dei buffer overflow, anche perché la correzione è banale e i compilatori ora danno un avviso (`-Wformat-security`), quindi i nuovi casi sono più rari.

## Funzioni pericolose e la primitiva di scrittura %n (pagine 12-15)

### Slide 12 · Functions using Format Strings

> - printf - prints to "stdout" stream
> - fprintf - prints to stream
> - warn - standard error output
> - err - standard error output
> - setproctitle - sets the invoking process's title
> - sprintf(char \*str, const char \*format, ...); - sprintf prints to a buffer - What's the problem with that?

**Approfondimento.** L'intera *famiglia* di `printf` riceve una format string ed è quindi vulnerabile quando il formato è controllato dall'attaccante: `printf`, `fprintf`, `sprintf`, `snprintf`, `vprintf` e simili, più le funzioni di input della famiglia `scanf`, le funzioni BSD di segnalazione degli errori `warn`/`err`, `syslog` (molto frequente nelle CVE) e `setproctitle`. **`sprintf` è doppiamente pericolosa**: oltre al problema della format string, scrive il risultato in un buffer fornito da chi chiama *senza limite di dimensione*, quindi è anche una classica funzione da buffer overflow (Lezione 3). Anche con un formato costante, `sprintf(buf, "%s", long_input)` fa traboccare `buf`.

### Slide 13 · Better functions than sprintf

> Note: do not prevent format string vulnerabilities:
>
> - `snprintf(char *str, size_t size, const char *format, ...);` - sprintf with length check for "size" - Does not guarantee NUL-termination of str on some platforms (Microsoft, Sun) - MacOS X: NUL-termination guaranteed - Check with "man snprintf"
> - `asprintf(char **ret, const char *format, ...);` - sets \*ret to be a pointer to a buffer sufficiently large to hold the formatted string.

**Approfondimento.** Il punto è che queste funzioni risolvono il problema del *buffer overflow* di `sprintf` ma **non** quello della *format string*: i due problemi sono indipendenti.

- **`snprintf(str, size, fmt, ...)`** limita a `size` il numero di byte scritti, impedendo l'overflow di `str`, ma se il formato è controllato dall'attaccante resta una vulnerabilità di format string. Una trappola di portabilità: su alcune piattaforme (in passato la `_snprintf` di Microsoft, il vecchio Solaris) **non** termina con NUL in caso di troncamento, quindi il terminatore va imposto. (È la stessa famiglia ANSI/Unicode e di troncamento della Lezione 3, slide 28.)
- **`asprintf(&ret, fmt, ...)`** alloca un buffer della dimensione esatta (con `malloc`) e fa puntare `*ret` a esso, togliendo il problema di indovinare la dimensione, ma chi chiama deve fare `free(ret)`, deve controllare il fallimento dell'allocazione, e il rischio della format string resta.
- La conclusione: scegliere una funzione sicura rispetto alla dimensione *e* usare sempre una format string costante.

### Slide 14 · Custom functions using format strings

> - It is possible to define custom functions taking arguments similar to printf.
> - wu-ftpd 2.6.1 proto.h - `void reply(int, char *fmt,...);` - `void lreply(int, char *fmt,...);` - etc...
> - Can produce the same kinds of vulnerabilities if an attacker can control the format string

**Approfondimento.** Il pericolo non si limita alla libreria standard. I programmi definiscono le *proprie* funzioni variadiche che inoltrano una format string a `vprintf`/`vsnprintf` (qui le `reply`/`lreply` di wu-ftpd). Se dei dati dell'attaccante arrivano al parametro `fmt` di una funzione del genere, è altrettanto sfruttabile. Anzi, il famoso **bug di format string `SITE EXEC` di wu-ftpd (2000, CVE-2000-0573)** dava root da remoto sui server FTP di tutto il mondo. Un consiglio difensivo: annotare queste funzioni con `__attribute__((format(printf, N, M)))` di GCC, così il compilatore controlla i tipi delle chiamate e `-Wformat-security` segnala un formato variabile.

### Slide 15 · Write anything anywhere: the %n command

> "%n" format command
>
> - Writes a number to the location specified by argument on the stack
>   - Argument treated as int pointer - Often either the buffer being written to, or the raw input, are somewhere on the stack - Attacker controls the pointer value!
>   - Writes the number of characters written so far - Input: «Count these characters!» - Even if the buffer given to snprintf is too small, snprintf will still report the bytes that would have been written up to a certain point in the %n variables
> - All the gory details you don't really need to know: Newsham T (2000) "Format String Attacks"; Format string attacks by scut/team teso.

**Approfondimento.** `%n` è ciò che trasforma un bug di format string da fuga di informazioni in una primitiva **write-what-where**, cioè in esecuzione di codice arbitrario.

- **Che cosa fa `%n`.** A differenza di tutti gli altri specificatori, `%n` *non* stampa. Tratta il suo argomento come un **`int*`** e scrive *in quel puntatore* il numero di caratteri stampati fino a quel momento.
- **Perché l'attaccante controlla l'indirizzo bersaglio.** Con un bug di format string, il valore che fa da "argomento" a `%n` viene letto dallo stack, e l'input dell'attaccante è a sua volta sullo stack. Così l'attaccante mette l'**indirizzo bersaglio** dentro la sua format string (come byte grezzi), poi usa degli specificatori `%x` per far avanzare il puntatore agli argomenti lungo lo stack finché non si allinea con quell'indirizzo; a quel punto `%n` ci scrive.
- **Controllare il valore scritto.** Il valore scritto è il conteggio dei caratteri, che l'attaccante regola con gli specificatori di larghezza: `%100x` emette 100 caratteri, quindi il conteggio raggiunge un numero arbitrario. Per scrivere un indirizzo completo a 32 bit (un conteggio enorme sarebbe impraticabile), la scrittura si divide in pezzi con `%hn` (scrive uno `short` a 16 bit) o `%hhn` (un byte), costruendo il valore due byte o un byte alla volta a indirizzi successivi.
- **La sottigliezza di `snprintf`.** Anche quando `snprintf` tronca il suo *output* per farlo stare in un buffer piccolo, il conteggio che riporta per `%n` corrisponde ai caratteri che *avrebbe* scritto, quindi la primitiva di scrittura funziona lo stesso.
- **Le mitigazioni moderne.** Poiché `%n` è così pericoloso e serve raramente, è disattivato per impostazione predefinita nella CRT di Windows, limitato da `_FORTIFY_SOURCE` di glibc (che vieta `%n` nelle format string scrivibili), e i compilatori danno un avviso sui formati variabili. I riferimenti citati (Tim Newsham 2000; "Exploiting Format String Vulnerabilities" di scut/team teso) sono le trattazioni classiche.

## Caso di studio: cfingerd 1.4.3 (pagine 16-21)

### Slide 16 · Case study: cfingerd 1.4.3

> - Finger replacement (Configurable Finger Daemon)
>   - Runs as root
>   - Pscan output: (CAN 2001-0609)
>     - defines.h:22 SECURITY: printf call should have "%s" as argument 0
>     - main.c:245 SECURITY: syslog call should have "%s" as argument 1
>     - main.c:258 SECURITY: syslog call should have "%s" as argument 1
>     - standard.c:765 SECURITY: printf call should have "%s" as argument 0
>     - etc... (10 instances total)

**Approfondimento.** `cfingerd` è un demone configurabile per il protocollo *finger* (che dà informazioni sugli utenti). I due fatti che ne fanno un bersaglio interessante: **gira come root**, quindi comprometterlo dà il pieno controllo della macchina, ed elabora **input remoto** (la richiesta finger e la risposta ident). `Pscan` è uno strumento di analisi statica che segnala le chiamate a `printf`/`syslog` prive di un formato `%s` esplicito, proprio la cattiva pratica di format string di questa lezione. Ha trovato 10 chiamate del genere; "should have `%s` as argument 0/1" significa che la format string dovrebbe essere la costante `"%s"` in quella posizione di argomento. È esattamente così che l'analisi statica (Lezione 3, slide 50) fa emergere i bug di format string.

### Slide 17 · Cfingerd analysis

> - Most of these issues are not exploitable, but one is, indirectly at that...
> - Algorithm (simplified):
>   - Receive an incoming connection - get the fingered username
>   - Perform an ident check (RFC 1413) to learn and log the identity of the remote user
>   - Copy the remote username into a buffer
>   - Copy that again into "username@remote\_address" - remote\_address would identify attack source
>   - Answer the finger request
>   - Log it

**Approfondimento.** Una lezione importante: la maggior parte delle 10 chiamate segnalate *non* è sfruttabile, perché la loro format string è di fatto una costante fidata. Solo una lo è, e solo *indirettamente*, insieme a un secondo bug. Coincide con la slide 10: una cattiva pratica non è automaticamente una vulnerabilità; la sfruttabilità va seguita lungo il flusso reale dei dati.

Il flusso di dati che conta: il demone fa un **controllo ident** (RFC 1413, un protocollo in cui il server chiede all'host che si collega "chi possiede questa connessione?"). La cosa cruciale è che la risposta ident, `ident_user`, viene **dal lato remoto ed è controllata dall'attaccante** (un client malevolo fa girare un proprio server ident che restituisce qualunque stringa). Quella stringa controllata dall'attaccante finisce poi in una chiamata di logging, il punto vulnerabile.

### Slide 18 · Cfingerd vulnerabilities

> - A format string vulnerability giving root access:
>   - Remote data (`ident_user`) is used to construct the format string:
>   - `snprintf(syslog_str, sizeof(syslog_str), "%s fingered from %s", username, ident_user);` `syslog(LOG_NOTICE, (char *) syslog_str);`
> - An off-by-one string manipulation (buffer overflow) vulnerability that
>   - prevents remote\_address from being logged (useful if attack is unsuccessful, or just to be anonymous)
>   - Allows ident\_user to be larger (and contain shell code)

**Analisi del codice.** La compromissione di root richiede **due** bug che lavorano insieme.

*Bug 1: la vulnerabilità di format string.* Il codice costruisce un messaggio con `snprintf` usando un formato costante sicuro (`"%s fingered from %s"`), e questo è corretto. Il difetto è nella **riga successiva**: `syslog(LOG_NOTICE, (char *) syslog_str)`. Qui `syslog_str`, che ora *contiene l'`ident_user` dell'attaccante*, viene passata come argomento di **format string** di `syslog` (la firma di `syslog` è `syslog(int priority, const char *format, ...)`). Così ogni `%n`/`%x` messo dall'attaccante in `ident_user` viene interpretato da `syslog`, il che dà la primitiva write-what-where e, poiché cfingerd gira come root, l'esecuzione di codice con privilegi di root.

- *La correzione del bug 1* è la regola della lezione: `syslog(LOG_NOTICE, "%s", syslog_str);`, cioè trattare la stringa costruita come dati, non come formato.

*Bug 2: il buffer overflow off-by-one* (nel dettaglio nelle slide successive). Serve all'attaccante in due modi: impedisce che `remote_address` venga registrato nel log (così un tentativo fallito non lascia tracce e l'attaccante resta anonimo), e permette a `ident_user` di allungarsi di fatto, dando spazio per lo shellcode e per i byte di allineamento che servono all'exploit con `%n`.

### Slide 19 · Cfingerd Buffer Overflow vulnerability

```c
memset(uname, 0, sizeof(uname));
for (xp=uname; *cp!='\0' && *cp!='\r' &&
  *cp!='\n' && strlen(uname) <
  sizeof(uname); cp++)
     *(xp++) = *cp;
```

> - Off-by-one string handling error
>   - uname is not NUL-terminated!
>   - because strlen doesn't count the NUL
> - It will stop copying when strlen goes reading off outside the buffer

**Analisi del codice.**

- *Che cosa fa.* Copia caratteri dall'input `cp` in `uname` (tramite il puntatore di scrittura `xp`), fermandosi su un NUL, un CR o un LF, o quando `strlen(uname) < sizeof(uname)` diventa falsa.
- *L'off-by-one.* La condizione del ciclo usa `strlen(uname) < sizeof(uname)`, cioè permette di copiare finché la lunghezza corrente è sotto la dimensione intera del buffer, quindi può riempire `uname` fino all'ultimo byte, senza lasciare **posto per il `'\0'` finale**. `uname` quindi **non è terminata da NUL**: il classico off-by-one (la condizione dovrebbe essere `< sizeof(uname) - 1`, riservando l'ultimo byte al terminatore). Si noti anche che `strlen(uname)` funziona solo finché `uname` *è* terminata, e `memset` l'aveva azzerata all'inizio, ma man mano che il buffer si riempie il calcolo della lunghezza arriva fino al confine e lo supera.
- *La conseguenza.* Poiché `uname` non è terminata, le operazioni successive sulle stringhe leggono oltre la sua fine, in qualunque cosa la segua in memoria: è il meccanismo spiegato nella slide successiva.
- *Correzione.* Riservare l'ultimo byte e terminare sempre:

```c
memset(uname, 0, sizeof(uname));
for (xp = uname;
     *cp != '\0' && *cp != '\r' && *cp != '\n'
     && (size_t)(xp - uname) < sizeof(uname) - 1;   // leave room for '\0'
     cp++)
    *xp++ = *cp;
*xp = '\0';                                         // guarantee termination
```

Usare come limite la differenza di puntatori `xp - uname` è anche più robusto (e molto meno costoso) che ricalcolare `strlen(uname)` a ogni iterazione.

### Slide 20 · Direct effect of off-by-one error

> `char buf[BUFLEN], uname[64];`
>
> - "uname" and "buf" are "joined" as one string!
> - So, even if only 64 characters from the input are copied into "uname", string manipulation functions will work with "uname+buf" as a single entity
> - "buf" was used to read the response from the ident server so it is the raw input

**Approfondimento.** I due buffer `uname` (64 byte) e `buf` (BUFLEN byte) sono dichiarati uno dopo l'altro, quindi stanno vicini in memoria. Poiché `uname` non è terminata da NUL (bug 2), una funzione che scorre `uname` non si ferma alla sua fine ma prosegue dritta dentro `buf`, così `uname` e `buf` si comportano come **un'unica stringa** `uname+buf`.

- Conta perché **`buf` contiene la risposta ident grezza, cioè dati controllati dall'attaccante**. Quindi anche se in `uname` vengono copiati solo 64 byte, la stringa controllata dall'attaccante che arriva davvero alla `syslog` vulnerabile è `uname` concatenata con tutto `buf`, molto più di 64 byte: abbastanza spazio per il payload dell'exploit.

### Slide 21 · Consequences of Off-by-one Error

> 1. Remote address is not logged due to size restriction:
>    - `snprintf(bleah, BUFLEN, "%s@%s", uname, remote_addr);`
>    - Can keep trying various technical adjustments (alignments, etc...) until the attack works, anonymously
> 2. Not enough space for format strings, alignment characters and shell code in buf (\~60 bytes for shell code):
>    - Rooted (root compromise) when syslog call is made
>      - i.e., cracker gains root privileges on the computer (equivalent to LocalSystem account)

**Approfondimento.** Come i due bug si combinano in una compromissione di root:

1. **Anonimato.** Il demone costruisce `"username@remote_address"` con `snprintf(bleah, BUFLEN, "%s@%s", uname, remote_addr)`. Poiché la `uname` non terminata occupa già tutto il buffer (unita a `buf`), il limite di lunghezza di `snprintf` viene raggiunto prima che venga aggiunto `remote_addr`, quindi **l'indirizzo remoto dell'attaccante non viene mai registrato**. L'attaccante può così riprovare con allineamenti diversi finché l'exploit riesce, senza lasciare traccia dei tentativi falliti.
2. **Spazio per il payload.** L'unione `uname+buf` dà più o meno lo spazio necessario (la slide dice \~60 byte) per lo shellcode più le direttive di formato `%n` e il riempimento di allineamento che servono all'exploit. Quando viene eseguita la `syslog(LOG_NOTICE, syslog_str)` vulnerabile, le scritture con `%n` dirottano il controllo e, poiché cfingerd gira come root, l'attaccante ha fatto il **"rooted"**, cioè ottiene root (su Windows l'equivalente account onnipotente `LocalSystem`).

Questo caso di studio è l'esempio completo, nel corso, di come un bug di format string e un off-by-one, forse "non così gravi" presi da soli, si combinino in un root da remoto. Entrambe le cause di fondo riportano ai temi della lezione: mescolare dati e codice (la format string), e la mancanza di validazione dell'input e una gestione distratta delle stringhe (l'off-by-one).

## Prevenire le vulnerabilità di format string (pagina 22)

### Slide 22 · Preventing Format String vulnerabilities

> 1. Always specify a format string - Most format string vulnerabilities are solved by specifying "%s" as format string and not using the data string as format string
> 2. If possible, make the format string a constant - Extract all the variable parts as other arguments to the call - Difficult to do with some internationalization libraries
> 3. If the above two practices are not possible, use run-time defenses such as FormatGuard - Rare at design time - Perhaps a way to keep using a legacy application and keep costs down - Increase trust that a third-party application will be safe

**Approfondimento.** Tre livelli di difesa, in ordine di preferenza:

1. **Specificare sempre la format string.** La correzione numero uno: scrivere `printf("%s", data)`, mai `printf(data)`. I dati dell'utente diventano un argomento, non codice.
2. **Rendere il formato una costante nota in compilazione**, passando come argomenti tutte le parti variabili. Una stringa letterale non può mai essere controllata dall'attaccante. La difficoltà è l'*internazionalizzazione (i18n)*: librerie come `gettext` cercano durante l'esecuzione le format string tradotte (`printf(gettext("Hello %s"), name)`), quindi tecnicamente il formato è una variabile; la mitigazione è considerare fidati i cataloghi delle traduzioni e non lasciare mai che l'input dell'utente li scelga, e i compilatori controllano comunque con `-Wformat-nonliteral`.
3. **Difese a tempo di esecuzione** (per esempio *FormatGuard*, che avvolgeva `printf` per contare gli argomenti effettivi e rifiutare le chiamate con troppi specificatori) per i casi in cui il sorgente non si può cambiare, come un binario legacy o di terze parti. Sono l'ultima risorsa per continuare a usare un software che non si può correggere, scambiando un po' di garanzia con un costo più basso.

La base moderna è più semplice: compilare con `-Wformat -Wformat-security -Werror=format-security`, che fa rifiutare al compilatore qualunque format string non costante già in fase di build.

## Code injection e sanificazione dell'input (pagine 23-41)

La lezione passa ora dalle format string alla **code injection**, di cui format string, command injection, SQL injection e XSS sono tutte istanze, e alla difesa che le accomuna: la validazione dell'input (sviluppata nella Lezione 5).

### Slide 23-24 · Code Injection

> (23) Goal: trick program into executing an attacker's code by clever input construction that mixes code and data. Mixed code and data channels have special characters that trigger a context change between data and code interpretation - The attacker wants to inject these meta-characters through some clever encoding or manipulation, so supplied data is interpreted as code
>
> (24) Defend against it by using input cleansing and validation; type casts may help if they are possible. Need to keep track of which data has been cleansed, or keep track of all sources of inputs and cleanse as the input is received

**Approfondimento.**

- **L'essenza della code injection.** Molti canali trasportano *codice e dati mescolati*, separati solo da **metacaratteri** che fanno passare l'interprete da "questi sono dati" a "questo è un comando". Esempi di questi metacaratteri che cambiano contesto: `%` in una format string di `printf`, `;` e `` ` `` in un comando di shell, `'` e `--` in SQL, `<` e `>` in HTML. Se l'attaccante riesce a infilare un metacarattere in un punto che doveva contenere solo dati, i byte successivi vengono reinterpretati come codice. Questa è la code injection, e le format string ne sono un caso.
- **Codifica e offuscamento.** Gli attaccanti fanno passare i metacaratteri codificandoli (la codifica URL `%3B` per `;`, le forme UTF-8 sovralunghe, le entità HTML), così un filtro ingenuo che cerca il carattere letterale non li vede.
- **La difesa** è la *pulizia (sanificazione) e validazione dell'input*: controllare e ripulire l'input non fidato prima che arrivi a un interprete. Due strategie di contabilità: o **tenere traccia di quali dati sono stati ripuliti** (così non si usano mai dati non ripuliti in un punto sensibile, per esempio il taint mode di Perl), oppure **ripulire ogni input nel punto in cui viene ricevuto**. I cast di tipo aiutano quando il valore atteso è, per esempio, un intero: convertirlo in `int` scarta qualunque testo iniettato.

### Slide 25 · How widespread?

> - Search National Vulnerability Database (NIST) for "code injection": Over 900 records overall; 360+ last 3 years (recent one Aug 2020)
> - Search Database Mitre (cve.mitre.org) for "code injection": 760 (80+ from 2018) records of vulnerabilities

**Approfondimento.** La code injection è una delle classi di vulnerabilità più comuni e più gravi; "Injection" è stata in cima o vicino alla cima della OWASP Top 10 per tutta la sua storia (numero 1 nel 2013 e nel 2017, confluita in una categoria più ampia al numero 3 nel 2021). I numeri qui contano solo quelle etichettate esplicitamente come "code injection"; SQL injection e XSS, che sono anch'esse injection, ne aggiungono migliaia.

### Slide 26-27 · Basic Example by Command Separation

```sh
#!/bin/sh
A = $1
eval "ls $A"
```

> Permissions of "confidential" before exploit: `-rwxr-x--- 1 user user confidential`. Allow execution: `% chmod a+rx example`. Exploit: `%./example ".;chmod o+r *"`

**Risultato (slide 27):** *"Inside the program, the eval statement becomes equivalent to:* `eval "ls .;chmod o+r *"`. *Permissions after exploit:* `-rwxr-xr-- 1 user user confidential`. *Any statement after the ";" would also get executed, because ";" is a command separator. The data argument for "ls" has become code!"*

**Analisi del codice.** Lo script esegue `ls` su una directory data come argomento `$1`, costruendo una stringa di comando ed eseguendola con `eval`. (Il `A = $1` mostrato ha spazi di troppo; la shell valida è `A=$1`.)

- *Vulnerabilità: command injection con il separatore `;`.* L'argomento `$A` viene inserito senza virgolette in un comando di shell e poi eseguito con `eval`. L'attaccante passa `".;chmod o+r *"`. Dopo la sostituzione, `eval` vede `ls .;chmod o+r *`, che la shell legge come **due** comandi: `ls .` e poi `chmod o+r *`. Il `;` è un separatore di comandi, quindi la `chmod` dell'attaccante viene eseguita, rendendo leggibile a tutti ogni file (compreso `confidential`, prima illeggibile). I *dati* (l'argomento della directory) sono diventati *codice*.
- *Correzione.* La correzione di fondo è **non invocare affatto una shell**: chiamare il programma direttamente con l'argomento come singolo parametro (per esempio in C `execlp("ls", "ls", dir, NULL)`, o in un linguaggio di livello più alto un'API con un vettore di argomenti che non interpreta mai i metacaratteri). Se la shell è inevitabile, validare l'argomento con una allow list rigida (slide 38) e metterlo correttamente fra virgolette. `eval` su dati non fidati non andrebbe usato praticamente mai.

### Slide 28-29 · Other Command Injection (backticks)

> - (in PHP) Backtick `` ` `` : execution in a command line by command substitution.  `` `command` `` gets executed before the rest of the command line.
> - Imagine a malicious script called "script1": `mkdir oups` / `echo oups` / etc...
> - Imagine a program that calls a shell to run grep. What happens when this is run? `` eval "grep `./script1` afile" ``
>
> (29) Answer: Script1 is executed - first an "oups" directory is created. The rest of the intended command, "grep oups afile", is executed.

**Analisi del codice.** Un secondo metacarattere della shell: il **backtick** (`` ` ``), che esegue la *command substitution*: la shell esegue prima il comando fra i backtick e ne sostituisce l'output.

- *Vulnerabilità.* In `` grep `./script1` afile ``, la shell esegue prima `./script1` (che crea la directory `oups` e stampa `oups`), poi ne sostituisce l'output, così il comando diventa `grep oups afile`. Quindi basta avere una stringa fra backtick in un comando che arriva a una shell per eseguire un programma qualunque. In PHP lo stesso pericolo esiste sia con l'operatore backtick sia con `shell_exec`, `exec`, `system`, `passthru`, `popen`.
- *Correzione.* Come prima: evitare di far passare dati non fidati attraverso una shell; usare API che ricevono un array di argomenti (`pcntl_exec`, `proc_open` con un array, o le operazioni sui file native del linguaggio), così backtick e `;` non vengono mai interpretati; altrimenti una validazione rigida con allow list più `escapeshellarg()`.

### Slide 30-31 · A vulnerable program (C + system)

```c
int main(int argc, char *argv[], char **envp)
{
  char buf [100];
  buf[0] = '\0';
  snprintf(buf, sizeof(buf), "grep %s text", argv[1]);
  system(buf);
  exit(0);
}
```

> What happens when we run the following?
> `` % ./a.out \`./script\` ``
>
> (31) Answer: The program calls `` system("grep `./script` text"); `` (can be verified by adding `printf("%s", buf)`). So we could make a.out execute any program we want. Imagine that we provide the argument remotely. Anyone running a.out would run arbitrary code as the owner of a.out. What if a.out runs with root privileges?

**Analisi del codice.** Si noti che questo codice usa `snprintf` con un formato **costante**, quindi *non* ha bug di format string né di buffer overflow. Il difetto sta tutto in ciò che fa con la stringa costruita in modo sicuro.

- *Vulnerabilità: command injection tramite `system`.* `system(buf)` passa `buf` a `/bin/sh -c`, quindi ogni metacarattere della shell in `buf` viene interpretato. Poiché `argv[1]` viene copiato tale e quale in `buf`, l'espressione con i backtick dell'attaccante `` `./script` `` viene eseguita dalla shell prima che parta `grep`. L'attaccante può eseguire qualunque programma, e se l'argomento arriva da remoto e `a.out` è setuid root, è un root da remoto. Il fatto che `snprintf` sia sicura non aiuta, perché `system` reinterpreta il risultato.
- *Correzione.* Non usare `system` con alcun contenuto non fidato. Usare la famiglia `exec` con un vettore di argomenti esplicito, che passa `argv[1]` direttamente a `grep` come un solo argomento, senza shell in mezzo:

```c
#include <unistd.h>
#include <sys/wait.h>
int main(int argc, char *argv[]) {
    if (argc < 2) return 1;
    pid_t pid = fork();
    if (pid == 0) {
        execlp("grep", "grep", "--", argv[1], "text", (char*)NULL);  // no shell involved
        _exit(127);
    }
    int status; waitpid(pid, &status, 0);
    return 0;
}
```

Il `--` impedisce a `grep` di trattare come opzione un argomento che comincia con `-` (una injection più piccola a sé stante, l'*argument injection*).

### Slide 32 · Shell metacharacters

> - '\`' to execute something (command substitution)
> - ';' is a command ("pipeline") separator
> - '&' start process in the background
> - '|' is a pipe (connecting standard output to standard input)
> - '&&', '||' logical operators AND and OR
> - '<<' or '>>' prepend, append
> - # to comment out something
>
> Refer to the appropriate man page (man csh) for all characters
>
> How else can code be injected into a.out?

**Approfondimento.** È il catalogo (non esaustivo) dei metacaratteri della shell di cui un attaccante può abusare: command substitution (`` ` ``, `$()`), separatori (`;`), esecuzione in background (`&`), pipe (`|`), operatori logici (`&&`, `||`), redirezione (`<`, `>`, `>>`, `<<`), commenti (`#`), più il globbing (`*`, `?`, `[]`), l'espansione delle variabili (`$`), le virgolette, l'a capo e gli spazi. La domanda retorica "how else can code be injected?" sottolinea la difficoltà centrale del **black-listing**: l'insieme dei caratteri pericolosi è grande, dipende dalla shell e dal contesto, ed è facile sottovalutarlo, ed è per questo che si preferisce l'allow-listing (slide 38).

### Slide 33 · Defending against code injection

> - Input cleansing and validation - Model the expected input (Discard what does not fit, e.g., metacharacters) - Keep track of which data has been cleansed (e.g., Perl's taint mode) - Keep track of all sources of inputs (Or cleanse as the input is received)
> - Type and range verification, type casts
> - Separating code from data - Transmit, receive and manipulate data using different channels than for code

**Approfondimento.** Tre difese complementari:

- **Pulizia e validazione dell'input.** *Modellare l'input atteso* (com'è fatto un valore valido) e rifiutare tutto ciò che non corrisponde. *Tenere traccia dei dati ripuliti*, così i dati non fidati e non ripuliti non arrivano mai a un punto sensibile: il **taint mode di Perl** (`-T`) marca come "contaminato" ogni input esterno e si rifiuta di usare dati contaminati in operazioni pericolose (`system`, `open`, ...) finché non sono stati ripuliti passando per un'espressione regolare, imponendo la disciplina in automatico.
- **Verifica di tipo e di intervallo, cast di tipo.** Se ci si aspetta un numero, convertire l'input in un tipo numerico e controllarne l'intervallo; il cast scarta qualunque testo iniettato.
- **Separare il codice dai dati** è la correzione più forte e più generale: usare un canale o un meccanismo che tiene separati dati e codice, così i dati non possono mai essere analizzati come codice. Nei database sono i **prepared statement / query parametrizzate** (Lezione 9); per i comandi sono le API **`exec` con vettore di argomenti** viste sopra; per `printf` è la format string costante. Risponde direttamente al principio "non mescolare dati e codice" (Lezione 3, slide 54).

### Slide 34 · Input cleansing

> - Key to preventing code injection attacks
> - Common problem where code is generated dynamically from some data - SQL (database Simple Query Language) - System calls and equivalents in PHP, Windows CreateProcess, etc... - HTML may contain JavaScript (Cross-site scripting vulnerabilities)

**Approfondimento.** Ovunque un programma **costruisca codice (una query, un comando, una pagina web) in modo dinamico a partire dai dati**, l'injection è possibile, e la pulizia dell'input è la difesa chiave. I tre punti sensibili canonici: **SQL** (query costruite con le stringhe → SQL injection, Lezione 9), le **chiamate alla shell e di creazione di processi** (`system`, la `exec` di PHP, la `CreateProcess` di Windows → command injection), e l'**HTML che contiene JavaScript** (dati dell'utente ripetuti in una pagina → cross-site scripting, XSS). (Per inciso: SQL sta per *Structured* Query Language; il "Simple" della slide è una svista.) Lo schema che le accomuna è identico, ed è per questo che una sola mentalità, non lasciare mai che i dati diventino codice, difende da tutte.

### Slide 35 · Intuitive approach (e perché fallisce)

> Block or escape all metacharacters - but what are they?
>
> Problems:
>
> - Character encodings - octal, hexadecimal, UTF-8, UTF-16, binary, Base-64, URL encoding, ...
> - Obfuscation - Escaped characters that can get interpreted later - Engineered strings such that by blocking a character, something else is generated

**Approfondimento.** La difesa intuitiva è il **black-listing**: elencare tutti i metacaratteri "cattivi" e bloccarli o farne l'escaping. Fallisce per due motivi:

- **Le codifiche dei caratteri.** Lo stesso carattere si può scrivere in molti modi: `;` letterale, codificato URL `%3B`, entità HTML `&#59;`, codifiche UTF-8 sovralunghe, escape ottali o esadecimali, Base-64, ecc. Un filtro che controlla il byte letterale non vede le forme codificate, che poi vengono decodificate *dopo* il filtro, dal livello successivo, nel carattere pericoloso. (Da qui la slide 41: risolvere *prima* le codifiche.)
- **L'offuscamento.** I caratteri con escape possono essere riportati alla forma originale più tardi e reinterpretati; e i filtri si possono aggirare con stringhe "costruite ad arte" in cui togliere un carattere cattivo ne *crea* un altro (l'esempio `adb` → `ab` della slide 41).

### Slide 36 · Wrong way to cleanse input (black list)

```c
int main(int argc, char *argv[], char **envp) {
  static char bad_chars[] = "/ ;[]<>&\t";
  char *user_data;
  char *cp;
  /* Get the data */
  user_data = getenv("QUERY_STRING");
  /* Remove bad characters. WRONG! */
  for (cp = user_data; *(cp += strcspn(cp,bad_chars)); /* */)
   *cp = '_';
  ...
```

**Analisi del codice.** Questo codice CGI prende la `QUERY_STRING` e cerca di neutralizzare l'injection sostituendo con dei trattini bassi una **black list** di caratteri cattivi (`/ ;[]<>&` e il tab). `strcspn(cp, bad_chars)` restituisce la lunghezza del tratto iniziale di `cp` che *non* contiene caratteri cattivi, quindi il ciclo salta a ogni carattere cattivo e lo sovrascrive con `_`.

- *Perché è SBAGLIATO (come dice il commento stesso della slide).* La black list è **incompleta**. Omette molti caratteri pericolosi: il backtick `` ` ``, `$`, `|`, `(`, `)`, `{`, `}`, `*`, `?`, `~`, `!`, `\`, l'a capo e altri ancora. Basta che ne manchi uno per vanificare tutto il filtro. È il fallimento generale del black-listing (slide 32: l'insieme dei metacaratteri è grande e dipende dal contesto). L'avviso del CERT citato sui metacaratteri nei CGI documenta proprio questa classe di errori.
- *Correzione.* Passare a una **white list** (slide 38): definire i caratteri ammessi e rifiutare o sostituire tutto il resto.

### Slide 37 · Real life example: phf CGI

```c
void escape_shell_cmd(char *cmd) {
    (...)
    if(ind("&;`'\"|*?~<>^()[]{}$\\", cmd[x]) != -1){
    (...)
}
```

> - Author forgot to list newlines in "if" statement...
> - Exploit: input "newline" and the commands you want executed...

**Analisi del codice.** È il famigerato bug reale del CGI **phf** (una delle prime vulnerabilità web sfruttate su larga scala, 1996). `escape_shell_cmd` cerca di fare l'escaping dei metacaratteri della shell confrontando ogni carattere con una stringa di black list.

- *Vulnerabilità.* La black list `` &;`'"|*?~<>^()[]{}$\ `` sembra completa ma **omette il carattere di a capo (`\n`, 0x0A)**. In un comando di shell anche l'a capo separa i comandi, proprio come `;`. Così un attaccante invia una richiesta che contiene un a capo letterale seguito da un comando (il classico `/cgi-bin/phf?Qalias=x%0A/bin/cat%20/etc/passwd`, dove `%0A` è l'a capo codificato URL), e il server esegue il comando iniettato, facendo uscire `/etc/passwd`. Un solo carattere dimenticato diede l'esecuzione di comandi da remoto su migliaia di web server.
- *La lezione.* È la prova canonica che il black-listing fallisce: elenchi che sembrano completi dimenticano comunque qualcosa, e una sola dimenticanza è una sconfitta totale. L'a capo è particolarmente facile da dimenticare perché è invisibile.
- *Correzione.* Mettere in white list i caratteri ammessi (slide successiva) o, meglio, non costruire affatto comandi di shell con i dati della richiesta.

### Slide 38 · More robust cleansing (white list)

```c
{...}
static char ok_chars[] =
       "1234567890!@%-_=+:,./\
        abcdefghijklmnopqrstuvwxyz\
        ABCDEFGHIJKLMNOPQRSTUVWXYZ";
{...}
for (cp = user_data; *(cp += strspn(cp, ok_chars)); /* */ )
   *cp = '_';
```

> a.k.a. White List vs Black List design principle

**Analisi del codice.** È la versione corretta della slide 36, ora con una **white list** (allow list).

- *Come funziona.* `ok_chars` elenca i caratteri *ammessi*. `strspn(cp, ok_chars)` restituisce la lunghezza del tratto iniziale fatto *solo* di caratteri ammessi, quindi il ciclo salta al primo carattere **non** presente nella allow list e lo sostituisce con `_`. Tutto ciò che non è permesso esplicitamente viene neutralizzato.
- *Perché è robusta.* La sicurezza non dipende più dal ricordarsi ogni carattere cattivo. Se compare un metacarattere nuovo o esotico, semplicemente non è in `ok_chars`, quindi viene rifiutato per impostazione predefinita. È il principio **fail-safe / default-deny**: il comportamento sicuro è quello predefinito. (Una nota sulla continuazione delle righe: le barre rovesciate alla fine delle righe della stringa sono continuazioni di riga del C che uniscono un unico letterale lungo; gli spazi iniziali delle righe continuate entrano davvero nell'insieme ammesso, il che è una piccola imperfezione: qui spazio e tab sono "ammessi", quindi una vera allow list andrebbe scritta come un'unica stringa esplicita.)
- **White list contro black list** è il principio di progettazione chiave: elencare ciò che è *buono* e rifiutare il resto, mai elencare ciò che è *cattivo* e ammettere il resto.

### Slide 39 · Defense: Input Sanitization

> - Do not attempt to list all forbidden characters - It is easy to forget and one missed character leads to defeat
> - Make a list of all allowed characters - Without metacharacters
> - Convert to a variable of numerical type, if a number is expected
> - Truncate input strings if the expected length is known

**Approfondimento.** Le regole riassuntive per la sanificazione dell'input:

- **Mai usare una black list** ("do not list all forbidden characters"), perché una sola omissione (l'a capo di phf) è fatale.
- **Usare sempre una white list** dei caratteri ammessi, scelti in modo che non contengano metacaratteri per nessuno degli interpreti a valle.
- **Convertire nel tipo atteso.** Se l'input deve essere un numero, convertirlo in un intero o un decimale e lavorare con quello; qualunque testo iniettato semplicemente non si converte. È il controllo più forte quando il tipo è noto.
- **Troncare alla lunghezza massima nota.** Se un campo ha una lunghezza massima naturale (un CAP di 5 cifre, un numero di carta di 16 cifre), imporla, il che aiuta anche contro i buffer overflow (Lezione 3) e contro alcuni input da denial of service.

### Slide 40 · Other Issues

> - Range of types - Short vs long integers - Unsigned vs signed
> - Integer overflows - Validate range (e.g., array indexes) - Attacks can make something negative to reach forbidden data - Attacks can reset a counter to zero (Data structure reference count vs garbage collection)
> - Strings in numerical inputs - e.g., PHP will accept both string and numerical values for a variable, which may allow unexpected attacks - Use typecasts

**Approfondimento.** La validazione non riguarda solo i caratteri; contano anche le proprietà *numeriche* dell'input, il che ricollega questa lezione ai bug sugli interi della Lezione 3.

- **L'intervallo del tipo.** Scegliere un tipo abbastanza largo e con il segno giusto, e ricordare le conversioni fra signed e unsigned (il bug della lunghezza negativa della Lezione 3, slide 22-23). Validare che un valore stia nel tipo in cui lo si memorizza.
- **Integer overflow e intervalli.** Controllare sempre l'intervallo dei valori usati come dimensioni o come **indici di array**. Gli attaccanti cercano di rendere negativo un indice (per raggiungere la memoria prima dell'array) o di riportare a zero un contatore (per esempio per confondere un contatore di riferimenti, così la memoria viene liberata mentre è ancora in uso, un use-after-free, o per aggirare le ipotesi della garbage collection).
- **Stringhe negli input numerici.** I linguaggi debolmente tipati confondono il confine: PHP accetta volentieri una stringa dove si aspetta un numero e la converte con regole sorprendenti (la conversione di tipo `"0e123" == "0e456"` della Lezione 1), permettendo attacchi inattesi. **Usare cast di tipo espliciti e confronti stretti** (`(int)$x`, `===`), così il valore è davvero del tipo che si crede.

### Slide 41 · Order for input validation

> 1. Resolve all character encoding issues first
> 2. Cleanse - If combinations of characters can produce metacharacters, you may need to do several passes. Example: "a" and "b" are legal if separated from each other, but "ab" is considered a metacharacter. The character "d" is not allowed. After you filter out "d" from "adb", you may be allowing "ab" through the filter!
> 3. Validate type, range, and format
> 4. Validate semantics (i.e., meaning of input)

**Approfondimento.** L'**ordine** dei passi di validazione conta, e sbagliarlo reintroduce i bug:

1. **Prima canonizzare / decodificare.** Risolvere tutte le codifiche (URL, UTF-8, entità HTML, ...) in un'unica forma canonica *prima* di controllare qualunque cosa. Altrimenti un metacarattere codificato passa il filtro e viene decodificato dopo nel carattere pericoloso (slide 35). È la *canonicalizzazione*, a sua volta una classica fonte di vulnerabilità quando è fatta male (per esempio il path traversal con `..%2f`, i worm di directory traversal Unicode/IIS).
2. **Ripulire, anche in più passaggi.** L'esempio `adb` mostra perché un passaggio non basta: togliere la `d` vietata da `adb` lascia `ab`, che è a sua volta un metacarattere vietato che prima non c'era. Se il filtraggio può *creare* nuovi schemi cattivi, bisogna filtrare ripetutamente finché la stringa non smette di cambiare (fino a un punto fisso) oppure, meglio, rifiutare l'input invece di "aggiustarlo" in silenzio. (È proprio l'offuscamento con "stringhe costruite ad arte" della slide 35.)
3. **Validare tipo, intervallo e formato** (è un intero in `[0, 100]`? corrisponde allo schema atteso?).
4. **Validare la semantica** per ultima: anche un valore ben formato e nell'intervallo può essere privo di senso o malevolo nel contesto (un numero di conto valido che non è il conto di *questo* utente, un codice prodotto valido ma inesistente). La validità sintattica è necessaria ma non sufficiente; il valore deve anche avere senso per l'operazione.

Questi quattro passi sono il ponte verso la Lezione 5 (Input Validation), che li sviluppa per intero.
