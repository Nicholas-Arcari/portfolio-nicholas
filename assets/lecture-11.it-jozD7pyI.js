const e=`La Lezione 11 tratta i bug di concorrenza come problema di sicurezza: che cos'è una race condition, la "finestra di vulnerabilità" fra un controllo e un'azione, come correggerla rendendo il codice atomico (\`synchronized\` di Java, lock), e i difetti **TOCTOU** (Time-Of-Check-to-Time-Of-Use) sui file system, critici per la sicurezza (il classico \`mkdir\` setuid, \`access\`/\`open\`, gli attacchi con i link simbolici). Le slide sono 25. Gli esempi di codice sono importanti per l'esame.

## Che cos'è una race condition (pagine 2-6)

### Slide 2 · Requirements for race condition

> - Two or more processes have access to the same object
> - Algorithm used by processes does not properly enforce an *access order*
> - At least one process modifies the object

**Approfondimento.** Una **race condition** richiede **tre** ingredienti insieme: (1) un **accesso condiviso**, due o più thread o processi concorrenti toccano lo stesso oggetto (una variabile, un file, una riga di database); (2) **nessun ordine imposto**, il codice non controlla l'ordine in cui le loro operazioni si intrecciano; e (3) **almeno uno che scrive**, almeno uno di loro *modifica* l'oggetto (due lettori non entrano mai in conflitto). Quando valgono tutti e tre, il risultato dipende dai *tempi* imprevedibili dell'intreccio, quindi il programma a volte è corretto e a volte no. Basta togliere uno degli ingredienti (niente condivisione, ordine imposto con i lock, o accesso in sola lettura) e la race sparisce. Il nome "race" (corsa) va preso alla lettera: l'esito dipende da quale thread "vince la corsa" verso l'oggetto.

### Slide 3-4 · Simple Java servlet (il contatore difettoso)

\`\`\`java
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class Counter extends HttpServlet {
    int count = 0;
    public void doGet(HttpServletRequest in, HttpServletResponse out)
            throws ServletException, IOException {
        out.setContentType("text/plain");
        PrintWriter p = out.getWriter();
        count++;                                 // (slide 4: p.println(++count + ...))
        p.println(count + " hits so far!");
    }
}
\`\`\`

**Analisi del codice.** Una servlet che conta le visite, la race condition da manuale.

- *Perché c'è una race.* Un servlet container gestisce molte richieste **in modo concorrente**, eseguendo \`doGet\` in **più thread contemporaneamente**, che condividono tutti l'unico campo d'istanza \`count\` (un solo oggetto \`Counter\` serve tutte le richieste). Ci sono quindi tutti e tre gli ingredienti della slide 2: \`count\` condiviso, nessun ordine e uno che scrive (\`count++\`).
- *Il bug.* \`count++\` (e il \`++count\` della slide 4) **non è atomico**: si compila in *leggi \`count\`, aggiungi 1, riscrivi \`count\`* (tre passi). Se due thread lo eseguono insieme, entrambi possono leggere lo stesso valore vecchio (per esempio 41), entrambi aggiungono 1, entrambi scrivono 42, quindi **due visite vengono contate come una** (un *aggiornamento perso*). Il conteggio mostrato è sbagliato, e ogni tanto due utenti vedono lo stesso numero.
- La *slide 4* riscrive soltanto \`count++; println(count...)\` come \`println(++count...)\`; c'è **ancora la race**: unire l'incremento alla stampa non lo rende atomico (la sequenza leggi-modifica-scrivi resta invariata), e aggiunge una seconda race fra l'incremento e la lettura di \`count\` per la stampa. (Piccolo refuso: le slide scrivono \`Printwriter\`; la classe vera è \`PrintWriter\`.)
- *Perché conta per la sicurezza*: un contatore sbagliato è innocuo, ma lo *stesso schema di bug* su un valore condiviso rilevante per la sicurezza, un saldo, una quota, un flag "isAuthenticated", un contatore di riferimenti, è sfruttabile (slide 11-12, 20). La correzione è rendere atomico l'aggiornamento (slide 7-9).

### Slide 5 · Race Conditions (la forma generale)

> - In a pre-emptively multi-tasked environment, anything can happen in-between the execution of two statements - Check if something is OK to do - Do it (perhaps the conditions have changed?)
> - Semaphores and locks are mechanisms that prevent concurrent access to, or modification of, an object by different processes

**Approfondimento.** In un sistema con **multitasking preemptive** lo scheduler può **cambiare thread in qualunque punto**, anche fra due istruzioni consecutive, quindi **"in mezzo può succedere di tutto"**. Lo schema pericoloso è il **check-then-act**: si *controlla* che qualcosa vada bene, poi si *agisce* in base a quell'ipotesi, ma fra le due cose la condizione può essere **cambiata** (un altro thread ha modificato l'oggetto condiviso). È l'essenza sia delle race condition sia del TOCTOU (slide 19). I meccanismi classici di correzione sono **lock e semafori**: rendono sequenziale l'accesso in modo che controllo e azione avvengano come un'unica unità non interrompibile (mutua esclusione). Un *semaforo* è un contatore che sorveglia una risorsa; un *lock/mutex* concede l'accesso esclusivo a un thread alla volta.

### Slide 6 · To fix race conditions

> - Race condition occurs when a certain condition assumed true does not hold
> - *Window of vulnerability*: interval of time when violation of assumption leads to incorrect behavior
> - Reduce window to zero: make relevant code atomic
> - An operation that cannot be interrupted with regards to an object is called "atomic"

**Approfondimento.** La correzione formulata con precisione. Una race avviene perché un'ipotesi ("il saldo è ancora ≥ dell'importo che ho appena controllato") può essere **resa falsa da un altro thread**. La **finestra di vulnerabilità** è l'intervallo di tempo fra quando si stabilisce l'ipotesi (il controllo) e quando ci si basa su di essa (l'azione); durante quella finestra un altro thread può romperla. La cura è **ridurre quella finestra a zero** rendendo **atomici** controllo e azione: un'operazione **atomica** è un'operazione che **non può essere interrotta** rispetto all'oggetto, quindi nessun altro thread può osservarlo o modificarlo a metà dell'operazione. L'atomicità si ottiene con i lock (slide successive), con istruzioni hardware atomiche (compare-and-swap) o con le transazioni (database).

## Correggere con i lock (pagine 7-9)

### Slide 7 · Java synchronized

> - The synchronized keyword ensures that only a single thread will execute a statement or block at a time - Prevents thread from observing object in inconsistent state - Enforces appropriate sequencing of state transitions
> - The JVM implementation is responsible for enforcing it
> - It can have a significant impact on efficiency

**Approfondimento.** La parola chiave **\`synchronized\`** di Java fornisce la mutua esclusione: un thread deve acquisire il **monitor (lock intrinseco)** dell'oggetto prima di entrare in un metodo o in un blocco \`synchronized\`, e lo può tenere **un solo thread alla volta**, quindi il codice protetto viene eseguito in modo atomico rispetto a quel lock. Questo **impedisce a un altro thread di vedere l'oggetto in uno stato aggiornato a metà (incoerente)** e impone un ordine ben definito dei cambiamenti di stato. La JVM garantisce il locking (e la visibilità della memoria associata, tramite il Java Memory Model). Il compromesso notato nella slide: **la sincronizzazione costa in prestazioni**, i thread si bloccano in attesa del lock, rendendo sequenziale un lavoro che potrebbe essere parallelo, quindi si sincronizza il *minimo* necessario (slide 9), non tutto. Sincronizzare troppo rischia anche il **deadlock** (due thread che aspettano ciascuno un lock tenuto dall'altro).

### Slide 8 · Revised Java servlet (metodo synchronized)

\`\`\`java
public class Counter extends HttpServlet {
    int count = 0;
    public synchronized void doGet(HttpServletRequest in, HttpServletResponse out)
            throws ServletException, IOException {
        out.setContentType("text/plain");
        PrintWriter p = out.getWriter();
        count++;
        p.println(count + " hits so far!");
    }
}
\`\`\`

**Analisi del codice.** La prima correzione: dichiarare **\`synchronized\`** l'intero metodo \`doGet\`. Ora un solo thread alla volta esegue \`doGet\` (tenendo il lock sull'istanza di \`Counter\`), quindi la sequenza leggi-modifica-scrivi di \`count\` è atomica e nessuna visita va persa.

- *Lo svantaggio.* Sincronizzare l'**intero metodo** rende sequenziale *tutto* ciò che contiene, compreso l'I/O lento (\`setContentType\`, \`getWriter\`, \`println\` che scrive in rete). Mentre una richiesta scrive lentamente la sua risposta, **tutte le altre richieste si bloccano**, distruggendo la concorrenza e il throughput: un problema di prestazioni (e di disponibilità). Solo il piccolo \`count++\` ha davvero bisogno di protezione. (Piccolo refuso: la slide scrive \`Public\` con la maiuscola; le parole chiave di Java sono minuscole.)
- *La lezione*: corretto ma troppo grossolano; la slide successiva restringe il lock.

### Slide 9 · Improved Java servlet (blocco synchronized)

\`\`\`java
public class Counter extends HttpServlet {
    int count = 0;
    public void doGet(HttpServletRequest in, HttpServletResponse out)
            throws ServletException, IOException {
        int my_count;
        out.setContentType("text/plain");
        PrintWriter p = out.getWriter();
        synchronized (this) {
            my_count = ++count;        // only the shared update is locked
        }
        p.println(my_count + " hits so far!");
    }
}
\`\`\`

**Analisi del codice.** La correzione migliore: un **blocco \`synchronized\`** attorno *soltanto* alla sezione critica.

- *Come funziona.* Sotto il lock gira solo \`my_count = ++count;\`, l'unica operazione che tocca il \`count\` condiviso. L'incremento è atomico *e* il valore corrente viene salvato nella variabile **locale al thread** \`my_count\` mentre si tiene ancora il lock. L'I/O lento (\`println\`) avviene **fuori** dal lock, usando il privato \`my_count\`, quindi durante l'I/O le richieste non si bloccano più a vicenda.
- *Perché \`my_count\` conta.* Rileggere \`count\` per la \`println\` (come nella slide 8) sarebbe un *secondo* accesso non protetto, un'altra race (il valore potrebbe cambiare fra l'incremento e la stampa). Salvarlo in \`my_count\` dentro il lock garantisce che ogni richiesta stampi esattamente il valore che ha prodotto.
- *Il principio*: **rendere la sezione critica la più piccola possibile**, proteggere esattamente l'accesso allo stato condiviso e niente di più. Questo massimizza la concorrenza eliminando la race. (Il Java moderno preferirebbe \`AtomicInteger count; int my_count = count.incrementAndGet();\`, un'operazione atomica senza lock.)

## Altri esempi di race (pagine 10-13)

### Slide 10 · Other Example Race Condition (chmod)

> - User 1 creates a file with world-writable permissions
> - User 1 wants to change the permissions to exclude others with \`chmod 700 filename\`
> - User 2 tries to overwrite the file in-between
> - Will user 1 or user 2 succeed? - User 1 should have set the umask correctly!

**Approfondimento.** Una race sul file system. L'utente 1 crea un file che per un momento è **scrivibile da tutti**, poi esegue \`chmod 700\` per chiuderlo. Ma c'è una **finestra** fra la creazione e la \`chmod\` durante la quale il file *è* scrivibile da chiunque, quindi l'utente 2 può infilarsi e sovrascriverlo. Se l'utente 2 riesce dipende dai tempi. La correzione ("impostare correttamente la \`umask\`") è **creare il file già sicuro**: la \`umask\` (la maschera di creazione dei file dell'utente) toglie dei bit di permesso al momento della creazione, quindi con una umask corretta il file non è *mai* scrivibile da tutti, e non c'è alcuna finestra insicura in cui infilarsi. È il principio delle "impostazioni predefinite sicure / fallire in modo sicuro" (Lezione 10): stabilire lo stato sicuro in modo atomico alla creazione, invece di creare e poi sistemare con un intervallo in mezzo.

### Slide 11 · Database Race Condition

> - If (condition for field 1) then do something to field 2
> - However process 2 changes field 1 in-between...
> - Result: invalid combination of values (e.g., bank account balance)

**Approfondimento.** La race check-then-act in un database. Il processo 1 controlla una condizione sul \`field 1\`, poi aggiorna il \`field 2\` in base a essa, ma il processo 2 modifica il \`field 1\` nella finestra intermedia, quindi l'aggiornamento del \`field 2\` si basa ora su una condizione superata, lasciando una **combinazione di valori non valida** (un invariante rotto, per esempio il saldo di un conto incoerente con il registro delle sue transazioni). Per questo i database forniscono le **transazioni** con livelli di isolamento e lock (\`SELECT ... FOR UPDATE\`, isolamento serializzabile): rendono atomici controllo e azione al livello del database, così nessuna transazione concorrente può infilarsi in mezzo. Un check-then-act a livello di applicazione su dati del database, senza una transazione, è una race classica.

### Slide 12 · Example Race Condition (lo scoperto)

> - Two processes: red and blue
> - Red: Check that user 1 has enough money to pay check #y
> - Blue: Check that user 1 has enough money to pay check #x
> - Red: Pay check #y
> - Is there really enough money to pay check #x?

**Approfondimento.** Una race check-then-act concreta e sfruttabile, il classico **double spending / scoperto**. Entrambi i processi *controllano* il saldo (diciamo 100 €, sufficiente per ciascun controllo preso da solo), **entrambi i controlli passano** perché nessuno dei due ha ancora detratto, poi entrambi *pagano* (detraendo 100 € ciascuno), portando il conto a -100 €. L'invariante "non pagare mai più del saldo" viene violato perché le due sequenze **check-then-act** si sono intrecciate. È la versione reale del bug di \`count++\` della servlet, e la stessa classe dell'avvertimento "spendere due volte gli stessi soldi" sulla funzione \`decrease\` della Lezione 1. È sfruttabile: un attaccante lancia *di proposito* richieste concorrenti per vincere la race (prelievi concorrenti, utilizzi di coupon, votazioni). La correzione: rendere atomici controllo e detrazione (una sezione critica con lock o una transazione di database con l'isolamento adeguato).

### Slide 13 · Effects of Race Conditions

> - Normally: race conditions show up as periodic errors; frequency of the error will depend upon how likely the 'bad' order is to occur; it is often hard to get race condition errors to repeat
> - When exploited: crackers can attempt to force the particular conditions that will produce a flaw; depending upon the exact form of the flaw, it may be produced with high probability; most common (mis)use: modify the value of some shared object

**Approfondimento.** Perché le race sono pericolose *e* difficili da scoprire:

- **Normalmente** (come bug di affidabilità) le race producono errori **intermittenti e non riproducibili**: avvengono solo nel raro intreccio "cattivo", con una frequenza che dipende dai tempi, e sono notoriamente **difficili da riprodurre e da correggere** (possono sparire sotto un debugger che cambia i tempi, un "Heisenbug").
- **Quando vengono sfruttate**, l'attaccante ribalta la situazione: invece di aspettare il raro intreccio cattivo, lo **provoca di proposito**, tempestando il sistema di richieste concorrenti, rallentando un passo (il \`nice\` della slide 15) o allargando la finestra, così un evento "raro" per caso diventa **riproducibile in modo affidabile** a comando. L'**exploit più comune** è **modificare un oggetto condiviso** nel momento critico (un saldo, un nome di file, un permesso). Ecco perché una race condition che sembra un innocuo bug ballerino può essere una vulnerabilità grave e sfruttabile ripetutamente.

## L'attacco TOCTOU a mkdir (pagine 14-17)

### Slide 14 · Example: mkdir (la sequenza non atomica)

> mkdir is actually a fairly complex sequence of actions. Here are some of the actions triggered by mkdir under an early implementation for a Unix system:
>
> - Superuser creates a directory object dir
> - Permissions are set to 777.
> - Superuser does a chown to change the ownership of the directory to the calling user.
> - Modify permissions via umask(2) to match the environment umask value.
>
> Can you spot the problem??

**Approfondimento.** La classica race di un programma setuid. Nel vecchio Unix \`mkdir\` era un programma **setuid-root** (doveva esserlo, perché creare una voce di directory richiede privilegi). Ma faceva il suo lavoro in **diversi passi separati e non atomici**: (1) creare l'oggetto directory \`dir\`, (2) impostarne i permessi a 777 (tutto per tutti), (3) farne il \`chown\` all'utente che ha invocato \`mkdir\`, (4) applicare la umask. Il difetto cruciale: fra il passo 1/2 (la directory esiste, di proprietà di **root**) e il passo 3 (la proprietà passa all'utente) c'è una **finestra** in cui esiste un oggetto di proprietà di root con un nome che l'attaccante conosce. Poiché questi passi **non sono atomici**, un attaccante può intervenire nell'intervallo: il "can you spot the problem?" trova risposta nelle due slide successive.

### Slide 15 · One difficulty (la preparazione dell'exploit)

> From the man pages: The mkdir command creates specified directories in mode 777. The directories are then modified by umask(2), according to how you have set up umask.
>
> Patient crackers can automate a process to exploit this race condition to obtain ownership of file. Here is a well-known method:
>
> - Find a writable directory
> - Start a scanning program that will look for creation of /tmp/junk
> - Start up mkdir /tmp/junk and use nice to cause it to run slowly in the background.
> - Move scanner to foreground.

**Approfondimento.** Come l'attaccante **allarga e vince** la race (si ricordi la slide 13: provocare i tempi cattivi). L'attaccante esegue \`mkdir /tmp/junk\` ma usa **\`nice\`** per abbassarne la priorità di scheduling così che giri **lentamente**, **allungando di proposito la finestra di vulnerabilità** fra i passi della slide 14. Intanto un programma **scanner** veloce osserva il momento in cui viene creato \`/tmp/junk\` (il passo 1, di proprietà di root). Portando lo scanner in primo piano (priorità alta) e il lento \`mkdir\` in background, l'attaccante rende molto probabile che lo scanner agisca **dentro la finestra**. È la tecnica generale per sfruttare le race: rallentare la vittima, correre veloci, e fare in modo di agire fra il controllo o la creazione e l'uso.

### Slide 16 · Flaw continued (la sostituzione con un link simbolico)

> When the scanner spots the new directory:
>
> 1. Remove the original /tmp/junk
> 2. Create a link from the secret file you want to /tmp/junk
>
> Suppose the scanner's link in (2) beat the mkdir's chown. Now mkdir will change the ownership of the secret file to cracker.

**Analisi del codice.** Il guadagno della race, un **attacco con link simbolico**.

- *L'exploit.* Nell'istante in cui lo scanner vede creato \`/tmp/junk\` (il passo 1 di \`mkdir\`, di proprietà di root), (1) **cancella** il vero \`/tmp/junk\` e (2) crea un **link simbolico** di nome \`/tmp/junk\` che punta a un **file segreto che l'attaccante vuole possedere** (per esempio \`/etc/passwd\`). Se questo vince la race, cioè avviene *prima* che \`mkdir\` esegua il suo \`chown\` (passo 3), allora **il \`chown\` di \`mkdir\` segue il link simbolico e cambia il proprietario del file segreto bersaglio, dandolo all'attaccante**. L'attaccante ora possiede un file che non dovrebbe mai controllare: un'escalation dei privilegi. \`mkdir\` è stato ingannato perché il *nome* \`/tmp/junk\` si riferiva alla directory creata da root al momento del controllo ma al link simbolico dell'attaccante al momento dell'uso: un **TOCTOU** da manuale (slide 19).
- *Perché funziona.* La vulnerabilità sta nell'operare su un **nome di file** (che può essere sostituito sotto i propri piedi) invece che su un riferimento stabile, e nell'eseguire il \`chown\` privilegiato su qualunque cosa quel nome indichi *in quel momento*.
- *La correzione.* Rendere atomica l'operazione / togliere la race: creare la directory **già con il proprietario giusto** (il \`mkdir\` moderno usa la chiamata di sistema \`mkdir(2)\`, che crea con la proprietà di chi chiama e con la modalità filtrata dalla umask in un'unica operazione atomica del kernel: niente passo di chown separato, nessuna finestra); non fare mai il \`chown\` di un percorso controllato da un utente senza privilegi; usare \`O_NOFOLLOW\`/\`lstat\` e operare sui file descriptor, non sui nomi (slide 23); ed evitare nomi prevedibili nelle directory condivise (slide 24).

### Slide 17 · Why do these problems arise?

> - Problem: there are many of these race conditions in operating systems. Many occur in common system utilities. - It is a lot of trouble to identify and then fix them. Often the fix will cause systems to run slower, since it is necessary to coordinate access. Most sites do not have anyone with the time or ability to do so properly.
> - The above explains why it is important that all users of a system be trustworthy.

**Approfondimento.** Due osservazioni che fanno riflettere. Primo, le race condition sono **diffusissime** nel codice dei sistemi operativi e nelle utility comuni, **difficili da trovare** (intermittenti, slide 13) e **difficili da correggere** (una sincronizzazione e un coordinamento corretti sono difficili e spesso **rallentano il sistema**, il costo in prestazioni della slide 7), e molte organizzazioni non hanno le competenze per correggerle come si deve. Secondo, la conseguenza storica: poiché tante utility setuid avevano race di escalation dei privilegi locali, **degli utenti locali bisognava fidarsi**: questi attacchi richiedono un account *locale* per eseguire lo scanner e la vittima rallentata. È proprio per questo che i sistemi multiutente trattavano l'accesso locale come un privilegio importante, e per questo il passaggio a macchine monoutente e al sandboxing ha cambiato il modello delle minacce.

## Il TOCTOU in generale (pagine 18-25)

### Slide 18 · Yet another example (riuso del buffer di cifratura)

> Using same buffer for plaintext and ciphertext
>
> - Load buffer with plaintext
> - Encrypt buffer
> - Send buffer contents to recipient
>
> Looks harmless, until in multithreaded application, last two steps swapped and plaintext is sent. Impossible? Not for Internet Information Server 4 when using SSL (occasional unencrypted packet sent). Use two buffers, zeroing out the ciphertext buffer across calls

**Analisi del codice.** Una race con un impatto sulla **riservatezza**.

- *La sequenza voluta.* Un buffer viene riusato: caricarlo con il testo in chiaro, cifrarlo sul posto, inviare il contenuto (ormai cifrato).
- *La race.* In un server **multithread** l'ordine fra "cifra" e "invia" non è garantito fra i thread, oppure il buffer è condiviso fra le richieste, quindi ogni tanto **l'invio avviene prima che la cifratura sia finita** (o legge un buffer che un altro thread ha riempito di nuovo con testo in chiaro), e **viene trasmesso il testo in chiaro invece di quello cifrato**. Il segreto finisce in rete. Non è un'ipotesi: **Microsoft IIS 4 su SSL** faceva esattamente questo, inviando ogni tanto un **pacchetto non cifrato**, una grave violazione della riservatezza nata da un bug di tempi.
- *La correzione.* **Non condividere un solo buffer** fra il ruolo di testo in chiaro e quello di testo cifrato fra chiamate concorrenti: usare **due buffer separati** (così un invio non può mai prendere dati non cifrati), e **azzerare il buffer cifrato fra una chiamata e l'altra** (così testo in chiaro o cifrato vecchio non può uscire: il punto sull'igiene dei dati della Lezione 10, slide 14 e 30). Più in generale, non condividere stato mutabile fra richieste concorrenti senza sincronizzazione.

### Slide 19 · Race condition vs TOCTOU

> - Race condition aka data race is a common type of bug in concurrent programs - basically: two execution threads mess with the same variable at the same time - not necessarily a security bug
> - Non-atomic check and use aka TOCTOU (Time Of Check, Time of Use) a closely related type of security flaw - Problem: some precondition required for an action is invalidated between the time it is checked and the time the action is performed - typically, this precondition is an access control condition - typically, it involves some concurrency

**Approfondimento.** La distinzione concettuale chiave:

- Una **data race / race condition** è il bug di concorrenza generale: due thread accedono alla stessa variabile in modo concorrente e almeno uno scrive (slide 2). **Non è necessariamente un bug di sicurezza** (il contatore di visite è solo sbagliato, non insicuro).
- Il **TOCTOU (Time-Of-Check to Time-Of-Use)** è il caso particolare **rilevante per la sicurezza** (CWE-367): **una precondizione viene controllata, poi usata come base per un'azione, ma viene invalidata nel mezzo**. Il punto cruciale è che la precondizione invalidata è **di solito una condizione di controllo degli accessi** ("questo file è mio", "ho il permesso", "il saldo è sufficiente"), quindi la race permette all'attaccante di **aggirare un controllo di sicurezza**. "Di solito coinvolge la concorrenza" (il thread dell'attaccante cambia lo stato nell'intervallo), anche se su un file system perfino un singolo processo può essere battuto sul tempo da un attaccante esterno che sostituisce un link simbolico.

Tutti gli esempi sui file (mkdir, chmod, access/open) sono TOCTOU: si controlla un nome o un permesso, poi si agisce su di esso, e l'attaccante cambia nel frattempo ciò a cui punta il nome.

### Slide 20 · Race condition (x = x+1 e la banca)

> - Two concurrent execution threads both execute the statement \`x = x+1;\` where x initially has the value 0.
> - What is the value of x in the end? Answer: x can have the value 2 or 1
> - The root cause of the problem is that x = x+1 is not an atomic operation, but happens in two steps, reading x and assigning the new value, which may be interleaved in unexpected ways
> - Why can this lead to security problems? Think of internet banking, and running two simultaneous sessions with the same bank account… Do try this at home!

**Analisi del codice.** La race minima, lo stesso bug del contatore (slide 3), ridotto all'essenziale.

- *Perché \`x\` può valere 1 invece di 2.* \`x = x+1\` **non è atomico**: è *leggi \`x\`, calcola \`x+1\`, riscrivi*. Un intreccio corretto (prima tutto il thread A, poi B) dà 2. Ma se entrambi i thread **leggono \`x\` (=0) prima che uno dei due scriva**, entrambi calcolano 1 ed entrambi scrivono 1, quindi il valore finale è **1, un aggiornamento perso**. L'esito dipende dall'intreccio.
- *Il lato di sicurezza ("do try this at home").* Si sostituisca \`x\` con il **saldo di un conto** e si eseguano **due sessioni o richieste simultanee** sullo stesso conto: la race dell'aggiornamento perso diventa lo scoperto / double spending della slide 12. Molti bug reali finanziari e di e-commerce (prelevare due volte, usare due volte un buono, superare un limite) sono esattamente questa race \`x = x+1\` al livello del database o dell'applicazione. La correzione è l'atomicità: una transazione di database, un incremento atomico, o un lock attorno alla sequenza leggi-modifica-scrivi.

### Slide 21 · Classic example: mkdir on Unix (riepilogo)

> - mkdir is setuid root, ie. executes as root
> - It creates new directory non-atomically, in two steps: 1. creates the directory, with owner is root; 2. sets the owner, to whoever invoked mkdir
> - Attack: by creating a symbolic link between steps 1 and 2, attacker can own any file

**Approfondimento.** Una riformulazione concisa del TOCTOU di \`mkdir\` delle slide 14-16: un programma **setuid-root** esegue un'operazione privilegiata in modo **non atomico** (crea come root, poi fa il chown all'utente), e l'attaccante infila un **link simbolico** nell'intervallo così che il \`chown\` privilegiato colpisca un file di sua scelta, permettendogli di **possedere qualunque file**. È l'attacco TOCTOU con link simbolico canonico; lo schema da memorizzare è: *programma setuid + operazione privilegiata non atomica su un nome di file + link simbolico controllato dall'attaccante nella finestra*.

### Slide 22 · Other classic UNIX race conditions

> - lpr - print utility with option to remove file after printing - could be used to delete arbitrary files
> - but this still happens - CVE-2003-1073: A race condition in the at command for Solaris 2.6 through 9 allows local users to delete arbitrary files via the -r argument with .. sequences in the job name, then modifying the directory structure after at checks permissions to delete the file and before the deletion actually takes place
> - Combination of race condition with failure to check that file names do not contain ..

**Approfondimento.** Altri bug TOCTOU reali, che mostrano come lo schema ritorni:

- **\`lpr\`** (l'utility di stampa) aveva un'opzione per cancellare un file dopo la stampa; battendolo sul tempo con un link simbolico, gli si poteva far **cancellare file arbitrari** che l'utente non avrebbe dovuto poter toccare.
- **CVE-2003-1073** (\`at\` su Solaris) è un esempio documentato che "succede ancora": \`at\` **controllava i permessi** per cancellare un file, e l'attaccante poi **modificava la struttura delle directory** (con componenti di percorso \`..\` nel nome del job) **prima che la cancellazione avvenisse davvero**, dirottando la cancellazione su un file arbitrario: una finestra check-then-act da manuale. Combina anche la race con un fallimento di **path traversal** (non rifiutare \`..\`, Lezione 5, slide 24), mostrando come due debolezze si sommino (come nel caso di cfingerd della Lezione 4).

### Slide 23 · Example race condition (access / open)

\`\`\`c
const char *filename = "/tmp/erik";
if (access(filename, R_OK) != 0) {
    ... // handle error and exit;
}
// file exists and we have access
int fd = open(filename, O_RDONLY);
...
\`\`\`

> Between calls to access and open the file might be removed!

**Analisi del codice.** Il TOCTOU da manuale in C, la race fra \`access\` e \`open\` (il codice della slide mostra un "int fd" finito per errore nel commento; il vero secondo passo è \`int fd = open(filename, O_RDONLY);\`).

- *Che cosa cerca di fare.* \`access(filename, R_OK)\` **controlla** se l'utente *reale* ha il permesso di lettura sul file (usa l'UID reale, ed è spesso usata dai programmi setuid per "controllare per conto dell'utente che li ha invocati"). Se il controllo passa, il programma **apre** il file.
- *Il difetto TOCTOU.* Fra il **controllo** con \`access\` e l'**uso** con \`open\`, il file a cui si riferisce il *nome* può **cambiare**: l'attaccante può cancellare \`/tmp/erik\` e sostituirlo con un **link simbolico a un file sensibile** (per esempio \`/etc/shadow\`). Il controllo con \`access\` è passato per il file originale, ma \`open\` ora apre il bersaglio *sostituito*, che l'utente non dovrebbe poter leggere. Il controllo e l'uso si applicano a **file diversi**, aggirando il controllo dei permessi.
- *La correzione.* **Non controllare mai un nome per poi agire separatamente sul nome.** Invece: fare \`open\` del file **una volta sola** (lavorando sul **file descriptor** restituito, che è legato all'oggetto vero e non al nome), poi controllare i permessi sul *descriptor* con \`fstat\`; e usare flag come \`O_NOFOLLOW\` per rifiutare i link simbolici. Evitare del tutto \`access()\` per questo scopo: esiste solo per l'insolito caso setuid del "controlla come utente reale" ed è una classica trappola TOCTOU. Lavorare sui descriptor (handle), non sui nomi di file, chiude la finestra.

### Slide 24 · Race condition & file systems

> Signs of trouble:
>
> - Access to files using filenames rather than file handles or file descriptors - filenames may point to different files at different moments in time
> - Creating files or directories in publicly accessible places, for instance /tmp - Especially if these have predictable file names

**Approfondimento.** I due campanelli d'allarme per le race sul file system, una checklist pratica:

- **Lavorare sui nomi di file invece che sui file descriptor.** Un **nome di file non è un riferimento stabile**: il file che indica può essere sostituito (cancellato e ricreato, sostituito con un link simbolico) fra due operazioni, ed è la radice di ogni TOCTOU visto sopra. Un **file descriptor** (o handle) è legato all'oggetto file vero al momento dell'apertura e non può essere scambiato, quindi una volta aperto un file tutti i controlli e le operazioni successive vanno fatte sul *descriptor* (\`fstat\`, \`fchmod\`, \`read\`), non sul nome.
- **Creare file in directory condivise e scrivibili da tutti come \`/tmp\`, soprattutto con nomi prevedibili.** Se un attaccante può **prevedere il nome di file** che il programma userà in \`/tmp\`, può **crearlo prima** (come link simbolico, o con i propri permessi) e dirottarlo. Difese: usare il flag di creazione atomica ed esclusiva **\`O_CREAT | O_EXCL\`** (che fallisce se il file esiste già, sventando la creazione anticipata), usare \`mkstemp()\`, che crea in modo sicuro un file con un nome **imprevedibile**, impostare una **umask** corretta (slide 10), e preferire una directory privata a \`/tmp\`.

### Slide 25 · Promising future for data races?

> - Trend: more multi-CPU machines - to keep improving computer power in accordance with Moore's Law, despite physical constraints
> - Hence: more multi-threaded software - to take advantage of max. available computing power
> - Hence: many problems with data races in code - as programmers cannot cope with concurrency - writing correct concurrent programs is hard
> - \\[Interesting article to read: "The free lunch is over: a fundamental turn toward concurrency in software", by Herb Sutter\\]

**Approfondimento.** Un avvertimento rivolto al futuro (con un titolo ironico: il "futuro promettente" è per gli *attaccanti*). La tendenza dell'hardware è **più core, non core più veloci**: i limiti fisici (energia, calore) hanno chiuso l'era delle frequenze di clock sempre più alte, quindi oggi i guadagni di prestazioni vengono dal **parallelismo** (più CPU, più core). Per usare quella potenza il software deve essere **multithread**, il che significa **più concorrenza, e quindi più data race**, perché **scrivere codice concorrente corretto è davvero difficile** e la maggior parte dei programmatori sbaglia. Quindi ci si aspetta che il numero di bug di race condition (e TOCTOU) *cresca*, rendendo questa classe di vulnerabilità sempre più importante. L'influente saggio di Herb Sutter del 2005 **"The Free Lunch Is Over"** sosteneva proprio questo: i programmi non diventano più veloci gratis a ogni generazione di CPU, gli sviluppatori devono abbracciare la concorrenza, e con essa i suoi bug. La risposta moderna: modelli di concorrenza più sicuri (immutabilità, scambio di messaggi, async/await), linguaggi che impediscono le data race in compilazione (l'ownership e \`Send\`/\`Sync\` di Rust), e rilevatori di race (ThreadSanitizer, Lezione 6).
`;export{e as default};
