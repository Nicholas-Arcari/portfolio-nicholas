La Lezione 2 verifica i prerequisiti con brevi pezzi di codice C e Java (ognuno nasconde un bug di sicurezza), racconta la storia di "Trusting Trust" di Ken Thompson e fissa il vocabolario di base: bug, vulnerabilità, exploit, minaccia, malware, contromisure. Le slide sono 27.

## Prerequisiti e codice di esempio (pagine 1-5)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Warm-up

### Slide 2 · Prerequisites

> Introductory security course ?
>
> Elementary OS and DB
>
> Basic programming skills, in particular
>
> - C(++)
>   - eg. `malloc()`, `free()`, `*(p++)`, `strings` in C using `char*`
> - Java
>   - eg. public, final, private, protected
> - Bits of PHP and javascript

**Approfondimento.** Un breve ripasso delle nozioni elencate, perché ogni attacco del corso si basa su di esse.

- `malloc(n)` riserva n byte sullo **heap** e restituisce un puntatore a essi, oppure `NULL` se fallisce; la memoria non è inizializzata. `free(p)` restituisce il blocco all'allocatore. Usare `p` dopo `free` è un *use-after-free*, chiamare `free` due volte su di esso è un *double free*: entrambi sono bug di corruzione della memoria sfruttabili.
- `*(p++)` legge l'elemento a cui punta `p` e poi fa avanzare `p` all'elemento successivo (il post-incremento restituisce il valore vecchio). È l'idioma dietro il classico ciclo di copia di stringhe `while ((*d++ = *s++) != '\0');`, che copia fino al terminatore e non controlla mai la dimensione della destinazione: l'essenza di un buffer overflow.
- Le **stringhe in C** sono array di `char` terminati dal byte NUL `'\0'`; un `char*` punta al primo carattere. La lunghezza non è memorizzata da nessuna parte: le funzioni trovano la fine cercando `'\0'`. Per questo `strlen("abc")` vale 3 ma la stringa occupa 4 byte. Dimenticare quel byte in più, o il terminatore stesso, causa innumerevoli overflow (slide successiva).
- **I modificatori di Java.** `private`: visibile solo dentro la classe; nessun modificatore (package-private): dentro lo stesso package; `protected`: stesso package più le sottoclassi; `public`: ovunque. `final` su una classe vieta le sottoclassi, su un metodo vieta l'override, su un campo vieta di riassegnarlo dopo l'inizializzazione (l'oggetto riferito può restare mutabile). Sono la base dell'incapsulamento e della sicurezza basata sul linguaggio.
- **PHP e JavaScript** servono per le vulnerabilità web (SQL injection, XSS); le basi di **sistemi operativi e database** per la disposizione della memoria dei processi, le chiamate di sistema, utenti e permessi, e le query SQL.

### Slide 3 · Sample C Code

Il codice della slide:

```c
char* copying_a_string(char* a) {
   char* b = malloc(strlen(a));
   strcpy(b,a);
   return(b);
}
int using_pointer_arithmetic(int pin[]) {
   int sum = 0;
   int *pointer = pin;
   for (int i=0; i<4; i++ ){
    sum = sum + *pointer; pointer++;
   }
   return sum;
}
```

**Analisi del codice.** La slide è presentata come una verifica delle competenze di C, ma entrambe le funzioni contengono bug di sicurezza da manuale.

*Funzione 1, `copying_a_string`*: dovrebbe restituire una copia sullo heap della stringa `a`.

- **Heap overflow off-by-one.** `strlen(a)` conta i caratteri *senza* il `'\0'` finale, ma `strcpy` li copia *più* il terminatore. Così `strlen(a) + 1` byte vengono scritti in un blocco di `strlen(a)` byte, e il `'\0'` finisce un byte oltre la fine del blocco dello heap. Esempio: con `a = "hello"` viene chiamata `malloc(5)` ma `strcpy` scrive 6 byte.
- **Perché un solo byte conta.** Gli allocatori dello heap tengono i loro metadati subito accanto ai dati dell'utente. Con glibc su x86-64 una richiesta come 24 byte non lascia margine, quindi il NUL di troppo sovrascrive il byte più basso del campo dimensione del chunk successivo. Questa tecnica, il *poison null byte*, fa calcolare male all'allocatore le dimensioni dei chunk, produce chunk sovrapposti e alla fine fa consegnare memoria che si sovrappone a oggetti vivi: un overflow di un byte può finire con l'esecuzione di codice. Per altre dimensioni il byte cade nel riempimento di allineamento e non succede nulla di visibile, ed è proprio per questo che bug del genere sopravvivono ai test.
- **`malloc` non controllata.** Se l'allocazione fallisce, `malloc` restituisce `NULL` e `strcpy(NULL, a)` va in crash: un denial of service.
- **Nessun controllo su `a`**: anche `strlen(NULL)` va in crash.
- **Chi possiede la memoria**: chi chiama deve fare `free` del risultato, altrimenti la memoria si perde, un denial of service lento nei server che restano accesi a lungo.

Versione corretta:

```c
#include <stdlib.h>
#include <string.h>

char *copying_a_string(const char *a) {
    if (a == NULL)
        return NULL;
    size_t len = strlen(a);
    char *b = malloc(len + 1);          /* +1 for the terminating '\0' */
    if (b == NULL)
        return NULL;                     /* allocation failed: report it */
    memcpy(b, a, len + 1);               /* copies the terminator as well */
    return b;                            /* the caller must free(b) */
}
```

La funzione POSIX `strdup(a)`, che da C23 fa parte anche del C standard, fa esattamente questo.

*Funzione 2, `using_pointer_arithmetic`*: dovrebbe sommare le quattro cifre di un PIN.

- **Lettura fuori dai limiti.** In C un parametro array `int pin[]` è solo un puntatore (`int *pin`): la funzione non ha modo di sapere quanti elementi abbia davvero l'array di chi la chiama, eppure il ciclo legge alla cieca quattro interi. Se chi chiama passa un array più corto (un PIN di 3 cifre, o un PIN ricavato dall'input dell'utente), la funzione legge oltre la sua fine. È comportamento indefinito; in pratica legge quello che c'è subito dopo in memoria (altre variabili, magari segreti): una *fuga di informazioni*, lo stesso tipo di bug di Heartbleed.
- **Il numero magico 4**: la dimensione è scritta nel codice invece di essere passata da chi chiama.
- **Aritmetica dei puntatori**: `pointer++` avanza di `sizeof(int)` byte, che qui è giusto, ma l'aritmetica dei puntatori non ha mai controlli sui limiti ed è facile sbagliarla.
- Un **integer overflow** di `sum` è possibile se i valori non sono piccole cifre, e un argomento `NULL` manda in crash la funzione.

Versione corretta:

```c
#include <stddef.h>
#include <limits.h>

/* Returns 0 on success, -1 on error; the sum is stored in *out. */
int sum_array(const int *pin, size_t len, int *out) {
    if (pin == NULL || out == NULL)
        return -1;
    long long sum = 0;                   /* wider accumulator */
    for (size_t i = 0; i < len; i++)     /* bound supplied by the caller */
        sum += pin[i];
    if (sum > INT_MAX || sum < INT_MIN)  /* result must fit in an int */
        return -1;
    *out = (int)sum;
    return 0;
}
```

### Slide 4 · Sample Java Code

Il codice della slide:

```java
public int summingAnArray(int[] pin)
            throws NullPointerException,
                   ArrayIndexOutOfBoundsException{

   int sum = 0;
    for (int i=0; i<4; i++ ){
            sum = sum + a[i];
   }
   return sum;
}
```

**Analisi del codice.** La stessa funzione del C, ora in Java. Che cosa cambia:

- **Un bug nel frammento stesso.** Il ciclo legge `a[i]`, ma il parametro si chiama `pin`. Così com'è il codice non compila ("cannot find symbol: a"), a meno che `a` non sia per caso un campo della classe, nel qual caso il parametro viene ignorato in silenzio. La riga voluta è `sum = sum + pin[i];`.
- **Memory safety.** Ogni array Java porta con sé la propria lunghezza, e la JVM controlla ogni accesso: se `pin` ha meno di quattro elementi, `pin[3]` lancia `ArrayIndexOutOfBoundsException` invece di leggere la memoria adiacente; se `pin` è `null`, viene lanciata una `NullPointerException`. La lettura fuori dai limiti del C diventa un errore ben definito: niente corruzione della memoria, niente fuga di informazioni. È la *sicurezza basata sul linguaggio* (Lezione 1, slide 58).
- **La clausola `throws`.** Entrambe le eccezioni sono *unchecked* (sottoclassi di `RuntimeException`), quindi dichiararle è facoltativo: qui serve solo a documentare il comportamento. Un'eccezione che nessuno cattura termina comunque il thread, un rischio residuo di **denial of service** quando l'input arriva da un attaccante. Nemmeno gli stack trace vanno mostrati agli utenti (divulgazione di informazioni).
- **Che cosa Java non controlla: l'integer overflow.** `sum + pin[i]` si riavvolge in silenzio (complemento a due), esattamente come il C in pratica, anche se in Java il riavvolgimento è un comportamento definito. `Math.addExact` invece lancia una `ArithmeticException`.
- Di nuovo il **4 scritto nel codice**: si usa `pin.length`.

Versione corretta:

```java
public int summingAnArray(int[] pin) {
    Objects.requireNonNull(pin, "pin must not be null");
    int sum = 0;
    for (int value : pin) {                 // iterates exactly pin.length times
        sum = Math.addExact(sum, value);    // ArithmeticException on overflow
    }
    return sum;
}
```

### Slide 5 · Sample Java OO Code

Il codice della slide:

```java
final class A {
    public final static SOME_CONSTANT 2;
    private B b1, b2;

    protected A ShallowClone(Object o)
                throws ClassCastException {
           x = new(A);
           x.b1 =((A)o).b1;
           x.b2 =((A)o).b2;
           return x;
    }
}
```

**Analisi del codice.**

- **Pseudo-Java.** Così com'è non compila: la costante non ha tipo né `=` (dovrebbe essere `public static final int SOME_CONSTANT = 2;`), `x` non viene mai dichiarata, e `new(A)` non è sintassi Java (`A x = new A();`). I nomi dei metodi di solito sono in lowerCamelCase (`shallowClone`).
- **`final class`**: non si possono creare sottoclassi di `A`. Dal punto di vista della sicurezza, questo impedisce a un attaccante di passare, dove ci si aspetta un `A`, una sottoclasse malevola che ridefinisce i metodi per catturare o alterare lo stato interno o per saltare dei controlli. Le Secure Coding Guidelines for Java SE di Oracle raccomandano proprio di limitare così l'estensibilità delle classi sensibili per la sicurezza.
- **`private B b1, b2`**: stato incapsulato. Si noti che in Java `private` vale per *classe*, non per oggetto, ed è per questo che il metodo può leggere `((A)o).b1` da un'altra istanza.
- **`protected` in una classe final**: siccome non può esistere alcuna sottoclasse, qui `protected` significa solo package-private (ogni classe dello stesso package può chiamarlo). Si sceglie sempre il modificatore più ristretto che funziona.
- **Copia superficiale, quindi aliasing (il problema di sicurezza principale).** Il clone copia i *riferimenti* a `b1` e `b2`, non gli oggetti. Originale e clone condividono gli stessi oggetti `B`, quindi se `B` è mutabile una modifica fatta attraverso l'uno si vede attraverso l'altro. Chi ottiene il clone può quindi modificare lo stato privato dell'originale, rompendone l'incapsulamento e gli invarianti. Un attacco tipico: un controllo viene fatto su un oggetto condiviso, che poi viene modificato attraverso un alias prima di essere usato (un problema time-of-check to time-of-use). Correzione: *copie difensive (profonde)* dei componenti mutabili, oppure rendere `B` immutabile.
- **Cast non controllato**: `(A)o` lancia `ClassCastException` se `o` non è un `A`, e `NullPointerException` se `o` è `null`. Dichiarare il parametro con il tipo statico giusto lascia il controllo al compilatore.

Versione corretta (supponendo che `B` abbia un costruttore di copia, o sia immutabile):

```java
final class A {
    public static final int SOME_CONSTANT = 2;
    private final B b1, b2;

    A(B b1, B b2) {
        this.b1 = new B(b1);              // defensive copies on the way in
        this.b2 = new B(b2);
    }

    static A copyOf(A o) {                // statically typed: no cast needed
        Objects.requireNonNull(o);
        return new A(o.b1, o.b2);         // deep copy: no shared mutable state
    }
}
```

## Trusting TRUST (pagine 6-9)

La pagina 6 è il divisore di sezione "Trusting TRUST".

### Slide 7 and 9 · Trusting Trust

> **Ken Thompson:** Co-Creator of *UNIX* and *C*
>
> **Turing Award:** 1983

**Figura.** Un ritratto di Ken Thompson. A pagina 9 la stessa foto ha il timbro "HACKER" in rosso.

**Approfondimento.** Ken Thompson ha creato UNIX insieme a Dennis Ritchie ai Bell Labs, e ha progettato il linguaggio B, il diretto predecessore del C di Ritchie; i due hanno condiviso il Turing Award del 1983 per UNIX. Il timbro "HACKER" si riferisce alla sua lezione per il premio (slide successiva), in cui spiegò come avrebbe potuto piazzare una backdoor invisibile in ogni sistema UNIX.

### Slide 8 · Trusting Trust (la backdoor nel compilatore)

![Lezione 2, pagina 8](L02_p08.webp "50% 1400x971")

**Figura.** Una schermata di normale codice sorgente C (la funzione `print_section_stabs` di `objdump.c`, parte di GNU binutils) entra in un riquadro con la scritta COMPILER, che produce il binario `011001001111010`. Una nuvoletta mostra che cosa contiene di nascosto il compilatore:

```c
...
if(program == "login")    add-login-backdoor();
if(program == "compiler") add-compiler-backdoor();
```

**Approfondimento.** È la lezione per il Turing Award di Thompson, *Reflections on Trusting Trust* (pubblicata in *Communications of the ACM*, agosto 1984). Mostra una backdoor invisibile in ogni file sorgente:

1. **Fase 1, la backdoor nel login.** Il compilatore C viene modificato in modo che, quando riconosce di star compilando il programma `login` di UNIX, inserisca del codice in più che accetta una password maestra segreta per qualunque account. Il sorgente di `login` è pulito; il suo binario no.
2. **Fase 2, la backdoor che si propaga nel compilatore.** Il compilatore viene modificato anche in modo che, quando riconosce di star compilando *un compilatore* (il proprio sorgente), inserisca nel risultato entrambi i pezzi di logica malevola. Il trucco si basa sui programmi che riproducono se stessi (quine).
3. **Fase 3, cancellare le prove.** Il codice malevolo viene tolto dal sorgente del compilatore, e il compilatore viene ricostruito con il binario infetto. Da quel momento compilare il sorgente *pulito* del compilatore con il binario infetto produce un compilatore infetto, per sempre. Esaminare i sorgenti sia di `login` sia del compilatore non rivela nulla.

La morale di Thompson: *"You can't trust code that you did not totally create yourself. (Especially code from companies that employ people like me.) No amount of source-level verification or scrutiny will protect you from using untrusted code."* L'idea era comparsa per la prima volta nella valutazione di Multics fatta nel 1974 per l'aeronautica statunitense da Karger e Schell, che Thompson citò.

**Perché conta per questo corso.**

- Ogni programma si fida implicitamente di una catena di strumenti: compilatore, linker, librerie, sistema di build, gestore di pacchetti, perfino il microcodice della CPU. Fanno parte della **trusted computing base** della build: la "debolezza in profondità" della Lezione 1, slide 35-36.
- **Casi reali.** Il virus *Induc* (2009) infettava le installazioni del compilatore Delphi, quindi ogni programma costruito con esse era infetto. *XcodeGhost* (2015), una copia trojanizzata di Xcode di Apple diffusa da siti di download cinesi, inserì codice malevolo in migliaia di app iOS che arrivarono sull'App Store. *SolarWinds* (2020): gli attaccanti compromisero il sistema di build, così gli aggiornamenti firmati di Orion portarono la backdoor SUNBURST a circa 18.000 clienti. La backdoor di *xz-utils* (2024) era nascosta negli script di build e in file binari di test, e prendeva di mira OpenSSH attraverso il processo di build.
- **Contromisure.** Il *Diverse Double-Compiling* (David A. Wheeler, 2005): compilare il sorgente del compilatore con un secondo compilatore indipendente e verificare che i risultati siano identici bit per bit; le *build riproducibili*, così chiunque può ricostruire un pacchetto e ottenere lo stesso hash del binario; le *build bootstrappable* che partono da un piccolo seme verificabile; catene di fornitura firmate e verificate (il framework SLSA, i software bill of materials).

## Contesto e definizioni (pagine 10-14)

### Slide 10 · Context: What is a computer system?

> *What is a computer system?*
>
> - *(Classical) computer*: mainframe, server, desktop
> - *Mobile device*: phone, tablets, audio/video player, etc. Up to iot, smart cards, ...
> - *Embedded (networked) systems*: inside a car, a plane, a washing machine, etc.
> - *Clouds*
> - But also *industrial networks* (ICS, scada), ... etc.
> - And certainly many more!
>
> Two main interesting characteristics:
>
> 1. Includes hardware + **software**
> 2. Open/connected to the **outside world** ...

**Approfondimento.**

- **IoT** (Internet of Things): sensori e attuatori connessi come telecamere, termostati e serrature. Le **smart card** sono minuscoli computer sicuri (carte bancarie, SIM, passaporti elettronici) con CPU, memoria e sistema operativo propri, che eseguono applet (per esempio Java Card); il loro attaccante può avere fisicamente in mano il dispositivo.
- **Sistemi embedded**: un'automobile moderna di fascia alta contiene circa un centinaio di centraline elettroniche e dell'ordine di 100 milioni di righe di codice, collegate da bus interni e raggiungibili attraverso l'infotainment, il Bluetooth e le connessioni cellulari. Nel 2015 Charlie Miller e Chris Valasek presero il controllo a distanza dello sterzo e dei freni di una Jeep Cherokee attraverso la sua unità di infotainment, il che portò al richiamo di 1,4 milioni di veicoli.
- **Cloud**: il calcolo come servizio (IaaS, PaaS, SaaS) su un'infrastruttura condivisa; l'isolamento fra clienti (multi-tenancy) diventa una proprietà di sicurezza, e tutto è esposto attraverso API.
- **ICS/SCADA** (Industrial Control Systems; Supervisory Control And Data Acquisition): gestiscono reti elettriche, impianti di trattamento delle acque e fabbriche. Erano progettati per l'affidabilità in reti isolate e ora sono connessi, e gli attacchi contro di loro hanno conseguenze fisiche (Stuxnet; gli attacchi del 2015 e del 2016 alla rete elettrica ucraina).
- **Le due caratteristiche** spiegano perché tutto questo rientra nel corso: (1) contengono software, quindi ne ereditano i bug; (2) sono connessi, quindi quei bug sono raggiungibili da attaccanti remoti (si confronti la Lezione 1, slide 20-21).

### Slide 11 · Context: What does security mean?

> *What does security mean?*
>
> - A set of "high-level" security goals:
>
> **CIA** = *confidentiality, integrity, availability (+ non repudiation + ...)*
>
> - Is it *specific* to the computer system we consider?
> - How to deal with "unsecure executions"?
> - Something beyond *safety* and *fault-tolerance*:
>   - Notion of **intruder**, with specific capabilities
>   - Notion of **threats**, with a "threat model"
>
>   There is an "external actor" with an attack objective in mind, and able to elaborate a dedicated strategy to achieve it (not a hazard)
> - A definition "by default":
>   - *Functional properties*: what the system **should** do
>   - *Security properties*: what the system should **not** do, how it should **not** behave

**Approfondimento.**

- **Specifica del sistema?** Sì: il peso di ciascun obiettivo dipende dal sistema. Per una banca domina l'integrità dei saldi; per un dispositivo medico l'integrità e la disponibilità (sono in gioco delle vite); per un'app di messaggistica la riservatezza; per una smart card la resistenza a un attaccante che la tiene fisicamente in mano. Gli obiettivi di alto livello vanno raffinati in una *politica di sicurezza* specifica del sistema (Lezione 1, slide 50).
- Le **esecuzioni "insicure"** sono le esecuzioni che violano la politica. Tre modi di affrontarle: *prevenirle* (renderle impossibili: type safety, controllo degli accessi), *rilevarle* durante l'esecuzione e fermare il programma (monitor, stack canary), oppure *contenerle e riprendersi* (il sandboxing limita i danni, i backup ripristinano i dati). È la triade prevenzione/rilevamento/reazione della Lezione 1, slide 55.
- **Security, safety e tolleranza ai guasti.**
  - La *safety* si occupa dei guasti accidentali che possono causare danni: pericoli come un componente usurato, la lettura sbagliata di un sensore o un bit che cambia a caso. I pericoli seguono distribuzioni di probabilità, quindi si possono stimare i tassi di guasto e dimensionare di conseguenza la ridondanza.
  - La *tolleranza ai guasti* maschera questi guasti casuali (hardware ridondante, nuovi tentativi, codici a correzione d'errore).
  - La *security* affronta un **avversario intelligente**, l'intruso, che sceglie di proposito input e tempi, si adatta alle difese e punta proprio al raro caso limite che il test casuale non tocca mai. Una "probabilità di guasto" non ha senso quando l'attaccante può far accadere l'evento negativo ogni volta. Ross Anderson e Roger Needham la chiamarono "programmare il computer di Satana", in contrapposizione a quello di Murphy.
- **Modello delle minacce.** Una dichiarazione esplicita delle capacità dell'attaccante (che cosa può osservare, inviare, modificare? ha accesso fisico, conoscenze da insider, quanta potenza di calcolo?) e dei suoi obiettivi. Un esempio classico è il modello Dolev-Yao per i protocolli di rete, in cui l'attaccante controlla l'intera rete. Le affermazioni sulla sicurezza hanno senso solo rispetto a un modello delle minacce.
- **Definizione per esclusione**: la stessa idea della Lezione 1, slide 32. Le proprietà di sicurezza sono negative ("non deve"), definite rispetto a tutto ciò che il sistema *potrebbe* fare.

### Slide 12 · Software Security: an example

> Consider 2 programs:
>
> - `Compress`, to compress a file `f`
> - `Uncompress`, to uncompress a (compressed) file `C`
>
> Expected behavior (the one we try to validate)
>
> `Uncompress(Compress(f)) = f` (1)
>
> What about uncompressing an arbitrary (i.e., maliciously crafted) file? (e.g., CVE-2010-0001 for gzip)
>
> `If C is not Compress(f) for any f then Uncompress(C) = "Error_Msg"` (2)
>
> Actually (2) is much more difficult to validate than (1)

**Approfondimento.**

- La **proprietà (1)** è una proprietà *funzionale* (di correttezza): per ogni file f, comprimere e poi decomprimere restituisce f. Riguarda solo input prodotti da `Compress` stessa, cioè dati compressi ben formati, e si può verificare con un grande insieme di file ordinari.
- La **proprietà (2)** è una proprietà di *sicurezza* (robustezza): per ogni input che *non* è il risultato di `Compress` (file troncati, intestazioni corrotte, lunghezze incoerenti, file volutamente malevoli), `Uncompress` deve fallire in modo pulito con un errore, e niente di peggio: niente crash, niente scritture fuori dai limiti, niente cicli infiniti, niente esecuzione di codice.
- **Perché la (2) è molto più difficile.** L'insieme degli input non validi è infinito e senza struttura, e un attaccante non lo campiona a caso: lo *esplora* in cerca del singolo input che attiva un bug. Validare la (1) richiede pochi file buoni; validare la (2) significa esplorare uno spazio astronomicamente grande. È esattamente ciò che il **fuzzing** automatizza (Lezione 6), ed è per questo che i parser devono controllare ogni campo prima di usarlo.
- **CVE-2010-0001**: un *integer underflow* nella funzione `unlzw` di gzip prima della 1.4 (la decompressione del vecchio formato LZW `.Z`) sulle piattaforme a 64 bit. Un archivio costruito ad arte causa un errore di indice di un array, che permette un crash o forse l'esecuzione di codice arbitrario: bastava eseguire `gunzip` su un file scaricato.
- **Anche un input valido può essere malevolo.** Le *bombe di decompressione* (il noto 42.zip pesa 42 KB compresso e petabyte decompresso) esauriscono disco e memoria, quindi un decompressore robusto deve anche limitare la dimensione dell'uscita e la profondità di annidamento.
- **LangSec** (language-theoretic security) generalizza la lezione: trattare ogni formato di input come un linguaggio formale e *riconoscere completamente* l'input (analizzarlo e validarlo) prima di agire su di esso, invece di spargere controlli nel codice che lo elabora ("shotgun parsing").

### Slide 13 · Some Definitions

> **Bug**: an error (or defect/flaw/failure) introduced in a SW
>
> - At the *specification/design/algorithmic level*
> - At the *programming/coding level*
> - Or even by the compiler (or other program transformation tools).
>
> **Vulnerability**: a bug that opens a security breach
>
> - *Non-exploitable vulnerability*: there is no (known!) way for an attacker to use this bug to corrupt the system
> - *Exploitable* vulnerability: this bug can be used to elaborate an Attack (i.e., Write an exploit)
>
> **Exploit**: a concrete program input to take advantage of a vulnerability (from an attacker point of view)
>
> **Malware**: a piece of code "injected" inside a computer to corrupt it (usually exploiting existing vulnerabilities)

**Approfondimento.**

- **"Or even by the compiler".** Il sorgente è corretto ma il binario no. Le cause: bug del compilatore; backdoor alla Trusting Trust (slide 8); e, più spesso, **ottimizzazioni che sfruttano il comportamento indefinito**. Esempi: un controllo `if (ptr + len < ptr)` pensato per rilevare il riavvolgimento viene cancellato, perché l'overflow dei puntatori è indefinito e il compilatore può presumere che non avvenga mai; una `memset(password, 0, n)` subito prima di `free` viene tolta come scrittura inutile (si usano `explicit_bzero` o `memset_s`); un controllo di NULL messo *dopo* una dereferenziazione viene tolto, come nel bug del driver `tun` del kernel Linux del 2009 (CVE-2009-1897), che diventò un exploit per ottenere root.
- **Due terminologie.** Nella Lezione 1 (slide 37) un difetto diventa una *vulnerabilità* solo se è accessibile e sfruttabile. Qui *vulnerabilità* indica qualunque bug che apre una falla di sicurezza, divisa in *sfruttabile* e *non sfruttabile*. La sostanza è la stessa; conviene conoscere entrambi i vocabolari.
- **"(known!)"** è la parola chiave: la non sfruttabilità è un'affermazione sulle conoscenze attuali. Molti bug un tempo liquidati come crash innocui sono diventati sfruttabili grazie a tecniche nuove: gli overflow di un byte NUL (poison null byte), le dereferenziazioni di puntatori NULL nel kernel (sfruttabili mappando memoria all'indirizzo 0, finché non è arrivata la protezione `mmap_min_addr`), gli use-after-free. Ogni bug di memory safety va trattato come potenzialmente sfruttabile.
- **Exploit** come "un input concreto del programma": per un buffer overflow, i byte esatti (riempimento, l'indirizzo di ritorno sovrascritto, lo shellcode) che trasformano il bug nel controllo del programma. Un *proof of concept* (PoC) si limita a dimostrare il bug, per esempio con un crash; un exploit *weaponised* è affidabile e consegna un payload.
- **Malware** (software malevolo): virus, worm, trojan, ransomware, spyware, rootkit, agenti di botnet (Lezione 1, slide 8). Viene "iniettato" o sfruttando vulnerabilità (worm, drive-by download) o ingannando gli utenti (ingegneria sociale, allegati malevoli).

### Slide 14 · Countermeasures

> Several existing mechanisms to **enforce** SW security
>
> - At the programming level:
>   - Disclosed vulnerabilities -> language weaknesses databases -> Secure coding patterns and libraries
>   - Aggressive compiler options + code instrumentation -> early detection of unsecure code
> - At the OS level:
>   - Sandboxing
>   - Address space randomization
>   - Non executable memory zones
>   - Etc.
> - At the hardware level:
>   - Trusted platform modules (TPM)
>   - Secure crypto-processor (intel SGX, …)
>   - CPU tracking

**Approfondimento.**

- **Al livello della programmazione.**
  - *Dalle vulnerabilità rese pubbliche agli schemi sicuri*: ogni vulnerabilità resa pubblica (una CVE) viene classificata sotto un tipo di debolezza (una CWE); i tipi di debolezza ricorrenti diventano regole di programmazione (SEI CERT C, MISRA C) e librerie e API più sicure (`snprintf` invece di `sprintf`, prepared statement invece di SQL costruito con le stringhe, librerie sicure per le stringhe).
  - *Opzioni del compilatore aggressive*: avvisi trattati come errori (`-Wall -Wextra -Werror`, `-Wformat=2 -Wformat-security`) e opzioni di irrobustimento (`-fstack-protector-strong`, `-D_FORTIFY_SOURCE=3`, `-fPIE -pie`, `-Wl,-z,relro,-z,now`, `-fstack-clash-protection`, `-fcf-protection`).
  - *Strumentazione del codice*: il compilatore aggiunge controlli a tempo di esecuzione, i *sanitizer*: AddressSanitizer (`-fsanitize=address`, accessi fuori dai limiti e use-after-free), UndefinedBehaviorSanitizer (`-fsanitize=undefined`, overflow con segno, shift non validi, puntatori non allineati), MemorySanitizer, ThreadSanitizer. Insieme a test e fuzzing scoprono i bug presto, durante lo sviluppo. La Lezione 8 tratta nel dettaglio le difese a tempo di esecuzione.
- **Al livello del sistema operativo.**
  - *Sandboxing*: eseguire il codice con i diritti minimi (seccomp-bpf su Linux, profili AppArmor o SELinux, le sandbox dei browser e delle app mobili, i container).
  - *Address space layout randomisation (ASLR)*: stack, heap, librerie ed eseguibile vengono messi a indirizzi casuali a ogni esecuzione, quindi un exploit non può scrivere gli indirizzi nel codice.
  - *Memoria non eseguibile (NX, DEP, W^X)*: le pagine di dati come stack e heap non si possono eseguire, quindi lo shellcode iniettato non parte; gli attaccanti rispondono riusando codice esistente (return-to-libc, return-oriented programming).
- **Al livello dell'hardware.**
  - *TPM* (Trusted Platform Module): un chip resistente alla manomissione che conserva chiavi, misura ogni fase della catena di avvio (measured boot) e può dimostrare lo stato del software a una parte remota (remote attestation). È alla base della cifratura del disco come BitLocker.
  - *Cripto-processori sicuri ed enclave*: Intel SGX crea delle *enclave* la cui memoria è cifrata e protetta perfino dal sistema operativo; tecnologie simili sono ARM TrustZone, AMD SEV e Intel TDX. Le enclave sono state violate con attacchi a canale laterale (per esempio Foreshadow, 2018), e SGX è stato tolto dai processori Intel per il mercato consumer dall'11ª/12ª generazione, restando su quelli per server.
  - *Tracciamento nella CPU*: supporto hardware per registrare o imporre il flusso di controllo, per esempio Intel Processor Trace (registra i salti eseguiti), Intel CET (uno *shadow stack* contro la sovrascrittura degli indirizzi di ritorno e l'*indirect branch tracking* contro gli attacchi che riusano codice), ARM Pointer Authentication e la Memory Tagging Extension.

## Che cosa vuol dire sicuro? (pagine 15-27)

La pagina 15 è il divisore di sezione "What is Secure? (in the sense of Engineering Secure Software)".

### Slide 16 · Software Security

> What is your favorite software development technology? (Language, tool, library, etc.)
>
> Have you ever written software where security mattered?
>
> - Did you do anything about it then?
>
> How do you know that you have delivered secure software?
>
> - Try to think of examples
> - what are your indicators?
> - How will you convince others that your software is secure?

**Approfondimento.** L'ultima domanda è il problema centrale dell'*assurance* di sicurezza. Indicatori e prove possibili:

- *Prove sul processo*: i requisiti di sicurezza sono stati scritti; esiste un modello delle minacce ed è stato rivisto; revisione del codice e analisi statica girano a ogni modifica; gli sviluppatori sono formati.
- *Prove sul prodotto*: risultati dell'analisi statica senza segnalazioni gravi aperte; campagne di fuzzing (ore di CPU spese, copertura del codice raggiunta, nessun crash aperto); rapporti di penetration test; risultati dei bug bounty; linguaggi memory-safe e irrobustimento del compilatore in uso; dipendenze controllate contro le CVE note.
- *Prove dall'esercizio*: quante vulnerabilità sono state trovate dopo il rilascio, e quanto in fretta sono state corrette.
- *Convincere gli altri*: un **assurance case**, cioè un argomento strutturato ("il sistema è sicuro in modo accettabile perché ..., come mostrano le prove ..."), certificazioni (Common Criteria; FIPS 140-3 per i moduli crittografici), e conformità agli standard (ISO/IEC 27001, OWASP ASVS).

Nessuna di queste cose *dimostra* la sicurezza; insieme danno una fiducia giustificata. Conta anche la prima domanda: ogni linguaggio e ogni framework porta con sé le sue vulnerabilità tipiche e le sue protezioni.

### Slide 17 · Takeaways

> - Security is not black-and-white
> - Security is "until proven insecure"
> - Security "theater"
>   - Feeling safer vs. Being safer
>   - People act on their perception of reality, not necessarily on reality
> - Protection can be costly
>   - E.G. Personal liberty and privacy
> - Eliminating a threat vs. Protection
> - Vulnerability vs. Exploit vs. Threat

**Approfondimento.**

- **Non bianco o nero**: un sistema non è "sicuro" o "insicuro" in assoluto, ma più o meno sicuro *rispetto a un dato modello delle minacce*, a un dato costo, per un dato periodo. La sicurezza è un livello di rischio.
- **"Until proven insecure"**: non si può mai dimostrare che un sistema reale non ha vulnerabilità; si può solo non averne trovata una, finora, mentre una sola vulnerabilità scoperta lo dimostra insicuro. Le affermazioni sulla sicurezza sono quindi provvisorie, come ipotesi scientifiche non ancora falsificate, e i sistemi vanno mantenuti.
- **Security theatre** (termine coniato da Bruce Schneier): misure che fanno *sentire* le persone più al sicuro senza renderle più sicure, per esempio controlli inefficaci ma visibili, regole sulle password che impongono cambi prevedibili ("Password1!" diventa "Password2!"), domande segrete le cui risposte sono sui social. Poiché le persone agiscono in base alla *percezione*, il teatro ha un certo effetto (rassicurazione, deterrenza), ma spreca risorse e crea una fiducia mal riposta.
- **La protezione può costare cara**, e non solo in denaro: anche in libertà e privacy (sorveglianza di massa, conservazione dei dati, controlli d'identità invasivi). Le decisioni di sicurezza comportano compromessi etici.
- **Eliminare una minaccia e proteggersi**: si può agire sulla *fonte* (eliminare la minaccia: arrestare l'attaccante, togliere l'incentivo, smantellare la botnet) o sul *bersaglio* (protezione: patch, irrobustimento, isolamento). Gli sviluppatori raramente eliminano le minacce; proteggono togliendo le vulnerabilità.
- **Vulnerabilità, exploit e minaccia**: la debolezza, il mezzo per abusarne, e l'agente o la classe di attacco (definiti nelle slide 19-20).

### Slide 18 · An Engineer Concern

> How do you know that you have built a system that cannot be broken into?
>
> - What evidence do you look for?
> - How do you know you are done?
> - How do you prioritize security against everything else drawing upon your time?
>
> SE is a zero-sum game
>
> *"If I need to focus more energy on security, what should we take away?"*

**Approfondimento.**

- "Non si può violare" non è raggiungibile in assoluto (slide 17); la domanda ingegneristica è quante prove bastano per il rischio in gioco.
- **Quando si è finito?** La sicurezza non ha un punto d'arrivo naturale, quindi servono criteri di uscita espliciti, legati al rischio: tutte le minacce ad alto rischio del modello mitigate, nessuna segnalazione critica dell'analisi statica, una campagna di fuzzing di una certa durata senza nuovi crash, un penetration test superato.
- **Le priorità**: per rischio (probabilità × impatto, per esempio con i punteggi CVSS), partendo dalla superficie d'attacco esposta all'input non fidato.
- **L'ingegneria del software (SE) come gioco a somma zero**: con budget e scadenza fissi, il tempo speso sulla sicurezza viene tolto a funzionalità, prestazioni o rifinitura; la domanda citata è quella che farà un project manager. Due controargomenti: il lavoro di sicurezza fatto presto costa poco (Lezione 1, slide 43), e molte pratiche di sicurezza (revisione del codice, test, progetti più semplici) alzano anche la qualità generale, quindi sull'intero ciclo di vita il gioco è meno a somma zero che dentro un singolo rilascio.

### Slide 19 · Vulnerability

> Informally, a *bug* with security consequences
>
> A design flaw or poor coding that may allow an attacker to exploit software for a malicious purpose
>
> - Non-software equivalent to "lack of shoe-examining at the airport"
> - E.G. Allowing easily-guessed passwords (poor coding)
> - E.G. Complete lack of passwords when needed (design flaw)
> - McGraw: 50% are coding mistakes, 50% are design flaws
>
> Alternative definition: "an instance of a fault that violates an \[implicit or explicit\] security policy"

**Approfondimento.**

- **L'analogia dell'aeroporto.** Dopo il tentativo dello "shoe bomber" del 2001 gli aeroporti hanno cominciato a controllare le scarpe; *non* esaminare le scarpe è una lacuna nella procedura di controllo che un attaccante può sfruttare. Nel software, allo stesso modo, le vulnerabilità sono controlli mancanti o difettosi.
- **Codice scritto male e difetto di progettazione.** Accettare "123456" come password è un problema di implementazione: manca un controllo sulla robustezza della password. Non avere alcuna autenticazione su una funzione di amministrazione è un problema di progettazione: nessuna singola riga di codice è sbagliata, è sbagliato il progetto. La divisione 50/50 di McGraw è quella che la Lezione 1, slide 38, chiama "equally common".
- **La definizione alternativa** lega le vulnerabilità alla *politica di sicurezza*, che può essere esplicita (requisiti scritti) o implicita (ciò che gli utenti possono ragionevolmente aspettarsi, per esempio che un'app di chat non faccia uscire i messaggi anche se nessun documento lo dice). Riprende la definizione classica di Ivan Krsul (tesi di dottorato, Purdue, 1998): una vulnerabilità è "an instance of an error in the specification, development, or configuration of software such that its execution can violate the security policy".

### Slide 20 · Exploit and Threat

> **Exploit**: a piece of software, a chunk of data, or a sequence of commands that takes advantage of a vulnerability in an effort to cause unintended or unanticipated behavior
>
> I.E. Maliciously using a vulnerability
>
> - Can be manual or automated
> - Viruses are merely automated exploits
> - Many different ways to exploit just one vulnerability
>
> **Threat** - two usages of the word
>
> (A) an actor or agent that is a source of danger, capable of violating confidentiality, availability, or integrity of information assets and security policy
>
> - E.G. Black-hat hackers
>
> (B) A class of exploits
>
> - E.G. Spoofing

**Approfondimento.**

- **Tre forme di exploit**: un *programma* (uno script che si collega a un server e invia una richiesta costruita ad arte), un *pezzo di dati* (un PDF, un'immagine o un file audio malevoli, una stringa troppo lunga), una *sequenza di comandi* (digitati in un'applicazione vulnerabile, per esempio una SQL injection fatta a mano).
- **Manuale o automatico**: un penetration tester che sfrutta a mano una SQL injection, contro un worm o un exploit kit che lo fanno in automatico su milioni di host. "Viruses are merely automated exploits": il malware è l'automazione e l'impacchettamento dello sfruttamento, più un payload.
- **Molti exploit per una vulnerabilità**: un solo stack overflow si può sfruttare iniettando shellcode, con return-to-libc, con la return-oriented programming, o sovrascrivendo un puntatore a funzione o una variabile vicina invece dell'indirizzo di ritorno. Una difesa che blocca una tecnica (per esempio uno stack non eseguibile) lascia la vulnerabilità al suo posto; solo correggere la causa di fondo è una soluzione completa.
- **Minaccia, uso (A)**, l'*agente della minaccia*: *chi* attacca (hacker black-hat, insider, criminali, Stati). Black hat = hacker malevolo; white hat = hacker etico; grey hat = una via di mezzo.
- **Minaccia, uso (B)**, la *categoria della minaccia*: *che tipo* di attacco (spoofing, tampering, divulgazione di informazioni, denial of service: le categorie STRIDE della Lezione 1, slide 56).

### Slide 21 · Exploit/Threat/Vulnerability Protection

> Protect against exploits?
>
> - *Anti-virus, intrusion detection, firewalls, etc.*
>
> Protect against threats?
>
> - *Use* forensics *to find and eliminate policy, incentives, deterrents, etc.*
>
> Protect against vulnerabilities?
>
> - *Engineer secure software!*

**Approfondimento.** Tre livelli di difesa, dal sintomo alla causa di fondo:

- **Contro gli exploit**: riconoscere e bloccare gli schemi di attacco noti (firme degli antivirus, sistemi di rilevamento e prevenzione delle intrusioni, firewall, web application firewall). Queste difese sono *reattive* (conoscono solo gli attacchi già visti), si possono aggirare modificando l'exploit e lasciano la vulnerabilità al suo posto. Utili come livello in più.
- **Contro le minacce**, cioè gli attaccanti: l'analisi forense stabilisce chi ha attaccato e come; poi azioni legali, politiche, la rimozione degli incentivi (per esempio dati rubati resi senza valore da cifratura o tokenizzazione) e i deterrenti (sanzioni, monitoraggio visibile) riducono la minaccia stessa. Per lo più fuori dal controllo dello sviluppatore.
- **Contro le vulnerabilità**: togliere la debolezza di cui ogni exploit ha bisogno. È l'unica difesa che funziona anche contro gli exploit *sconosciuti*, ed è l'argomento di questo corso: costruire software sicuro.

### Slide 22 · Software Security is... NOT a myth

> **NOT** a myth but a reality
>
> Insecure software causes *immeasurable* harm
>
> Sony, NSA, android, browser, and now AI agents… just read the news

**Approfondimento.** Le storie dietro i nomi:

- **Sony**: la violazione della PlayStation Network del 2011 (circa 77 milioni di account esposti, il servizio offline per settimane); nello stesso anno il gruppo LulzSec violò i siti di Sony Pictures con una semplice SQL injection; nel 2014 la rete di Sony Pictures fu cancellata e i suoi dati divulgati, un attacco che gli Stati Uniti attribuirono alla Corea del Nord.
- **NSA**: nel 2016-2017 gli *Shadow Brokers* divulgarono strumenti di attacco della NSA. Uno di questi, l'exploit EternalBlue per una vulnerabilità di SMBv1 di Windows (MS17-010), fu riusato dal worm ransomware **WannaCry** (maggio 2017, circa 200.000 computer in 150 paesi, compresi ospedali britannici) e da **NotPetya** (giugno 2017, circa 10 miliardi di dollari di danni).
- **Android**: **Stagefright** (2015), integer overflow nella libreria multimediale che permettevano l'esecuzione di codice da remoto semplicemente ricevendo un MMS costruito ad arte, con circa 950 milioni di dispositivi colpiti; l'ecosistema frammentato degli aggiornamenti ne lasciò molti senza patch.
- **Browser**: ogni anno diversi zero-day di Chrome, Safari e Firefox vengono sfruttati in the wild, per lo più bug di memory safety nei motori JavaScript (i compilatori JIT) o nei renderer.
- **Agenti di IA**: gli agenti basati su LLM che navigano sul web, leggono la posta e chiamano strumenti possono essere dirottati con la *prompt injection*, cioè istruzioni nascoste in una pagina web o in un documento a cui l'agente poi obbedisce, con esfiltrazione di dati o azioni indesiderate. È il vecchio schema del mescolare dati e comandi, in forma nuova.

### Slide 23 · Software Security is... NOT an arcane black art

> **NOT** an arcane black art
>
> Much of it seems arcane
>
> - Finding a severe vulnerability w/o source code
> - Crafting the exploit
> - Endless clever ways to break software
>
> But, you have much more knowledge than the attackers do
>
> Do not just leave it to the others, take responsibility for knowing security

**Approfondimento.**

- Quello che sembra magia è abilità più metodo: il *reverse engineering* (disassembler e decompilatori come Ghidra o IDA ricostruiscono la logica di un programma senza il sorgente), il *fuzzing* (trovare in automatico gli input che fanno andare in crash) e tecniche di sfruttamento ben documentate; questo corso tratta quelle classiche (stack smashing, format string, injection, race).
- **Il vantaggio di chi difende**: gli sviluppatori hanno il codice sorgente, i documenti di progetto, i requisiti, i test e il modello delle minacce, mentre gli attaccanti di solito hanno solo il binario. Uno sviluppatore che conosce gli schemi di attacco può trovare e correggere i bug a un costo molto più basso di quello che serve a un attaccante per trovarli. Il vantaggio dell'attaccante è l'asimmetria: a lui serve un buco, chi difende deve chiuderli tutti.
- **La responsabilità**: la sicurezza non si può delegare del tutto a un gruppo di sicurezza separato o a un penetration test finale, perché ogni sviluppatore scrive codice che può essere attaccato.

### Slide 24 · Software Security is... NOT a set of features

> **NOT** a set of features
>
> Secure software > security software
>
> Although **tools** and **experts** are helpful
>
> - You cannot just deploy a magical tool and expect all vulnerabilities to disappear
> - You cannot outsource all of your security knowledge
>
> Even if you are using a security library, know *how* to use it properly

**Approfondimento.**

- **Software sicuro e software di sicurezza.** Il *software di sicurezza* sono le funzioni di sicurezza: login, cifratura, controllo degli accessi, un firewall. Il *software sicuro* è il software in cui ogni parte resiste agli attacchi. Aggiungere funzioni di sicurezza non rende sicuro il software: una pagina di login con una SQL injection, o uno strumento di cifratura con un buffer overflow nel parser dei file, sono software di sicurezza non sicuro. La sicurezza è una proprietà dell'intero codice, non un modulo che si aggiunge.
- **Nessuno strumento magico**: analizzatori statici, fuzzer e scanner trovano molti bug, ma non tutti (il teorema di Rice esclude analisi che siano insieme complete e precise), danno falsi allarmi e non sanno nulla dei difetti di progettazione o della logica di business. Gli esperti aiutano, ma qualcuno nel gruppo deve capire le segnalazioni e il sistema.
- **Usare bene le librerie di sicurezza**: la maggior parte dei fallimenti crittografici sono usi sbagliati di librerie corrette: la modalità ECB, chiavi e IV scritti nel codice, un nonce riusato con AES-GCM, MAC confrontati con un confronto non a tempo costante (attacchi di timing), la verifica dei certificati TLS disattivata, password con hash veloci (MD5, SHA-256) invece di bcrypt, scrypt o Argon2.

**Esempio di codice: un'API crittografica usata male e usata bene (Java).**

```java
// Misuse: ECB mode (deterministic, leaks patterns) and a hard-coded key
Cipher c = Cipher.getInstance("AES");            // means "AES/ECB/PKCS5Padding" by default
c.init(Cipher.ENCRYPT_MODE,
       new SecretKeySpec("0123456789abcdef".getBytes(), "AES"));

// Proper use: authenticated encryption (AES-GCM), random key, fresh random nonce
KeyGenerator kg = KeyGenerator.getInstance("AES");
kg.init(256);
SecretKey key = kg.generateKey();                 // kept in a key store, never in the code
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);                 // a new nonce for every message
Cipher c2 = Cipher.getInstance("AES/GCM/NoPadding");
c2.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
byte[] ciphertext = c2.doFinal(plaintext);        // send iv together with the ciphertext
```

In modalità ECB blocchi di testo in chiaro identici danno blocchi cifrati identici (la famosa immagine del "pinguino ECB" resta riconoscibile dopo la cifratura), e una chiave scritta nel codice è leggibile da chiunque abbia il binario. GCM fornisce riservatezza *e* integrità, purché ogni nonce venga usato una sola volta con una data chiave.

### Slide 25 · Software Security is... NOT a problem for just mathematicians

> **NOT** a problem for just mathematicians
>
> Cryptography
>
> - Is important and needed
> - Cannot solve all of your security problems
> - Pick-proof lock vs. Open window
>
> Proofs, access control rules, and verification are helpful, but inherently incomplete

**Approfondimento.**

- **Serratura a prova di scasso e finestra aperta**: una crittografia forte è una serratura imbattibile sulla porta d'ingresso; un buffer overflow nel server è una finestra aperta. Gli attaccanti *aggirano* la crittografia, non la attraversano: Heartbleed leggeva le chiavi direttamente dalla memoria, e il malware legge i messaggi prima che vengano cifrati. Con le parole di Adi Shamir, "cryptography is typically bypassed, not penetrated".
- **Intrinsecamente incompleta**: una dimostrazione vale quanto il suo modello e le sue ipotesi. I sistemi verificati formalmente (il microkernel seL4, il compilatore C CompCert) sono dimostrati corretti rispetto a una specifica, supponendo che l'hardware, il resto della toolchain e la specifica stessa siano giusti; i canali laterali (tempi, consumo di energia, Spectre) stanno fuori dalla maggior parte dei modelli; una specifica può essere sbagliata o incompleta. Le regole di controllo degli accessi possono essere tutte corrette e combinarsi comunque male (per esempio il problema del *confused deputy*). I metodi formali alzano di molto l'assurance ma non sostituiscono l'ingegneria della sicurezza.

### Slide 26 · Software Security is... NOT a problem for just networking and operating systems

> **NOT** a problem for just networking and operating systems
>
> Software had security problems long before we had the internet
>
> If you left a window open in your house, would you try to fix the roads?

**Approfondimento.**

- **Prima di Internet**: i sistemi multiutente in time-sharing degli anni '60 e '70 soffrivano già di bug di escalation dei privilegi (la valutazione di Multics del 1974 di Karger e Schell lo violò in diversi modi); il rapporto Anderson del 1972 descriveva i buffer overflow; negli anni '80 i virus si diffondevano con i floppy (Elk Cloner sull'Apple II nel 1982, Brain sul PC IBM nel 1986).
- **L'analogia delle strade**: la sicurezza di rete (firewall, VPN, TLS) protegge le *strade* che portano alla casa, mentre la vulnerabilità è una *finestra* aperta nell'applicazione. Irrobustire la rete non chiude i buchi dell'applicazione, perché il traffico che l'applicazione deve accettare (richieste web, e-mail, file) porta l'attacco dritto al bug. La correzione va fatta nel software.

### Slide 27 · Software Security is...

> A reality that everyone must face
>
> - Not just developers, all stakeholders
>
> A learnable mindset for software engineers
>
> The ability to prevent *unintended functionality*
>
> - At *all* layers of the stack in *all* parts of your system

**Approfondimento.**

- **Tutti gli stakeholder**: i manager fissano budget e scadenze (slide 18), gli architetti scelgono i progetti, i tester scrivono i test degli abuse case, i gruppi operativi configurano e applicano le patch, gli utenti scelgono le password e cliccano sui link, i dirigenti ne rispondono legalmente (nell'UE la direttiva NIS2 e il Cyber Resilience Act impongono obblighi di sicurezza alle organizzazioni e ai produttori di prodotti con elementi digitali).
- **Una mentalità che si impara**: pensare come un attaccante (Lezione 1, slide 32) è un'abilità che migliora con la pratica: studiare le vulnerabilità del passato, giocare a CTF, rivedere il codice con occhio avversario.
- **Le funzionalità non volute** sono il miglior riassunto in una riga di una vulnerabilità: il software può fare qualcosa che i suoi progettisti non hanno mai voluto (eseguire codice iniettato, rivelare dati, saltare un controllo). Un buffer overflow dà a un programma la "funzione" di eseguire codice dell'attaccante; la SQL injection dà a un modulo di login la "funzione" di entrare senza password. Sicurezza significa togliere le funzionalità non volute a *tutti* i livelli (hardware, sistema operativo, librerie, applicazione, configurazione) e in *tutte* le parti del sistema, comprese quelle che sembrano poco importanti (logging, gestione degli errori, script di build).
