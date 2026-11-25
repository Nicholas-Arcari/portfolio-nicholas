const e=`La Lezione 22 è dedicata all'**aliasing**, l'esistenza di più riferimenti allo stesso oggetto, che i linguaggi safe come Java e C# permettono ancora. L'aliasing è utile (efficienza, oggetti condivisi, callback) ma pericoloso: attraverso un alias, il codice esterno a un oggetto può cambiarne la rappresentazione interna senza passare per i suoi metodi (**representation exposure**), ed è così che il difetto di \`getSigners\` del JDK 1.1.1 permise a un'applet di fingersi firmata da una parte fidata. La lezione presenta due rimedi studiati nella sicurezza basata sul linguaggio: i sistemi di tipi per il **controllo degli alias**, che rendono esplicito quali campi appartengono alla rappresentazione di un oggetto (campi \`rep\`, ownership, universe, confined type), e l'**immutabilità**, con le sottigliezze che comporta: quali campi contano come rappresentazione, perché \`final\` conta in un programma multi-thread, e perché un costruttore non deve lasciar sfuggire \`this\`. Le slide sono 22.

## Il problema dell'aliasing (pagine 1-8)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Aliasing

### Slide 2 · Today

> - The joys of aliasing
> - Alias control
> - Confined Types
>   - one of the proposed scheme for alias control
>   - paper on Confined Types by Vitek & Bokowski to read
> - Immutability
>   - another way to avoid aliasing problems

**Approfondimento.** Il programma della lezione: i problemi causati dall'aliasing ("the joys" è ironico), poi due famiglie di rimedi, il controllo degli alias (di cui i **confined type**, di Jan Vitek e Boris Bokowski, sono un esempio) e l'immutabilità. La lettura consigliata è l'articolo che ha introdotto i confined type (OOPSLA 1999).

### Slide 3 · Reminder of the problem

> Security flaw in JDK1.1.1

\`\`\`java
package java.lang; public class
  Class {
  private Identity[] signers;
  /** Obtain list of signers of given class */
  public Identity[] getSigners() {
    return signers;
 }
\`\`\`

> - Problem : unwanted aliasing

**Analisi del codice.**

- *Che cosa fa.* Ogni classe Java è rappresentata a run time da un oggetto della classe \`java.lang.Class\`. Per una classe caricata da codice firmato, \`signers\` elenca le identità che l'hanno firmata, e la piattaforma usa quell'elenco per decidere quali privilegi riceve il codice. \`getSigners()\` permette a qualunque codice di chiedere chi ha firmato una classe.
- *La vulnerabilità.* \`getSigners\` restituisce **l'array interno stesso**, non una copia. Il campo è \`private\`, ma chi chiama ora ha un riferimento allo stesso array: un alias alla rappresentazione di un oggetto critico per la sicurezza, che può modificare.
- *Exploit.* Un'applet non firmata chiamava \`getSigners()\` sulla propria classe e scriveva nell'array restituito l'identità di un firmatario di cui l'utente si fidava (la piattaforma offriva anche un elenco di tutti i firmatari noti). La piattaforma credeva allora che l'applet fosse stata firmata da quella parte e le dava i suoi privilegi, quindi l'applet evadeva dalla sandbox. Il difetto fu scoperto nell'aprile 1997 dal gruppo Secure Internet Programming della Princeton University, colpiva il JDK 1.1.1 e il browser HotJava (l'unico che supportasse la firma del codice del JDK 1.1), ed è noto come attacco "Magic Coat" (è il "MagicCoat" della Lezione 21, slide 21).
- *Correzione.* Il JDK 1.1.2 fece restituire a \`getSigners\` una **copia** dell'array (\`return signers.clone();\`), così qualunque cosa ne faccia chi chiama, l'elenco interno resta invariato. È la regola "non restituire mai al codice non fidato un riferimento a un oggetto mutabile" (Lezione 21, slide 14).

### Slide 4 · Aliasing

> - Safe languages such as Java and C# do not have pointer arithmetic (eg **&x; x\\*, ...**) but they do have references and allow aliasing
> - aliasing = having more than one reference to the same object

**Approfondimento.** La memory safety elimina l'aritmetica dei puntatori (\`&x\`, \`*x\` in C), quindi nessun riferimento può essere fabbricato e nessuno può puntare fuori da un oggetto (Lezione 19). Non elimina l'**aliasing**: dopo \`b = a;\` le due variabili si riferiscono allo stesso oggetto, e una modifica fatta attraverso \`b\` è visibile attraverso \`a\`. L'aliasing rompe il ragionamento locale: per sapere se un oggetto può cambiare bisogna conoscere ogni riferimento a esso, e i riferimenti possono essere ovunque nel programma.

### Slide 5 · Desirable aliasing

> - Efficiency
>   - in time: e.g. alias to middle of list in list traversal
>   - in space, by sharing object
> - Consistent view to shared objects
> - Useful programming patterns
>   - e.g. callbacks, observer pattern, ...
> - For "objects"/"things" in the informal sense of the word, as opposed to values, using references make sense
>   - e.g. files, windows, USB sticks, ....
>   - e.g. for anything that is hard in functional programming

**Approfondimento.** L'aliasing non è un errore in sé: è il modo in cui i programmi a oggetti condividono di proposito lo stato.

- **Efficienza**: un riferimento a metà di una lista permette di riprendere una visita da lì senza ricominciare (tempo); condividere un oggetto invece di copiarlo risparmia memoria (spazio).
- **Coerenza**: quando più parti di un programma devono vedere lo stesso stato aggiornato (lo stesso conto in banca, la stessa configurazione), devono riferirsi tutte allo stesso oggetto.
- **Pattern**: le callback e il pattern observer funzionano registrando riferimenti a oggetti che verranno chiamati in seguito.
- **Cose con un'identità**: un file, una finestra, un dispositivo sono entità singole nel mondo, ed è naturale che più parti del programma si riferiscano alla stessa, a differenza dei valori come i numeri, che si possono copiare liberamente. La programmazione puramente funzionale, che non ha stato condiviso mutabile, fa fatica a modellare cose del genere.

### Slide 6 · Undesirable aliasing

> - side-effects hard to control and understand
>   - hard to debug
>   - hard to maintain object invariants
>   - hard to ensure consistent access
>     - esp. when *concurrency* can cause race conditions
> - aliases allow to by-pass interface operations
>   - i.e. break encapsulation boundaries
>   - aka representation exposure
>
>   This can cause problems if you have several pieces of code, some of which are more trusted than others, because untrusted code may exploit this

**Approfondimento.** L'altra faccia della medaglia:

- Una modifica fatta attraverso un riferimento è un **effetto collaterale** per tutti gli altri: il codice che tiene \`a\` vede il suo oggetto cambiare senza aver fatto nulla. I bug diventano difficili da trovare, gli **invarianti** di un oggetto (un insieme senza duplicati, un saldo mai negativo) si possono rompere dall'esterno, e con più thread gli accessi attraverso alias diversi diventano **race condition** (Lezione 11, Lezione 19, slide 34-38).
- Un oggetto protegge il proprio stato permettendo modifiche solo attraverso i suoi metodi (la sua interfaccia), che possono controllarle. Un alias a un oggetto interno permette al codice esterno di cambiare lo stato direttamente, aggirando quei controlli: la **representation exposure**.

Per la sicurezza l'ultimo punto è quello cruciale: se codice fidato e non fidato condividono oggetti, il codice non fidato può usare un alias per cambiare lo stato su cui il codice fidato fa affidamento, come nel difetto di \`getSigners\` (slide 3).

### Slide 7 · Representation exposure: spot the problems

\`\`\`java
class IntSet {
   private int[] c; // the elements in the set, without duplicates
IntSet() { c = new int[0]; }
IntSet(int[] a) { c = a; }
int getSize() { return c.length; }
   boolean contains (int i) { ...}
void add(int i) { if (contains(i)) return;
                  newc = new int[c.lenght+1];
                  System.arraycopy(c,0,newc,0,c.length);
                  newc[c.length] = i;
                  c = newc;}
   void remove(int i){...}
int[] getcontents() { return c;}
\`\`\`

**Analisi del codice.**

- *Che cosa fa.* Un insieme di interi conservato in un array privato \`c\`, con l'invariante che \`c\` non contenga duplicati. \`add\` crea un nuovo array più lungo di un elemento, copia i vecchi elementi e aggiunge il nuovo in fondo, a meno che non sia già presente; \`getcontents\` restituisce gli elementi.
- *Le vulnerabilità.* Dall'esterno si possono creare due alias all'array privato \`c\` (slide 8):
  - il costruttore \`IntSet(int[] a)\` conserva l'array di chi chiama, che ne tiene un riferimento e può cambiarne in seguito gli elementi, per esempio scrivendo un duplicato, senza alcun controllo (non controlla nemmeno che l'array iniziale sia privo di duplicati);
  - \`getcontents()\` restituisce l'array interno stesso, quindi chiunque la chiami può cambiare direttamente il contenuto dell'insieme, aggirando \`add\` e \`remove\`.
- *Exploit.* Si supponga che del codice fidato usi un \`IntSet\` come elenco degli identificatori degli utenti autorizzati a eseguire una certa operazione. Il codice non fidato che ha ottenuto l'array, attraverso il costruttore o attraverso \`getcontents\`, vi aggiunge il proprio identificatore, e da quel momento supera il controllo.
- *Correzione.* Copie difensive in entrambe le direzioni: \`c = a.clone()\` (eliminando i duplicati) nel costruttore, \`return c.clone();\` in \`getcontents\`. (Alcune sviste della slide: \`c.lenght\` dovrebbe essere \`c.length\`, e \`newc\` viene usato senza essere dichiarato, quindi così com'è scritto il codice non compila.)

### Slide 8 · Representation exposure

> N.B. two ways to unwanted alias of internal representation:
>
> - exporting a reference
>
>   **\`int[] getcontents() { return c;}\`**
> - importing a reference
>
>   **\`IntSet(int[] a) { c = a; }\`**

**Approfondimento.** I due modi della slide 7 in forma generale. **Esportazione**: un metodo restituisce un riferimento a un oggetto che appartiene alla rappresentazione (il caso di \`getSigners\`). **Importazione**: l'oggetto conserva, come parte della propria rappresentazione, un riferimento che ha ricevuto dall'esterno, e chi l'ha mandato lo ha ancora. Le regole della Lezione 21 (slide 14) corrispondono una a una: non restituire mai un riferimento a un oggetto interno mutabile, e non conservare mai un riferimento a un oggetto mutabile ricevuto da codice non fidato. L'importazione è la più subdola delle due, perché un controllo fatto sull'oggetto ricevuto (l'array è privo di duplicati? il nome del file è permesso?) può essere invalidato in seguito da chi l'ha mandato, un attacco time-of-check-to-time-of-use (Lezione 11).

## Controllo degli alias (pagine 9-13)

### Slide 9 · Alias control

> - Many systems have been - and are being - proposed for alias control (aka ownership, encapsulation, confinement,...)
>   - whole workshops dedicated to this, eg IWACO'2026
> - Many of these require annotations to express the programmer's intent
>   - Especially, things like: in

\`\`\`java
class A {
private B ref;
 ....
}
\`\`\`

> is **ref** allowed to be/meant to be aliased or not?

**Approfondimento.** Il **controllo degli alias** (alias control) è l'area di ricerca dei sistemi di tipi e delle analisi che limitano quali alias possono esistere, sotto diversi nomi (ownership, incapsulamento, confinamento), con un proprio workshop (IWACO, tenuto insieme alla conferenza ECOOP). La difficoltà di fondo è che il codice da solo non dice che cosa intende il programmatore: un \`private B ref\` può essere la rappresentazione privata di \`A\`, a cui nessun altro dovrebbe riferirsi (come l'array di \`IntSet\`), oppure un riferimento a un oggetto indipendente che \`A\` si limita a usare e che altri possono condividere. La stessa dichiarazione copre entrambi i casi, quindi l'intenzione va scritta, come annotazione, prima che uno strumento possa verificarla.

### Slide 10 · Alias control

\`\`\`java
public class BankTransfer{
  private BankAccount from,to;
  private int[] amount;
  private char[] description;
  ...
}
\`\`\`

> Which fields do you think are (not) meant to be aliased?

**Approfondimento.** Una risposta naturale: \`from\` e \`to\` si riferiscono a conti bancari, che esistono indipendentemente dal bonifico e sono condivisi da molti bonifici e dal resto del codice della banca, quindi questi campi sono *pensati* per essere alias. \`amount\` e \`description\` sono i dati propri del bonifico, parte della sua rappresentazione: se un altro oggetto avesse un riferimento agli stessi array, potrebbe cambiare l'importo o la descrizione di un bonifico già controllato e approvato.

### Slide 11 · Alias control

> Several alias control type systems use notion of rep field

\`\`\`java
public class BankTransfer{
  private BankAccount from,to;
  private @rep int[] amount;
  private @rep char[] description;
  ...
}
\`\`\`

> - rep field is owned by the object
> - Important design decision, about the programmer's intention, which should be made explicit
>   - for documentation
>   - for type checking
>
> (Note this decision also affects implementation of .clone and .equals)

**Approfondimento.** L'annotazione \`@rep\` (representation) dichiara che l'oggetto riferito dal campo è **posseduto** dall'oggetto \`BankTransfer\`: fa parte della sua rappresentazione e non deve essere raggiungibile dall'esterno. Scrivere l'intenzione serve due volte: come documentazione per il programmatore successivo, e come informazione per un type checker che può allora rifiutare il codice che lascerebbe sfuggire il campo (slide 12). La stessa distinzione decide come copiare e confrontare gli oggetti: \`clone\` deve copiare i campi \`rep\` (una copia profonda, altrimenti originale e copia condividono la rappresentazione, il problema della copia superficiale della Lezione 21, slide 17) ma non gli altri riferimenti (entrambi i bonifici si riferiscono agli stessi conti), ed \`equals\` confronta il *contenuto* dei campi \`rep\` ma l'*identità* degli oggetti condivisi.

### Slide 12 · Alias control

> Several alias control type systems use notion of rep field

Il codice è quello della slide 11.

> Idea: objects of type **\`@rep int[]\`** and of type **\`int[]\`** are not *assignment compatible*
>
> *Question*: should **\`a.amount\`** and **\`b.amount\`** be assignment compatible for different Banktransfer objects **\`a\`** and **\`b\`**?
>
> *Question*: could this solve the signers problem?

**Approfondimento.** Se un \`@rep int[]\` non si può assegnare a un normale \`int[]\` (o viceversa), un oggetto della rappresentazione non può mai essere conservato in un riferimento ordinario, né restituito come tale: il compilatore rifiuta il codice che creerebbe l'alias.

- *Prima domanda.* No: la rappresentazione di \`a\` appartiene ad \`a\` e quella di \`b\` a \`b\`, quindi \`a.amount = b.amount\` farebbe condividere lo stesso array a due bonifici. I sistemi di tipi con ownership rendono il proprietario parte del tipo (il \`rep\` di \`a\` e il \`rep\` di \`b\` sono tipi diversi), proprio per rifiutare assegnamenti del genere.
- *Seconda domanda.* Sì. Con \`private @rep Identity[] signers;\`, l'istruzione \`return signers;\` in un metodo pubblico che restituisce un normale \`Identity[]\` sarebbe un errore di tipo: il bug della slide 3 sarebbe stato intercettato in compilazione, e il programmatore costretto a restituire una copia.

### Slide 13 · Alias control

> - Many type systems have been - and are still being - proposed for alias control, e.g.
>   - universes by Peter Muller
>     - fine-grained alias control per object
>   - confined types by Jan Vitek and Boris Bokowski
>     - coarser alias control per package
> - Design challenge: defining a system that is
>   - flexible and expressive enough to capture typical programming patterns,
>   - simple enough to be understandable and statically checkable

**Approfondimento.** Due sistemi rappresentativi:

- I **Universe type** (Peter Müller e Arnd Poetzsch-Heffter) organizzano gli oggetti in una gerarchia di proprietari: ogni oggetto ha un proprietario, e un riferimento viene annotato come \`rep\` (verso un oggetto posseduto da \`this\`), \`peer\` (verso un oggetto con lo stesso proprietario di \`this\`) o \`any\`/\`readonly\` (verso un oggetto qualunque, attraverso il quale non è permessa alcuna modifica). I riferimenti che attraversano i confini di un proprietario sono permessi solo in lettura, quindi la rappresentazione di un oggetto si può modificare solo attraverso il suo proprietario. Il controllo è **per oggetto**.
- I **confined type** (Vitek e Bokowski) funzionano **per package**: agli oggetti di una classe dichiarata *confined* può riferirsi solo il codice del loro package, mai dall'esterno. Le regole vietano ogni modo in cui un riferimento potrebbe sfuggire: conservarlo in un campo pubblico, restituirlo da un metodo pubblico, convertirlo in un tipo non confinato, e chiamare su di esso metodi ereditati che potrebbero lasciar sfuggire \`this\` (i metodi devono essere *anonymous*, la nozione che ritorna nella slide 19).

La sfida di progettazione è il solito equilibrio dei sistemi di tipi: un sistema che rifiuta troppo costringe il programmatore a combatterlo, e un sistema troppo complicato non verrà capito né adottato.

## Immutabilità (pagine 14-21)

### Slide 14 · Immutability

> - Another way to prevent aliasing problems:
>   - make objects immutable
>
>   *Why does this prevent aliasing problems?*
> - About 660 (20%) classes in the Java standard library are immutable
>   - Prime example: **\`java.lang.String\`** is immutable.
>
>   NB many (trusted) API methods take/produce strings as arguments/result. *(Why is immutability important then?)*
> - The programming language Scala clearly distinguishes immutable objects and treats them in special ways
>   - encouraging a more functional programming style

**Approfondimento.**

- *Perché previene i problemi.* L'aliasing è pericoloso solo insieme alla **mutazione** (Lezione 19, slide 40-41): se un oggetto non può mai cambiare, non importa quanti riferimenti a esso esistano, perché nessuno di essi si può usare per cambiarlo.
- *Perché conta per le stringhe.* Molti metodi delle API fidate ricevono stringhe rilevanti per la sicurezza: il nome di un file da aprire, un URL, il nome di una classe da caricare, un permesso. Un metodo tipico controlla la stringa e poi la usa. Se \`String\` fosse mutabile, il codice non fidato potrebbe passare una stringa innocua, aspettare che il controllo vada a buon fine e poi cambiarla, così che l'operazione venga eseguita su un valore mai controllato (Lezione 21, slide 4-5). Poiché \`String\` è immutabile (e final, quindi non si può passare al suo posto una sottoclasse mutabile), il valore controllato è il valore usato.
- *Scala* separa i valori immutabili (\`val\`) dalle variabili mutabili (\`var\`) e rende predefinite le collezioni immutabili, il che incoraggia uno stile funzionale. Java si è mosso nella stessa direzione: i record (Java 16) e le collezioni non modificabili di \`List.of\`.

### Slide 15 · Advantages of immutability

> - Immutable objects can be aliased without problems
> - They are immune to race conditions
> - Conceptually simple (they are values)
> - Because immutable objects can be safely shared, this can *improve* efficiency
>   - because sharing objects saves the cost of copying them
> - However, using immutable objects can also *decrease* efficiency
>   - because not being able to change requires the creation of new objects for every change
>   - eg think of using StringBuffer vs String

**Approfondimento.** Un oggetto immutabile si comporta come un valore, per esempio un numero: si può condividere, passare a codice non fidato e usare da molti thread senza copie difensive e senza sincronizzazione, perché non c'è nulla da proteggere. Il prezzo compare quando i valori cambiano spesso: ogni "modifica" crea un nuovo oggetto. Costruire una stringa lunga con concatenazioni ripetute di \`String\` crea una nuova stringa a ogni passo e copia ogni volta tutti i caratteri; lo \`StringBuffer\` mutabile (o lo \`StringBuilder\`) aggiunge sul posto e produce una volta sola la \`String\` immutabile finale.

### Slide 16 · Advantages of immutability

> - Could we use immutability to solve the problem with signers?

\`\`\`java
public class Class {
 private Identity[] signers;
 /** Obtain list of signers of given class */
   public Identity[] getSigners() {
     return signers;
 }
\`\`\`

> We could, if we had immutable arrays...

**Analisi del codice.** Il codice è il \`getSigners\` vulnerabile della slide 3. Restituire l'array interno sarebbe innocuo se l'array non si potesse modificare, ma Java non ha array immutabili: ogni array può essere scritto da chiunque ne abbia un riferimento. Le alternative sono una copia (\`return signers.clone();\`, la correzione effettiva) o un tipo diverso che non si può modificare, come una lista non modificabile (\`List.copyOf(...)\`), che si può condividere liberamente.

### Slide 17 · Advantages of immutability

> Using immutability in the BankTransfer example: instead of

\`\`\`java
public class BankTransfer{
  private BankAccount from,to;
  private int[] amount;
  private char[] description;
\`\`\`

> we would get

\`\`\`java
public class BankTransfer{
  private BankAccount from,to;
  private Integer amount;
              // Integer objects are immutable, so no worries
  private String description;
          // String objects are immutable , so no worries
\`\`\`

**Analisi del codice.** Gli array della slide 10 sono sostituiti da tipi immutabili: un \`Integer\` e una \`String\`. Ora il costruttore può conservare i valori che riceve e i getter possono restituirli senza copiarli: chi ha un riferimento allo stesso \`Integer\` o alla stessa \`String\` non può cambiarli. L'oggetto \`BankTransfer\` stesso però non è ancora immutabile, perché i suoi campi possono ancora essere riassegnati dai suoi stessi metodi (slide successiva).

### Slide 18 · Better still, of course

> Even better

\`\`\`java
public class BankTransfer{
   final private BankAccount from,to;
   final private Integer amount;
                    // Integer objects are immutable
   final private String description;
                   // String objects are immutable
  ...
 }
\`\`\`

> now BankTransfer objects are also immutable
>
> - NB **\`final\`** is easy to forget but crucial for immutability in multi-threaded context; see slides on Language-Based Security!

**Approfondimento.** Con campi \`final\` che si riferiscono a oggetti immutabili, un \`BankTransfer\` non può cambiare dopo la costruzione. Due osservazioni:

- \`from\` e \`to\` si riferiscono ancora a conti bancari mutabili, ma sono riferimenti a oggetti condivisi, non parte della rappresentazione del bonifico (slide 10): il bonifico si riferisce sempre agli stessi conti, ed è tutto ciò che la sua immutabilità promette. Rendere precisa questa distinzione è l'argomento della slide 20.
- Senza \`final\`, un oggetto che non viene mai modificato può comunque sembrare cambiare in un programma multi-thread: un altro thread può vederlo prima che i suoi campi siano stati scritti, con i loro valori predefiniti. Il modello di memoria di Java garantisce che ogni thread veda i valori assegnati ai campi \`final\` nel costruttore, a patto che l'oggetto non sfugga prima della fine del costruttore (Lezione 19, slide 35-37, e slide 21).

### Slide 19 · Immutability

> - Immutability of classes is an important property that deserved to be made explicit in code, and checked
>
> Eg **\`public @Immutable class BankTransfer{ ...}\`**
>
> - Proposal for this
>
> Immutable Objects for a Java-like Language
>
> Christian Haack, Erik Poll, Jan Schäfer, and Aleksy Schubert, ESOP'07 & ECOOP'09
>
> - uses notions of rep fields and anonymity, plus more
> - Used today by many system, e.g. Google ErrorProne

**Approfondimento.** Come per i campi \`rep\`, l'intenzione "gli oggetti di questa classe non cambiano mai" andrebbe scritta nel codice (l'annotazione \`@Immutable\`) e verificata da uno strumento, invece di essere un commento che la modifica successiva può contraddire in silenzio. La proposta citata è un sistema di tipi per l'immutabilità in un linguaggio simile a Java (Haack, Poll, Schäfer e Schubert a ESOP 2007, seguiti da Haack e Poll a ECOOP 2009), che ha bisogno delle due nozioni delle slide successive: i **campi rep**, per sapere quali oggetti appartengono alla rappresentazione, e l'**anonimità**, per assicurarsi che \`this\` non sfugga durante la costruzione. Controlli simili si usano in pratica: Error Prone di Google, un analizzatore statico che gira dentro il compilatore Java, rifiuta una classe annotata \`@Immutable\` i cui campi non sono final o si riferiscono a tipi mutabili.

### Slide 20 · immutability and the need for rep

> - We need to know which fields are rep-fields, ie. part of the object representation, in order to know what immutability means.
> - E.g.

\`\`\`java
public @immutable class A{
  final private @rep int[] a;     // a and contents of a immutable
     ...
     }
\`\`\`

> vs

\`\`\`java
public @immutable class A{
  final private int[] a;          // contents of a can mutate
   ...
}
\`\`\`

**Analisi del codice.** In entrambe le versioni il campo \`a\` è \`final\`, quindi si riferisce sempre allo stesso array. Nella prima l'array è dichiarato parte della rappresentazione (\`@rep\`), quindi l'immutabilità di \`A\` copre anche lui: non possono cambiare né il riferimento né il contenuto (immutabilità **profonda**). Nella seconda l'array è un riferimento ordinario, forse condiviso con altri oggetti, e solo il riferimento è fisso: il contenuto può cambiare (immutabilità **superficiale**). \`final\` da solo dà solo la seconda, ed è per questo che l'immutabilità di una classe non si può definire senza sapere quali campi sono rappresentazione.

### Slide 21 · immutability and the need for anonymous

\`\`\`java
public @immutable? class Integer {
  public static Integer latest; // latest integer object allocated
  private final int i;
  public Integer(int j){ i = j;
                         latest = this;}
  public int getValue(){ return i;)
}
\`\`\`

> Are these integer objects immutable?
>
> - No, not in a multi-threaded context:
>
> Constructor leaks **\`this\`**, hence field **\`i\`** not immutable: **\`Integer(5)\`** may be observed to change from 0 to 5.

**Analisi del codice.**

- *Che cosa fa.* Un involucro (wrapper) di un \`int\` con un campo \`final\` \`i\`, che sembra immutabile. Ma il costruttore conserva anche \`this\` nel campo statico pubblico \`latest\`, così che chiunque possa trovare l'ultimo intero creato.
- *La vulnerabilità.* La garanzia dei campi \`final\` (slide 18) vale solo per gli oggetti pubblicati *dopo* che il loro costruttore è terminato. Qui l'oggetto sfugge *durante* la costruzione: un altro thread può leggere \`latest\` mentre il costruttore di \`Integer(5)\` è ancora in esecuzione, o prima che la sua scrittura di \`i\` sia visibile, vedere \`getValue()\` restituire 0, e più tardi 5. Un oggetto il cui unico campo è \`final\` ha cambiato valore: non è immutabile.
- *Correzione.* Il costruttore deve essere **anonimo** (anonymous): non deve lasciar sfuggire \`this\` (nessun assegnamento di \`this\` a campi di altri oggetti o a campi statici, nessuna chiamata che passi \`this\` ad altro codice). Pubblicare l'oggetto dopo la costruzione (\`Integer x = new Integer(5); latest = x;\`) ripristina la garanzia. (Nella slide \`return i;)\` dovrebbe finire con \`}\`; il punto interrogativo in \`@immutable?\` è la domanda della slide.)

## Riepilogo (pagina 22)

### Slide 22 · Recap

> - Language constructs such as public/private/... enable protection of access to fields, methods, classes
> - but do *not* provide a way to protect integrity of objects in system of interacting objects
> - Confined Types
>   - a particular scheme for alias control, that can provide integrity
>   - all package scoped objects should be confined?
> - Immutability
>   - another way to avoid/reduce aliasing problems
>   - built-in in newer programming languages such as Scala

**Approfondimento.** La lezione in tre punti. I modificatori di visibilità controllano chi può *nominare* un campo o un metodo, ma non chi può *raggiungere* un oggetto: un campo privato non è protetto se è stato consegnato un riferimento al suo oggetto, quindi il controllo degli accessi sui nomi non dà l'integrità degli oggetti. Il **controllo degli alias** (qui i confined type) limita dove possono andare i riferimenti, e si chiede se ogni classe con visibilità di package non debba essere confinata per default. L'**immutabilità** elimina il pericolo invece degli alias: gli oggetti che non possono cambiare si possono condividere liberamente. Entrambi trasformano in regole verificabili le linee guida della Lezione 21 (niente campi pubblici, copie difensive, \`final\`), che altrimenti dipendono dalla disciplina del programmatore.
`;export{e as default};
