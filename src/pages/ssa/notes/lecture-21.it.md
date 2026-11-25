La Lezione 21 passa da ciò che la piattaforma Java garantisce da sola (memory safety, tipizzazione forte, modificatori di visibilità, sandboxing; Lezione 19) a ciò che il programmatore deve comunque fare. Anche su una piattaforma corretta, una singola classe Java può essere attaccata da altro codice che gira nella stessa macchina virtuale, per questo è stato proposto un insieme di **linee guida per la programmazione sicura** (le dodici regole di McGraw e Felten, l'HOWTO di Wheeler). La lezione le passa in rassegna, ciascuna con l'attacco che previene: niente campi public o protected e nessuna fiducia nella protezione di package, visibilità più restrittiva possibile (e perché la reflection è una scappatoia), classi e membri `final`, nessuno scambio di oggetti mutabili con codice non fidato (aliasing), niente inner class, niente clonazione, niente serializzazione. Si chiude con i limiti delle linee guida e con la ricerca su sistemi di tipi più ricchi, sviluppata nella lezione successiva (l'aliasing). Le slide sono 21.

## Perché servono linee guida di programmazione (pagine 1-6)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Java Programming Rules

### Slide 2 · Java security guarantees

> - The Java platform offers security features
>   - memory safety
>   - strong typing
>   - visibility restrictions (public, private,…)
>   - sandboxing based on stackwalking
> - This allows security guarantees to be made
>   - even if part of the code is untrusted - or simply buggy.
> - Of course, the same goes for Microsoft .NET/C#

**Approfondimento.** Le quattro caratteristiche sono i meccanismi di sicurezza basati sul linguaggio della Lezione 19, visti come piattaforma:

- **Memory safety** e **tipizzazione forte**: niente buffer overflow, niente aritmetica dei puntatori, niente type confusion (Lezione 19, slide 17-30), garantite dal compilatore, dal verificatore del bytecode quando una classe viene caricata, e dai controlli a run time.
- **Restrizioni di visibilità**: `private`, package, `protected` e `public` decidono quale codice può usare un campo, un metodo o una classe. Poiché la piattaforma le impone, non sono solo una questione di buono stile: sono ciò che permette a una classe di proteggere il proprio stato da altro codice.
- **Sandboxing basato sullo stack walking** (stack inspection): il codice porta con sé dei permessi in base alla sua origine, e prima di un'operazione sensibile (aprire un file, aprire una connessione) il security manager percorre lo stack delle chiamate e controlla che *ogni* chiamante abbia il permesso richiesto, così il codice non fidato non può ottenere l'operazione chiamando codice fidato (Lezione 1).

Insieme permettono a codice con livelli di fiducia diversi di girare nella stessa macchina virtuale, lo scenario delle applet Java e dei plug-in: un bug, o un componente ostile, non può rompere la piattaforma o gli altri componenti. Lo stesso modello è stato adottato da Microsoft .NET (C#, con la sua Code Access Security). Entrambe le sandbox sono state poi abbandonate: .NET Core non supporta più la Code Access Security, e in Java il security manager è stato deprecato in Java 17 e disattivato definitivamente in Java 24, quindi il codice che gira in una macchina virtuale Java oggi è fidato nel suo insieme. Le linee guida di questa lezione restano rilevanti per ogni classe che deve proteggere il proprio stato da altro codice, come mostrano le slide successive.

### Slide 3 · Programming guidelines

> *Even if*
>
> - type system is sound
> - VM & type checker are correct
> - sandboxing is sound & implemented correctly
>   - ie no exploitable bugs in platform API classes like **`java.lang.Class, java.lang.SecurityManager`**
> - policy file is correct
>
> a particular Java class may still be vulnerable to attacks by untrusted code
>
> Programming guidelines have been proposed to prevent known vulnerabilities

**Approfondimento.** L'elenco è la trusted computing base del modello di sicurezza di Java: il sistema di tipi deve essere corretto, la macchina virtuale e il verificatore del bytecode non devono avere bug (Lezione 19, slide 26), la sandbox deve essere progettata e implementata correttamente, comprese le classi della piattaforma che la realizzano (`java.lang.Class`, `java.lang.SecurityManager`), e il **policy file**, che dice quali permessi riceve ciascun pezzo di codice, deve essere giusto. Anche se tutto questo vale, la piattaforma impone solo ciò che dice il *codice della classe*. Una classe che lascia un campo pubblico, o che consegna un riferimento al suo array interno, ha aperto una porta che la piattaforma non chiuderà. Le linee guida di programmazione sono raccolte a partire dagli attacchi noti, per evitare che si ripetano gli stessi errori.

### Slide 4-5 · Spot the defect

```java
public class String {
public char[] contents; public int offset, len;
    // idea: String is contents[offset ... offset+len]
   String() {contents=null; offset=0; len=0;}
   String(char[] a) {
        contents = a; offset = 0; len = a.len; }
   String substring(int take) {
     if (take<=0) throw new NegativeSizeException();
     String s = new String();
     s.content=this.content;
     s.offset=0; s.len=Math.min(take,s.len);
     return s;
}
int getLength() { return len; }
```

> **class should be** *final* **to prevent malicious subclasses**
>
> fields should *not* be *public* to prevent unauthorised changes, ie. preserve integrity
>
> fields should be *final* (for thread-safety, see next slide)
>
> array should be cloned to prevent *representation exposure which allows unauthorised changes*

**Analisi del codice.** La slide 4 mostra solo il codice; la slide 5 lo mostra di nuovo con quattro fumetti. Il primo indica `public class String`, il secondo `public char[] contents` e `public int offset, len`, il terzo gli stessi campi, il quarto `contents = a` nel costruttore.

- *Che cosa fa.* Una classe di stringhe fatta in casa: i caratteri sono conservati in un array `contents`, e la stringa è la parte dell'array che comincia a `offset` ed è lunga `len` caratteri. Il costruttore `String(char[] a)` crea una stringa da un array, `substring(take)` restituisce una stringa con i primi `take` caratteri, che condivide lo stesso array.
- *Le vulnerabilità* (i quattro fumetti):
  - **La classe non è `final`.** Chiunque può scrivere una sottoclasse, ridefinirne i metodi (per esempio `getLength`, o aggiungere un metodo che cambia i caratteri) e passare un'istanza della sottoclasse ovunque sia attesa una `String`. Il codice che si fida che una `String` si comporti come tale sta allora parlando con il codice dell'attaccante.
  - **I campi sono `public`.** Qualunque codice può scrivere direttamente `contents`, `offset` e `len`: l'integrità di ogni stringa è nelle mani di ogni altra classe.
  - **I campi non sono `final`.** In un programma multi-thread, un altro thread può vedere un oggetto di questa classe prima che il suo costruttore sia terminato, con i campi ancora ai valori predefiniti: una stringa potrebbe sembrare cambiare. Il modello di memoria di Java dà garanzie di visibilità solo ai campi `final` (Lezione 19, slide 35-37, e Lezione 22, slide 21).
  - **L'array non viene clonato.** Il costruttore conserva proprio l'array che riceve, `contents = a`. Chi chiama ne tiene ancora un riferimento e può cambiare in seguito i caratteri della "stringa". È la **representation exposure** (esposizione della rappresentazione): la rappresentazione interna dell'oggetto è condivisa con codice esterno a esso (Lezione 22, slide 7-8).
- *Exploit.* Si supponga che del codice fidato riceva il nome di un file come `String`, controlli che sia un file innocuo e poi lo apra. Il codice non fidato passa una stringa costruita su un array che tiene per sé, aspetta che il controllo vada a buon fine, cambia l'array (o semplicemente il campo pubblico `contents`) in "/etc/passwd", e il codice fidato apre un file che non è mai stato controllato. È un attacco time-of-check-to-time-of-use (Lezione 11), ed è il motivo per cui la vera `java.lang.String` è `final`, ha campi private final e copia gli array che riceve.
- *Correzione.* `public final class String`, campi `private final`, `contents = a.clone()` nel costruttore, e nessun metodo che restituisca o esponga l'array interno.
- *Altre sviste* (non problemi di sicurezza): `a.len` dovrebbe essere `a.length`, `s.content` e `this.content` dovrebbero essere `contents` (così com'è scritto, il codice non compila), Java non ha una `NegativeSizeException` (l'eccezione standard è `NegativeArraySizeException`), `Math.min(take,s.len)` usa la lunghezza della nuova stringa, vuota (0), invece di `this.len`, quindi ogni sottostringa è vuota, e alla classe manca la graffa di chiusura. Il terzo fumetto rimanda a una "next slide" sulla thread safety che non è in queste slide; l'argomento è nella Lezione 19.

### Slide 6 · Java security programming guidelines

> Sources
>
> - Twelve rules by McGraw & Felten
> - Java secure programming HOWTO by Wheeler
> - ....
>
> NB the context of these rules: only really relevant for
>
> - applications that are - or may some day be - extended with less trusted or untrusted code
> - API components that are by definition extended with less trusted code

**Approfondimento.** Le due fonti classiche: le "Twelve rules for developing more secure Java code" di Gary McGraw ed Edward Felten (1998, anche nel loro libro *Securing Java*), e la sezione su Java del *Secure Programming HOWTO* di David Wheeler. I loro successori attuali sono le *Secure Coding Guidelines for Java SE* di Oracle e il *CERT Oracle Secure Coding Standard for Java*.

L'ambito conta. Le regole difendono una classe dall'**altro codice nella stessa macchina virtuale**: sono essenziali per un'applicazione che carica codice di cui non si fida del tutto (plug-in, estensioni, le applet del passato) e per le **librerie e le API**, che per definizione vengono chiamate da codice che i loro autori non conoscono. In un'applicazione chiusa il cui codice è tutto fidato sono buona ingegneria più che sicurezza, ma il codice tende a essere riusato in contesti che i suoi autori non avevano previsto ("or may some day be").

## Visibilità: campi, package e reflection (pagine 7-13)

### Slide 7 · Java security programming guidelines

> - Do not use public fields

**Approfondimento.** Un campo pubblico può essere letto e scritto da qualunque codice, senza passare per un metodo della classe. La classe non può più controllare i valori (un saldo negativo, un riferimento `null`), mantenere i suoi invarianti, o accorgersi che il campo è cambiato. L'accesso attraverso i metodi è ciò che rende possibili validazione e incapsulamento. L'eccezione di solito accettata sono le costanti `public static final` di un tipo immutabile; un array `public static final` non è una costante, perché i suoi elementi si possono ancora cambiare.

### Slide 8 · Java security programming guidelines

> - Do not use *protected* fields
> - *Why?* Protected fields can be accessed in
>   1. subclasses
>   2. in the package
>
>   Anyone can (1) create subclasses or (2) extend the package
> - We can rule out 1 by making a class final
> - We can rule out 2 by making a package *sealed*
>   - introduced in Java 1.4 to prevent package being extended; java.lang was already sealed by default...

**Approfondimento.** In Java `protected` è *più* permissivo di quanto sembri: un membro protected è visibile alle sottoclassi **e** a ogni classe dello stesso package. Entrambe le porte sono aperte a un attaccante:

- **Sottoclassi**: chiunque può estendere una classe non final e leggerne o scriverne i campi protected. Rendere la classe `final` chiude questa porta (slide 13).
- **Il package**: l'appartenenza a un package è solo una dichiarazione, `package com.bank;`, in cima a un file sorgente. Nulla impedisce al codice non fidato di dichiararsi parte dello stesso package e ottenere l'accesso di package. Un package **sealed** (sigillato) chiude questa porta: quando un file JAR dichiara sigillato un package (con l'attributo `Sealed: true` nel suo manifest), tutte le classi di quel package devono venire da quel JAR. I package `java.*` sono protetti in modo ancora più forte, perché il class loader si rifiuta di definire classi al loro interno.

### Slide 9 · Java security programming guidelines

> Hence:
>
> - Do not rely on package protection for security
> - in particular: make all fields private
> - NB this conflicts another standard Java coding guideline, namely
>   - do not make fields private, make them protected instead
>
>   This guideline is motivated by desire for extensibility, not security

**Approfondimento.** Poiché l'accesso di package lo può ottenere chiunque riesca ad aggiungere una classe al package, e l'accesso protected chiunque possa estendere la classe, `private` è l'unica visibilità che protegge un campo. Il consiglio opposto, "rendere i campi protected perché le sottoclassi possano riusarli", viene dalla progettazione a oggetti, dove l'obiettivo è l'estensibilità: è un buon esempio della tensione fra funzionalità e sicurezza (slide 19). Quando le sottoclassi hanno davvero bisogno dello stato, si possono dare loro dei *metodi* protected o public, che possono controllare che cosa se ne fa.

### Slide 10 · Java security programming guidelines

> - Limit access to classes, methods, and fields
>   - make them **private**, unless... there is a need for them to be more visible
> - cf principle of least privilege
> - A compiler only complains if visibility is too restrictive, not if it is too liberal. The JAMIT tool checks if visibility can be made more restrictive.

**Approfondimento.** La visibilità applicata al **principio del privilegio minimo** (Lezione 10, slide 15-19): ogni classe, metodo e campo riceve la visibilità più piccola che permette al programma di funzionare, così la superficie d'attacco è la più piccola possibile (Lezione 10, slide 28). Il compilatore è asimmetrico: rifiuta un programma che usa qualcosa che non può vedere, ma non avverte mai che qualcosa è visibile senza bisogno, quindi la visibilità eccessiva passa inosservata. JAMIT (Java Access Modifier Inference Tool, di Christian Grothoff) analizza le classi compilate e propone, per ogni classe, metodo e campo, il modificatore più restrittivo compatibile con il codice che lo usa.

### Slide 11 · Potential visibility loophole: reflection

> Reflection
>
> = ability of a program to inspect & modify itself

```java
Class cl = o.getClass(); // o's class
Field[] fs = cl.getDeclaredFields(); //
for (Field f : fs){
  if !(Modifier.isPublic()(f.getModifiers())
           { f.setAccessible(true);}
  print("Field " + f.getName()); println(" has value " + f.get(o));
}
```

> There is also a method to set fields, **`f.set(o,val)`**

**Analisi del codice.**

- *Che cosa fa.* Prende la classe di un oggetto `o`, ottiene l'elenco di *tutti* i suoi campi dichiarati (`getDeclaredFields` restituisce anche quelli privati), rende accessibile ogni campo non pubblico con `setAccessible(true)`, che spegne il controllo di accesso del linguaggio, e stampa nome e valore di ogni campo, compresi quelli privati. Con `f.set(o, val)` lo stesso codice potrebbe anche *cambiarli*. (La condizione è scritta in modo approssimativo: in Java si scrive `if (!Modifier.isPublic(f.getModifiers()))`. Nella slide la stringa `" has value "` è spezzata su due righe.)
- *La vulnerabilità.* I modificatori di visibilità vengono controllati dal compilatore e dalla macchina virtuale, ma la reflection è un'API che può aggirarli a run time: `private` ferma il codice ordinario, non il codice che usa la reflection. Una classe che custodisce un segreto (una chiave, una password) o che si basa su un invariante in un campo privato è esposta a qualunque codice possa chiamare `setAccessible`.
- *Correzione.* Si veda la slide 12: la piattaforma deve rifiutare `setAccessible` al codice non fidato.

### Slide 12 · Potential visibility loophole: reflection

> - Reflection allows access to fields that are normally *not* visible
> - The default security manager prevents this, and will throw an **`AccessControlException`**
>   - unless **`java.lang.reflect.ReflectPermission`** is granted

**Approfondimento.** Nel modello a sandbox, `setAccessible(true)` chiede al security manager il permesso `ReflectPermission("suppressAccessChecks")`, che il codice non fidato non ha, quindi la chiamata fallisce con una `AccessControlException` e la visibilità resta una protezione reale. Due sviluppi hanno cambiato il quadro:

- poiché il security manager è disattivato (slide 2), qualunque codice dell'applicazione può usare la reflection sulle classi dell'applicazione stessa: dentro una macchina virtuale, `private` non è più un confine di sicurezza;
- da Java 9 il sistema dei moduli ha aggiunto lo **strong encapsulation** (incapsulamento forte): un modulo decide quali dei suoi package sono aperti alla reflection, e da Java 17 alle parti interne del JDK stesso non si può più accedere con la reflection, a meno che l'applicazione non venga avviata con un'opzione esplicita (`--add-opens`).

La lezione generale è quella già incontrata con Solidity (Lezione 18, slide 23): i modificatori di visibilità organizzano chi può *usare* un dato, non lo rendono segreto.

### Slide 13 · Java security programming guidelines

> - Make classes, methods, fields **final**, unless... there is a need for them to be subclassed/overridden/modified
> - *Why?*
> - cf principle of least privilege

**Approfondimento.** `final` ha tre significati, tutti utili per la sicurezza:

- Una **classe final** non si può estendere, quindi nessuno può passare una sottoclasse con un comportamento diverso dove è attesa la classe (il primo fumetto della slide 5). `java.lang.String` è final per questo motivo; un controesempio noto è `java.math.BigInteger`, che non è final, quindi un valore ricevuto come `BigInteger` potrebbe in realtà essere una sottoclasse mutabile scritta da un attaccante.
- Un **metodo final** non si può ridefinire, quindi i controlli che esegue non si possono sostituire.
- Un **campo final** non si può riassegnare dopo la costruzione, ed è visibile in modo sicuro a tutti i thread (Lezione 19, slide 35-37).

La regola predefinita "final a meno che non ci sia un motivo per non esserlo" è ancora il privilegio minimo: una sottoclasse è un utente privilegiato di una classe, perché ne può cambiare il comportamento, e quel privilegio va concesso solo quando serve.

## Oggetti mutabili, inner class, clonazione e serializzazione (pagine 14-18)

### Slide 14 · Java security programming guidelines

> - Never return (a reference to) a mutable object (incl. arrays) to untrusted code
> - Never store a reference to a mutable object (incl. arrays) obtained from untrusted code
> - *Why?*

**Approfondimento.** Entrambe le regole impediscono l'**aliasing** fra lo stato interno di un oggetto e il codice esterno a esso (Lezione 22):

- **Restituire** un riferimento a un oggetto interno mutabile dà a chi chiama il potere di modificarlo. È il difetto di `getSigners` del JDK 1.1.1 (Lezione 22, slide 3), in cui un metodo restituiva l'array interno dei firmatari di una classe e un'applet poteva scriverci dentro, risultando firmata da una parte fidata.
- **Conservare** un riferimento ricevuto da chi chiama lascia a quest'ultimo la possibilità di cambiarlo in seguito: l'oggetto valida un valore, e chi chiama lo modifica una volta finita la validazione (time of check to time of use, Lezione 11). È il costruttore `contents = a` della slide 5.

Il rimedio è la **copia difensiva**: copiare ciò che si riceve *prima* di validarlo e copiare ciò che si restituisce (`array.clone()`, `List.copyOf`, o una vista non modificabile). Gli oggetti immutabili non hanno bisogno di alcuna copia (Lezione 22, slide 14-21).

### Slide 15 · Java security programming guidelines

> - Don't use inner classes.
> - *Why? Byte code - and byte code verifier - don't know about inner classes; in byte code:*
>   - *inner class becomes package visible normal class*
>   - *private field of outer class may become package visible*

**Approfondimento.** Le inner class esistono solo nel linguaggio Java, non nel bytecode che la macchina virtuale esegue. Il compilatore trasforma una inner class in una normale classe di primo livello (chiamata `Outer$Inner`), con visibilità di package anche se era stata dichiarata `private`. Poiché la inner class può usare i membri privati della classe esterna, ma nel bytecode ora sono due classi diverse, il compilatore aggiunge alla classe esterna dei metodi *sintetici* nascosti con visibilità di package, che leggono o scrivono quei membri privati per conto della inner class. Qualunque classe dello stesso package può chiamarli, quindi un campo privato è in pratica visibile a livello di package, e la protezione di package è debole (slide 8). Da Java 11 la macchina virtuale sa quali classi appartengono allo stesso *nest* (una classe esterna e le sue inner class) e permette loro di accedere direttamente ai membri privati l'una dell'altra, quindi gli accessor sintetici non vengono più generati.

### Slide 16 · Example inner class

```java
public class Outer{
  private int x = 5;
  private class Inner {
    int helper(){ return x; }
  }
  public int getX(){
    Inner i = new Inner();
    return i.helper();
  }

  public static void main(String[] args) {
    Outer o = new Outer();
    System.out.println(o.getX());
  }
}
```

**Analisi del codice.**

- *Che cosa fa.* `Outer` ha un campo privato `x = 5` e una inner class privata `Inner`, il cui metodo `helper` legge `x`. `getX` crea un `Inner` e restituisce `helper()`; `main` stampa 5.
- *La vulnerabilità.* Nel sorgente, `x` e `Inner` sono entrambi privati. Nel bytecode prodotto dai compilatori precedenti a Java 11, `Inner` diventa la classe `Outer$Inner` visibile a livello di package, e `helper` non può leggere `x` direttamente (per la macchina virtuale appartiene a un'altra classe); così il compilatore aggiunge a `Outer` un metodo statico con un nome come `access$000(Outer)`, con visibilità di package, che restituisce `o.x`.
- *Exploit.* Una classe messa da un attaccante nello stesso package (slide 8) può chiamare `Outer.access$000(o)` e leggere il campo privato di qualunque oggetto `Outer`; dove la inner class scrive anche campi della classe esterna, l'accessor generato permette all'attaccante di cambiarli.
- *Correzione.* Evitare le inner class nelle classi che devono proteggere il proprio stato, sigillare il package (slide 8), o compilare per Java 11 o successivo, dove le classi dello stesso nest accedono ai membri privati senza accessor.

### Slide 17 · Example inner class

> - Make classes non-cloneable

**Approfondimento.** (Il titolo ripete quello della slide precedente; la regola riguarda la clonazione.) `clone()` crea una copia di un oggetto **senza eseguire un costruttore**, quindi i controlli che un costruttore esegue vengono saltati, e la copia predefinita è **superficiale** (shallow): la copia condivide con l'originale ogni oggetto riferito dai suoi campi, il che è di nuovo aliasing (Lezione 2, slide 5). Se una classe non è final, un attaccante può estenderla, implementare `Cloneable` e clonare oggetti che la classe non intendeva mai duplicare (per esempio una capability o un token di sessione). La regola di McGraw e Felten è rendere una classe esplicitamente non clonabile con il metodo `public final Object clone() throws CloneNotSupportedException { throw new CloneNotSupportedException(); }`: essendo `final`, non può essere ridefinito da una sottoclasse per permettere di nuovo la clonazione.

### Slide 18 · Java security programming guidelines

> - Make classes non-deserialiseable.
> - Make classes non-serialiseable.
> - I.e. don't implement
>
>   **`void writeObject(java.io.ObjectOutputStream)`**
>
>   **`void readObject(java.io.ObjectOutputStream)`**
> - *Why?*

**Approfondimento.** La serializzazione di Java trasforma un oggetto in un flusso di byte, e la deserializzazione ritrasforma i byte in oggetti. Entrambe aggirano le protezioni del linguaggio:

- **Serializzare** scrive *tutti* i campi di un oggetto, compresi quelli privati (a meno che non siano `transient`): i byte rivelano lo stato interno, il che è un problema di riservatezza.
- **Deserializzare** crea oggetti a partire da byte **senza chiamarne i costruttori**, quindi i byte, che possono venire da un attaccante, possono descrivere un oggetto con qualunque valore dei campi, anche valori che i costruttori rifiuterebbero. Peggio ancora, durante la deserializzazione la macchina virtuale esegue i metodi `readObject` delle classi coinvolte: concatenando metodi di comuni classi di libreria (le "gadget chain", trovate nel 2015 in Apache Commons Collections e in molte altre librerie), un attaccante che controlla i byte può far eseguire all'applicazione codice arbitrario. La deserializzazione insicura era nella OWASP Top 10 del 2017.

Per rendere una classe non serializzabile, non implementare `Serializable`; se una superclasse lo fa già, definire `writeObject` e `readObject` in modo che lancino una `NotSerializableException`. (Nella slide la seconda firma ha una svista: `readObject` prende un `java.io.ObjectInputStream`.) Da Java 9 i filtri di deserializzazione possono limitare quali classi può contenere un flusso.

## Osservazioni generali (pagine 19-21)

### Slide 19 · Java security programming guidelines

> General observations
>
> - Flexibility & extensibility provided by OO is nice for programming, but nasty for security
>   - usual tension between functionality & security
> - These issues are not at all obvious, and typical programmers won't know these things, unless they have actively looked for information
>   - see principle: use your community resources,
>
>     eg google for language/setting specific security guidelines

**Approfondimento.** Quasi ogni regola di questa lezione toglie una caratteristica della programmazione a oggetti: l'ereditarietà (`final`), la condivisione degli oggetti (copie difensive), le inner class, la clonazione, la serializzazione. Quelle caratteristiche esistono per rendere flessibili i programmi, e la flessibilità per il programmatore è anche flessibilità per l'attaccante: la solita tensione fra funzionalità e sicurezza. Poiché nessuno di questi problemi è ovvio, un programmatore che non li ha cercati non li conoscerà; da qui il principio "use your community resources" (Lezione 10, slide 45-46): per ogni linguaggio e piattaforma, cercare le linee guida di sicurezza che altri hanno già scritto.

### Slide 20 · More programming guidelines

> - There are more programming guidelines, that are not directly motivated by security.
> - Specific APIs may come with their own programming guidelines, possibly security-related
> - Guidelines are very useful as checklists, but do not be tempted into thinking they are complete and give absolute guarantees.

**Approfondimento.** Le linee guida sono una checklist per scrivere e rivedere il codice (Lezione 15, code review), e molte si possono controllare con strumenti: gli analizzatori statici segnalano campi pubblici, visibilità non necessaria, campi statici mutabili, o la restituzione di array interni. Ma una checklist registra gli attacchi *già noti*: seguirla esclude quelli, non il prossimo. Come per gli strumenti (Lezione 6), un risultato pulito non è una prova di sicurezza.

### Slide 21 · More language-based security

> Ongoing work for
>
> - Richer type systems, eg
>   - alias protection to prevent MagicCoat,
>     - more on alias protection later
>   - **non\_null** references
>   - **Immutable** objects
> - Tainting / information flow
>   - eg taint mode in perl
> - Program verification
>   - more on this later

**Approfondimento.** Le linee guida si affidano alla disciplina del programmatore; la ricerca sulla sicurezza basata sul linguaggio cerca di trasformarle in proprietà che un compilatore o uno strumento possono verificare:

- **Protezione dagli alias**: sistemi di tipi che impediscono ai riferimenti allo stato interno di un oggetto di uscire da esso (Lezione 22). "Magic Coat" è il nome dato all'attacco di `getSigners` del JDK 1.1.1 (Lezione 22, slide 3), che la protezione dagli alias avrebbe rifiutato in compilazione.
- **Riferimenti non nulli**: tipi che distinguono i riferimenti che possono essere `null` da quelli che non possono esserlo, così che le dereferenziazioni di puntatori nulli siano escluse dal type checking (Lezione 19, slide 31; oggi in Kotlin, e in Java attraverso checker basati su annotazioni).
- **Oggetti immutabili**: tipi che garantiscono che un oggetto non possa cambiare dopo la costruzione (Lezione 22, slide 14-21).
- **Tainting e flusso dell'informazione** (Lezione 20), come la taint mode di Perl.
- **Verifica dei programmi**: dimostrare che un programma soddisfa una specifica formale, per esempio con annotazioni nel Java Modeling Language (JML) controllate da uno strumento di verifica.
