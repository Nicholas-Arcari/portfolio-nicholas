const e=`Il secondo gruppo di slide della Lezione 19 rende precisa la nozione di **type safety**. Parte dai tipi nel C: che cos'è un tipo, perché i compilatori hanno bisogno dei tipi, quali programmi "cattivi" i tipi possono rifiutare, e perché il C, pur essendo tipizzato, non è type-safe (il buffer overflow con \`scanf\` e i cast non sicuri), con la distinzione fra linguaggi non tipizzati, debolmente tipizzati e fortemente tipizzati. Poi definisce un piccolo linguaggio fortemente tipizzato, **Mini-C**, e gli dà una **semantica operazionale** formale (regole di riduzione per espressioni e comandi, in cui le operazioni non sicure semplicemente non hanno alcuna regola) e un **sistema di tipi** (regole di tipizzazione per espressioni, comandi e memorie), con una derivazione di tipo completa per il programma del fattoriale. Le slide si chiudono con il **teorema di type safety** (un programma ben tipizzato in una memoria ben tipizzata non si blocca mai) e con altre proprietà che sistemi di tipi più ricchi possono imporre. Le slide sono 36.

## Tipi e type safety nel C (pagine 1-15)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Language-Based Security - Overview of types

### Slide 2 · Language-based Security

> - Objective
>   - Design security into the language
>   - Compiler rules out insecure programs
>   - Compiler does not run the program (no testing)
> - What is insecure?
>   - Buffer overflows
>   - Information-flow leaks
>   - Violations of access rights
>   - …
> - One approach is based on *types*

**Approfondimento.** La sicurezza basata sul linguaggio sposta la protezione dal sistema in esecuzione al **linguaggio e al suo compilatore**: se il linguaggio è progettato in modo che i programmi insicuri non si possano scrivere, o vengano rifiutati in compilazione, allora non servono test né monitoraggio a run time per escluderli. Poiché il compilatore non esegue il programma, la garanzia copre *tutte* le esecuzioni, non solo quelle testate. Ognuna delle insicurezze dell'elenco ha una risposta basata sui tipi: i buffer overflow sono esclusi dai linguaggi memory-safe e type-safe (queste slide e la Lezione 19), le fughe di informazione dai tipi di sicurezza (Lezione 20), le violazioni dei diritti di accesso dai sistemi di tipi che includono l'autorizzazione (slide 36). Queste slide sono la controparte formale delle slide 22-30 della prima parte della Lezione 19 (tipi, type safety e come sapere se un sistema di tipi è corretto).

### Slide 3 · TYPES: Overview

> A *type* is a *specification* of data or code in a program
>
> Examples from C:
>
> - Basic types
>   - \`int, char, float, double, void\`
>   - \`int x;\` --- variable x will store an integer
> - Function types
>   - \`int -> double, …\`
>   - \`int factorial(int);\` --- factorial is a function that takes an integer as an argument and returns an integer (type \`int -> int\`)

**Approfondimento.** Un tipo è una **specifica**: dice che genere di valori può contenere una variabile, o che cosa un pezzo di codice si aspetta e restituisce, e il compilatore controlla che ogni uso sia coerente con essa. Per le funzioni il tipo si scrive \`argument -> result\`: \`factorial\` ha tipo \`int -> int\`, quindi \`factorial(3)\` è un \`int\` e \`factorial("abc")\` è un errore di tipo. \`int -> double\` è il tipo di qualunque funzione dagli interi ai double. (Il C non usa la notazione a freccia nella sua sintassi; la freccia è la notazione standard della teoria dei tipi, usata in linguaggi come ML e Haskell.)

### Slide 4 · TYPES: Overview

> - Structures types
>   - \`struct pair {int x; int y;};\`
> - Array types
>   - \`int[n], char[n][m], ...\`
>   - \`int arr[8];\` --- variable \`arr\` stores sequence of 8 integers
> - Pointer types
>   - \`int*, int**, ...\`
>   - \`int* p;\` --- variable p stores the address of a variable that stores an integer
>   - \`int** p;\` --- variable p stores the address of a variable that stores the address of a variable that stores an integer

**Approfondimento.** I tipi composti si costruiscono da quelli più semplici: le **strutture** raggruppano campi di tipi diversi, gli **array** sono sequenze di un numero fisso di elementi dello stesso tipo, i **puntatori** contengono indirizzi di valori di un certo tipo (e i puntatori a puntatori contengono indirizzi di puntatori). Si noti che la lunghezza di un array fa parte del suo tipo (\`int[8]\`), ma il C la dimentica molto facilmente: un array passato a una funzione diventa un puntatore al suo primo elemento, e la sua lunghezza va persa. È esattamente il problema dell'esempio con \`scanf\` delle slide 10-11.

### Slide 5 · Type-correct program

\`\`\`c
int readint();                      // readint: void -> int
void writeint(int);                 // writeint: int -> void
int factorial(int n){               // factorial: int -> int
  int f = 1;                        // f: int
  int c = 1;                        // c: int
  while (c <= n) {                  // c <= n: boolean
  f = f * c;                        // *: (int,int) -> int
  c++;                              // ++: int -> int
  }
  return f;                         //f: int
}
void main() {                       // main: void -> void
  int v;                            // v: int
  v = readint();                    // readint(): int
  writeint(factorial(v));           // factorial(v): int
}
\`\`\`

**Analisi del codice.** Nella slide il codice è a sinistra e le annotazioni di tipo, allineate a ogni riga, a destra (il commento \`//f: int\` sta fra la graffa che chiude il ciclo e \`return f;\`).

- *Che cosa fa.* \`main\` legge un intero \`v\`, calcola \`factorial(v)\` con un ciclo che moltiplica \`f\` per \`c\` per \`c\` da 1 a \`n\`, e scrive il risultato.
- *I tipi.* Ogni elemento del programma ha un tipo, e i commenti li rendono espliciti: le funzioni (\`readint: void -> int\`, \`writeint: int -> void\`, \`factorial: int -> int\`, \`main: void -> void\`), le variabili (\`f\`, \`c\`, \`v\`: \`int\`), la condizione (\`c <= n\` è un booleano; il C stesso la rappresenta come un \`int\`, 0 o 1), perfino gli operatori, che sono anch'essi funzioni (\`*\` prende due interi e restituisce un intero, \`++\` prende un intero e ne restituisce uno).
- *Perché è corretto rispetto ai tipi.* Ogni uso è coerente con la specifica: \`readint()\` restituisce un \`int\` che viene assegnato a una variabile \`int\`, \`factorial\` riceve un \`int\` e il suo risultato viene passato a \`writeint\`, che si aspetta un \`int\`.

### Slide 6 · Type-correct program

\`\`\`c
int readint();                      // readint: void -> int
void writeint(int);                 // writeint: int -> void
int factorial(int n){               // factorial: int -> int
  int f = 1;  int c = 1;            // f: int
                                    // c: int
  while (c <= n) {                  // c <= n: boolean
  f = f * c;                        // *: (int,int) -> int
  c++;                              // ++: int -> int
  }
  return f;                         //f: int
}
void main() {                       // main: void -> void
  string s;                         // s: string
  s = readint();                    // readint(): int -- error
  writeint(factorial(s));           // factorial(s): -- no type
}
\`\`\`

**Analisi del codice.** Lo stesso programma, con \`main\` modificato; il codice cambiato (\`string s;\`, \`s = readint();\` e \`factorial(s)\`) è in rosso nella slide, e le parole "**error**" e "**no type**" nei commenti sono in grassetto.

- *Che cosa è cambiato.* \`v\` ora è una variabile \`s\` di tipo \`string\` (il C non ha un tipo \`string\` predefinito; l'esempio è pseudo-C, come in C++ o in Java).
- *Gli errori di tipo.* \`s = readint()\` assegna un \`int\` a una variabile \`string\`: i tipi dei due lati non coincidono, un errore. \`factorial(s)\` passa una \`string\` dove \`factorial\` si aspetta un \`int\`, quindi l'espressione non ha **alcun tipo**, e nemmeno \`writeint(factorial(s))\`.
- *Il punto.* Il compilatore trova entrambi gli errori guardando i tipi, senza eseguire il programma, e lo rifiuta. Se venisse compilato lo stesso, i bit di un intero verrebbero trattati come una stringa (o viceversa), e il comportamento sarebbe imprevedibile.

### Slide 7 · Why types? Compilation

> Types are *necessary* to compile source code
>
> - What is the binary representation of variables?
>   - \`int x;\` --- \`x\` is 4 bytes
>   - \`char x;\` --- \`x\` is 1 byte
>   - \`int arr[8];\` --- \`arr\` is 32 bytes
> - How to compute in assembly?
>   - \`int x; int y; x + y\` → \`add r1,r2\`
>   - \`float x; float y; x + y\` → \`fadd r1,r2\`
>   - Difference is based on types

**Approfondimento.** Il primo motivo, pratico, per avere i tipi: il compilatore ne ha bisogno per generare il codice. Deve sapere quanta memoria occupa ogni variabile (un \`int\` occupa 4 byte sulle piattaforme comuni, anche se lo standard del C richiede solo almeno 16 bit; un array di 8 \`int\` occupa 8 × 4 = 32 byte) e quali istruzioni macchina usare: lo stesso \`+\` diventa un'addizione intera (\`add\`) per gli \`int\` e un'addizione in virgola mobile (\`fadd\`, eseguita da un'unità diversa, su una diversa rappresentazione in bit) per i \`float\`. Senza i tipi, lo stesso sorgente non determinerebbe il codice macchina.

### Slide 8 · Why types? Reject "bad" programs

> Type checking: A compiler can *ensure that data and code are used only as specified by types* without running the program
>
> Types can be used to reject at compile time programs that:
>
> - Use strings as integers
> - Use integers as pointers
> - Cause null-pointer exceptions
> - Cause array overflows
> - Leak secret information

**Approfondimento.** Il secondo motivo, quello che conta per la sicurezza: il **type checking** garantisce staticamente che dati e codice vengano usati solo come specificano i loro tipi. Le prime due voci sono ciò che fanno i sistemi di tipi ordinari (la slide 6 ne era un esempio). Le altre richiedono tipi più ricchi: le **eccezioni da puntatore nullo** vengono impedite da tipi che distinguono i riferimenti che possono essere nulli da quelli che non possono esserlo (i puntatori never-NULL di Cyclone, \`Option\` in Rust, i tipi nullable in Kotlin); gli **overflow degli array** da tipi che portano con sé la lunghezza (tipi dipendenti, come in DML, slide 36); le **fughe di informazioni segrete** dai tipi di sicurezza (il sistema di tipi per il flusso dell'informazione della Lezione 20).

### Slide 9 · Type safety definitions

> - A *program* is called *safe* if it is not stuck and has not crashed
> - A *language* is called *type-safe* if well-typed programs always remain safe
> - Presence of types does not imply type-safety
>   - e.g., C has types but is not type-safe

**Approfondimento.** Le definizioni chiave. Un programma è **bloccato** (stuck) quando si trova in uno stato in cui il linguaggio non dice che cosa succede dopo (sommare un booleano a un numero, leggere fuori da un array): su una macchina vera l'hardware fa comunque *qualcosa*, e quel "qualcosa" è un comportamento indefinito, il terreno su cui vivono gli exploit. Un linguaggio è **type-safe** se il type checker è una garanzia: ogni programma che accetta non può mai raggiungere uno stato del genere. Lo slogan di Milner (1978) è "well-typed programs cannot go wrong". Il C ha i tipi, ma accetta programmi che vanno storti (slide successive), quindi i suoi tipi non danno questa garanzia. Le slide 16-34 rendono formali queste definizioni per un piccolo linguaggio.

### Slide 10 · Buffer overflow with scanf in C

\`\`\`c
void readstring(char str[])
{
 scanf("%s",str);


}
void main()
{
 char buf[8];
 readstring(buf);
…
}
\`\`\`

> This program is well-typed, but can crash with input longer than 7 bytes
>
> *C is not type-safe*

### Slide 11 · Buffer overflow with scanf in C - What is wrong?

\`\`\`c
void readstring(char str[])
{
 scanf("%s",str);


}
void main()
{
 char buf[8];
 readstring(buf);
…
}
\`\`\`

> Unbounded length of the array (type \`char[]\`)
>
> Buf has length 8 (type \`char[8]\`)
>
> \`char[] != char[8]\`
>
> This program should be rejected! However, C allows unsafe *type-casting* and accepts the program

**Analisi del codice.** Il codice delle due slide è identico; nella slide 11 il fumetto "Unbounded length of the array (type \`char[]\`)" indica il parametro \`char str[]\`, e il fumetto "Buf has length 8 (type \`char[8]\`)" indica la dichiarazione \`char buf[8];\`.

- *Che cosa fa.* \`readstring\` legge una parola dallo standard input nell'array che riceve; \`main\` le passa un buffer di 8 byte sullo stack.
- *La vulnerabilità.* \`scanf("%s", str)\` copia caratteri fino a uno spazio bianco, senza limite. \`buf\` contiene 7 caratteri più il terminatore \`'\\0'\`, quindi un input più lungo di 7 caratteri scrive oltre la fine di \`buf\`: un buffer overflow sullo stack (Lezione 3). Il type checker non lo vede perché il parametro \`char str[]\` ha tipo "array di \`char\` di lunghezza sconosciuta" (in realtà un puntatore \`char *\`), e il C converte in silenzio \`buf\`, di tipo \`char[8]\`, in quel tipo: la lunghezza 8, che faceva parte del tipo, va persa nella conversione.
- *Exploit.* I byte dopo \`buf\` comprendono il frame pointer salvato e l'indirizzo di ritorno di \`main\`; un input lungo li sovrascrive, quindi al ritorno il programma salta a un indirizzo scelto dall'attaccante (il classico stack smashing, Lezione 3).
- *Correzione.* Limitare la lettura alla dimensione del buffer, \`scanf("%7s", str)\`, o meglio passare esplicitamente la dimensione e usare \`fgets(str, size, stdin)\`. Al livello del linguaggio, la correzione è un sistema di tipi in cui \`char[8]\` non si può usare come un \`char[]\` senza limite: è ciò che fa un linguaggio type-safe (gli array di Java portano con sé la loro lunghezza e ogni accesso viene controllato; Cyclone usa puntatori "fat" che portano con sé i limiti).

### Slide 12 · Unsafe type-casting in C

> **Type-casting**: convert the type of a variable to another
>
> - The C compiler will convert types (e.g., from \`char[8]\` to \`char[]\`)
> - Some conversions violate type specifications
> - This makes C type-unsafe

**Approfondimento.** Un **cast di tipo** converte un valore da un tipo a un altro, in modo implicito (lo fa il compilatore, come per \`char[8]\` in \`char[]\` nella slide 11) o esplicito con la sintassi \`(T) x\`. Alcuni cast convertono il *valore* (un \`int\` in un \`float\`, un numero con lo stesso significato in una rappresentazione diversa); altri si limitano a *reinterpretare i bit*, dicendo al compilatore di trattare una posizione di memoria come qualcosa che non è (un \`char *\` come un \`int *\`, un intero come un puntatore). Le reinterpretazioni violano le specifiche dei tipi, e un linguaggio che le permette non può essere type-safe.

### Slide 13 · Safe and Unsafe type cast in C

> | Type-cast | Safe in C? |
> | --- | --- |
> | \`char* x; int* y = (int*) x\` | No |
> | \`int* x; void* y = (void*) x\` | Yes |
> | \`void* x; int* y = (int*) x\` | No |
> | \`int x; char* y = (char*) x\` | No |
> | \`char* x; int y = (int) x\` | Yes |
> | \`int x; float y = (float) x\` | Yes |
> | \`float x; int y = (int) x\` | Yes |

**Approfondimento.** Riga per riga:

- Da \`char*\` a \`int*\`: **unsafe**. \`x\` può puntare a un solo carattere (o a un indirizzo non allineato per un \`int\`); attraverso \`y\` il programma legge o scrive lì 4 byte, fuori dall'oggetto.
- Da \`int*\` a \`void*\`: **safe**. \`void*\` è il tipo dei puntatori generici: si limita a "dimenticare" il tipo e non si può dereferenziare senza un ulteriore cast.
- Da \`void*\` a \`int*\`: **unsafe**. Nulla controlla che la memoria contenga davvero un \`int\`; è il cast che trasforma qualunque puntatore in qualunque altro (passando per \`void*\`).
- Da \`int\` a \`char*\`: **unsafe**. Un numero arbitrario diventa un indirizzo, gli "interi usati come puntatori" della slide 8: il programma può allora leggere o scrivere ovunque.
- Da \`char*\` a \`int\`: considerato **safe**, perché si limita a leggere l'indirizzo come numero e non dà accesso alla memoria (sulle piattaforme a 64 bit un puntatore non sta in un \`int\`, quindi il valore viene troncato, e i compilatori danno un avviso).
- Da \`int\` a \`float\` e da \`float\` a \`int\`: **safe** nel senso della type safety, perché sono conversioni di valore: il risultato è un valore legale del nuovo tipo (si può perdere precisione; un \`float\` troppo grande per un \`int\` è, in C, un comportamento indefinito).

### Slide 14 · Absent, weak and strong typing

> **Untyped languages do not have types**
>
> - e.g., Bash, Perl, Ruby, …
> - Usually interpreted; difficult to compile without types
> - Program safety is programmer's responsibility: programs difficult to debug
>
> **Weakly typed languages use types only for compilation; no type-safety**
>
> - e.g., C, C++, etc.
> - Often allow unsafe casts, e.g., \`char[8]\` to \`char[]\` and int to \`char*\`
> - Program safety is programmer's responsibility: buffer overflows and segmentation faults are common in programs
>
> **Strongly typed languages use types for compilation and guarantee type-safety**
>
> - e.g., BASIC, Pascal, Cyclone, Haskell, SML, Java, etc.
> - No unsafe casts, e.g., an integer cannot be cast to a pointer, an array of length 8 is not an unbounded array, etc.
> - Safety is guaranteed but believed unsuitable for some low-level programs (debatable)

**Approfondimento.** La terminologia "tipizzazione debole/forte" è informale e usata in modi diversi da autori diversi; la nozione precisa è la type safety (slide 9). Due osservazioni sulla classificazione della slide:

- Perl e Ruby si descrivono meglio come **tipizzati dinamicamente**: non hanno tipi nel codice sorgente, ma i loro valori portano un tipo a run time e le operazioni lo controllano, quindi un programma Ruby non può usare un intero come puntatore (solleva invece un errore). Bash è più vicino ai linguaggi non tipizzati, perché tutto è una stringa.
- "Believed unsuitable for some low-level programs" si riferisce a sistemi operativi, driver e codice embedded, scritti tradizionalmente in C perché hanno bisogno di un controllo diretto sulla memoria. La parentesi "(debatable)" oggi è ben fondata: Rust è un linguaggio di sistema type-safe (fuori dai blocchi \`unsafe\`) usato nei kernel di Linux e di Windows, e Cyclone fu un precedente tentativo di ricerca di un C sicuro.

### Slide 15 · Summary of types

> - Types are specifications of data and code
> - Compiler may check well-typedness without executing the program
> - Existence of type specifications may imply program safety (type-safety)
> - Not all languages with types are type-safe
>   - e.g., C is not type-safe
>
> Now we take a simple type-safe language and understand type-safety more formally

**Approfondimento.** La prima metà delle slide in quattro punti. "May imply" è la formulazione importante: i tipi implicano la safety solo se il sistema di tipi è **corretto** (sound), e la correttezza è qualcosa da dimostrare. Il resto delle slide mostra come, su un linguaggio abbastanza piccolo da farlo per intero.

## Mini-C e la sua semantica (pagine 16-25)

### Slide 16 · Mini-C: A strongly typed language

> \`\`\`text
> Types          T  ::=  int | bool
> Variables      x, y
> Declarations   Δ  ::=  x₁ : T₁; … ; xₙ : Tₙ
> Integers       n  ::=  … | -1 | 0 | 1 | …
> Expressions    e  ::=  x | true | false | n | e₁ + e₂ | e₁ * e₂ | e₁ <= e₂ | e₁ == e₂
> Commands       c  ::=  noop | x = e | c₁; c₂ | if e then c₁ else c₂ | while e do c
> Programs       P  ::=  decl Δ begin c end
> Values         v  ::=  true | false | n
> Stores         σ  ::=  x₁ ↦ v₁, … , xₙ ↦ vₙ
> \`\`\`
>
> No functions · No structures · No pointers · No casts

**Approfondimento.** La sintassi di Mini-C, in notazione BNF (\`::=\` "è definito come", \`|\` "oppure"):

- Due **tipi**, \`int\` e \`bool\`. Le **dichiarazioni** Δ assegnano un tipo a ogni variabile.
- Le **espressioni** sono variabili, le costanti booleane, costanti intere, e quattro operatori: \`+\` e \`*\` sugli interi, i confronti \`<=\` e \`==\`.
- I **comandi**: \`noop\` (non fare nulla, è anche il comando "terminato"), assegnamento, sequenza, \`if\` e \`while\`.
- Un **programma** è un elenco di dichiarazioni seguito da un comando.
- I **valori** sono i risultati delle espressioni: booleani e interi. Uno **store** σ (la memoria) associa le variabili ai valori.

Il linguaggio lascia fuori di proposito funzioni, strutture, puntatori e cast: le caratteristiche che rendono unsafe il C (e che renderebbero lunghe le dimostrazioni). Gli interi sono interi matematici, quindi non c'è overflow, e non c'è divisione, quindi nemmeno divisione per zero: l'unico modo per un programma Mini-C di "andare storto" è usare un valore del tipo sbagliato, che è esattamente ciò che il sistema di tipi escluderà.

### Slide 17 · Mini-C Factorial program

\`\`\`text
decl
     f : int; c : int; m : int
begin
     m = 10;   // Compute 10!
     f = 1;
     c = 1;
     while c <= m do
          f = f * c;
          c = c + 1

     // Output f here
end
\`\`\`

**Analisi del codice.** Nella slide una graffa indica la riga delle dichiarazioni come "Δ (Declarations)", una seconda graffa indica il corpo da \`begin\` a \`end\` come "c (Commands)", e dei cerchi rossi attorno a \`c <= m\`, \`f * c;\` e \`c + 1\` rimandano a un fumetto "e (Expressions)".

- *Che cosa fa.* Calcola 10! = 3.628.800: \`f\` accumula il prodotto, \`c\` va da 1 a \`m\` = 10. Mini-C non ha input/output, quindi l'output è solo un commento.
- *La struttura.* Il programma ha la forma \`decl Δ begin c end\` della slide 16: Δ è \`f : int; c : int; m : int\`, il comando è una sequenza di tre assegnamenti e di un \`while\`, la cui guardia \`c <= m\` e i cui lati destri \`f * c\` e \`c + 1\` sono espressioni. Il corpo del ciclo, \`f = f * c; c = c + 1\`, è una sequenza di due comandi (il \`;\` è l'operatore di sequenza, non un terminatore).

### Slide 18 · Type safety through semantics

> - Semantics define safe program computation
> - Unsafe programs are those that cannot compute
> - Type-safety: A correctly typed program is never stuck
> - Game-plan:
>   - Describe semantics for Mini-C
>   - Describe typing for Mini-C
>   - Prove that typing => Not stuck (*Type-safety*)

**Approfondimento.** L'approccio (il metodo "sintattico" di Wright e Felleisen, 1994): prima si definisce la **semantica operazionale**, un insieme di regole che dicono come viene eseguito ogni costrutto, un passo alla volta. Le regole coprono solo i casi *sensati*; uno stato che non è terminato e a cui non si applica alcuna regola è **bloccato**, e bloccato significa unsafe per definizione. Poi si definisce il **sistema di tipi**, e infine si dimostra che un programma ben tipizzato non può mai raggiungere uno stato bloccato. Le slide 19-25 danno la semantica, le slide 26-31 la tipizzazione, le slide 32-34 il teorema.

### Slide 19 · Semantic of expressions

> \`\`\`text
> Expressions   e  ::=  x | true | false | n | e₁ + e₂ | e₁ * e₂ | e₁ <= e₂ | e₁ == e₂
>
> Values        v  ::=  true | false | n
> \`\`\`
>
> - Expressions compute by evaluation to values
> - Formalized by a reduction relation:
>
> \`\`\`text
> σ ⊳ e ↪ e′
>
> Stores        σ  ::=  x₁ ↦ v₁, … , xₙ ↦ vₙ
> \`\`\`

**Approfondimento.** Il giudizio *σ ⊳ e ↪ e′* si legge "nello store σ, l'espressione *e* si riduce in un passo a *e′*". La valutazione è una sequenza di passi del genere, che termina quando l'espressione è diventata un valore. È una semantica **small-step**: ogni regola descrive un passo elementare, quindi si può parlare dello stato raggiunto dopo un numero qualunque di passi, che è ciò di cui ha bisogno la definizione di "bloccato".

### Slide 20 · Semantic of expressions

> - To evaluate a variable, read its value from memory
>
> \`\`\`text
> (x ↦ v) ∈ σ
> ───────────
>  σ ⊳ x ↪ v
> \`\`\`
>
> - To evaluate *(e₁ + e₂)*, first evaluate *e₁*, then evaluate *e₂*, and then **add** them
>
> \`\`\`text
>      σ ⊳ e₁ ↪ e₁′               σ ⊳ e₂ ↪ e₂′             add(n₁, n₂) = n
> ───────────────────────    ───────────────────────    ─────────────────
> σ ⊳ e₁ + e₂ ↪ e₁′ + e₂     σ ⊳ v₁ + e₂ ↪ v₁ + e₂′      σ ⊳ n₁ + n₂ ↪ n
> \`\`\`

**Approfondimento.** Come si legge una regola: se valgono le **premesse** sopra la linea, vale la **conclusione** sotto.

- **Variabile**: una variabile si riduce al valore che ha nello store.
- **Addizione**, tre regole. La prima riduce l'operando sinistro, un passo alla volta, finché non è un valore. La seconda si applica solo quando l'operando sinistro è già un valore *v₁*, e riduce l'operando destro: insieme, le due regole fissano l'ordine di valutazione, da sinistra a destra. La terza si applica quando entrambi gli operandi sono numeri e li sostituisce con la loro somma (\`add\` è l'addizione matematica).

Per esempio, con σ = x ↦ 3: *σ ⊳ x + (1 + 1) ↪ 3 + (1 + 1) ↪ 3 + 2 ↪ 5*.

### Slide 21 · Semantic of expressions

> - Similar rules for other expressions
>
> **Important:** No rules to evaluate unsafe expressions like (true * 7)
>
> \`\`\`text
>      σ ⊳ e₁ ↪ e₁′                 σ ⊳ e₂ ↪ e₂′               mult(n₁, n₂) = n
> ───────────────────────      ───────────────────────      ─────────────────
> σ ⊳ e₁ * e₂ ↪ e₁′ * e₂       σ ⊳ v₁ * e₂ ↪ v₁ * e₂′        σ ⊳ n₁ * n₂ ↪ n
>
>       σ ⊳ e₁ ↪ e₁′                  σ ⊳ e₂ ↪ e₂′               leq(n₁, n₂) = b
> ─────────────────────────    ─────────────────────────    ──────────────────
> σ ⊳ e₁ <= e₂ ↪ e₁′ <= e₂     σ ⊳ v₁ <= e₂ ↪ v₁ <= e₂′      σ ⊳ n₁ <= n₂ ↪ b
>
>       σ ⊳ e₁ ↪ e₁′                  σ ⊳ e₂ ↪ e₂′               eq(n₁, n₂) = b
> ─────────────────────────    ─────────────────────────    ──────────────────
> σ ⊳ e₁ == e₂ ↪ e₁′ == e₂     σ ⊳ v₁ == e₂ ↪ v₁ == e₂′      σ ⊳ n₁ == n₂ ↪ b
> \`\`\`

**Approfondimento.** Lo stesso schema a tre regole per \`*\`, \`<=\` e \`==\`: \`mult\` è la moltiplicazione, \`leq\` ed \`eq\` confrontano due numeri e producono un booleano *b*. L'osservazione segnata come **important** è il cuore del metodo: l'ultima regola di ogni riga richiede due *numeri* *n₁*, *n₂*, quindi un'espressione come \`true * 7\` non corrisponde ad alcuna regola. Non "va in crash" e non "fa qualcosa di indefinito": semplicemente non può proseguire, è **bloccata**. Si noti che \`==\` è definito solo sui numeri, quindi anche \`true == true\` è bloccata; di conseguenza la regola di tipizzazione per \`==\` richiederà operandi interi (slide 28).

### Slide 22 · Semantic of commands

> \`\`\`text
> Commands   c  ::=  noop | x = e | c₁; c₂ | if e then c₁ else c₂ | while e do c
> \`\`\`
>
> - Commands compute to noop, but change memory
> - Formalized by a reduction relation
>
> \`\`\`text
> σ; c ⟶ σ′; c′
> \`\`\`
>
> - Starting from memory *σ*, command *c* reduces to command *c′* and updates memory to *σ′*

**Approfondimento.** Per i comandi lo stato è una coppia (store, comando). Un comando viene eseguito per il suo effetto sulla memoria, quindi la sua riduzione cambia entrambi: un passo di *c* in σ porta al comando rimanente *c′* nello store aggiornato σ′. L'esecuzione termina quando il comando rimanente è \`noop\`.

### Slide 23 · Semantic of commands

> - To evaluate *(x = e)*, first evaluate expression *e* to a value *v*. Then update memory by putting the value *v* in *x*
>
> \`\`\`text
>        σ ⊳ e ↪* v
> ──────────────────────────────
> σ; (x = e) ⟶ σ[x ↦ v]; noop
> \`\`\`
>
> - To evaluate *(c₁ ; c₂)*, first evaluate *c₁*, then evaluate *c₂*
>
> \`\`\`text
>      σ; c₁ ⟶ σ′; c₁′
> ───────────────────────────      ───────────────────────
> σ; (c₁; c₂) ⟶ σ′; (c₁′; c₂)      σ; (noop; c₂) ⟶ σ; c₂
> \`\`\`

**Approfondimento.**

- **Assegnamento**: *↪\\** significa "zero o più passi", quindi la premessa dice che *e* si valuta completamente in un valore *v*; l'assegnamento diventa allora \`noop\` e lo store diventa *σ[x ↦ v]*, "σ in cui ora *x* è associata a *v*".
- **Sequenza**: finché il primo comando non è terminato, se ne esegue un passo dentro la sequenza; quando è diventato \`noop\`, la seconda regola (che non ha premesse) lo scarta e continua con *c₂*.

### Slide 24 · Semantic of commands

> - Similar rules for other commands
>
> \`\`\`text
>           σ ⊳ e ↪* true                            σ ⊳ e ↪* false
> ─────────────────────────────────────    ─────────────────────────────────────
> σ; (if e then c₁ else c₂) ⟶ σ; c₁        σ; (if e then c₁ else c₂) ⟶ σ; c₂
>
>                σ ⊳ e ↪* true                             σ ⊳ e ↪* false
> ───────────────────────────────────────────    ──────────────────────────────
> σ; (while e do c) ⟶ σ; (c; (while e do c))     σ; (while e do c) ⟶ σ; noop
> \`\`\`
>
> **Important:** No rules to evaluate unsafe expressions like *(if 7 then c else c′)*

**Approfondimento.** Il comando **if** valuta la sua guardia e prosegue con uno dei due rami. Il comando **while** è definito per srotolamento: se la guardia è vera, diventa "il corpo, poi di nuovo lo stesso ciclo"; se è falsa, diventa \`noop\`. Anche qui la guardia deve valutarsi in \`true\` o \`false\`: una guardia che è un numero, come in \`if 7 then c else c′\`, non corrisponde ad alcuna regola ed è bloccata. (In C \`if (7)\` è legale, perché qualunque intero diverso da zero conta come vero: Mini-C tiene separati \`bool\` e \`int\`.)

### Slide 25 · Summary of semantics

> - Semantics are rules for evaluating programs safely
> - Programs that cannot evaluate are unsafe by definition
> - Two types of reductions, for expressions and commands
>
> \`\`\`text
> σ ⊳ e ↪ e′          σ; c ⟶ σ′; c′
> \`\`\`

**Approfondimento.** La semantica trasforma "safe" in una nozione precisa, matematica: un programma è unsafe esattamente quando può raggiungere uno stato che non è né terminato né riducibile. Per Mini-C gli unici stati del genere sono quelli in cui un operatore, una guardia o la lettura di una variabile ricevono qualcosa del genere sbagliato (un booleano dove serve un numero, un numero dove serve un booleano, una variabile assente dallo store).

## Regole di tipizzazione (pagine 26-31)

### Slide 26 · Type checking

> \`\`\`text
> Declarations   Δ  ::=  x₁ : T₁; … ; xₙ : Tₙ
> \`\`\`
>
> - Typing for expressions
>
> \`\`\`text
> Δ ⊢ e : T
> \`\`\`
>
> - Typing for commands
>
> \`\`\`text
> Δ ⊢ c
> \`\`\`
>
> Important: A compiler can check efficiently whether a program is well typed or not

**Approfondimento.** Due giudizi di tipizzazione: *Δ ⊢ e : T* dice che, con le dichiarazioni Δ, l'espressione *e* ha tipo *T*; *Δ ⊢ c* dice che il comando *c* è ben tipizzato (i comandi non hanno un tipo, sono solo ben tipizzati oppure no). Il type checking è **efficiente** perché le regole sono **guidate dalla sintassi**: c'è esattamente una regola per ogni costrutto, quindi il checker visita il programma una volta, in un tempo proporzionale alla sua dimensione. È questa la differenza cruciale rispetto alla proprietà che garantisce: se un programma possa bloccarsi è in generale indecidibile (il teorema di Rice, lo stesso limite delle analisi di programmi della Lezione 7), mentre se sia ben tipizzato lo decide un algoritmo semplice e veloce, al prezzo di rifiutare alcuni programmi che non si bloccherebbero mai.

### Slide 27 · Typing for expressions

> - To type check a variable, find its declaration
>
> \`\`\`text
> (x : T) ∈ Δ
> ───────────
>  Δ ⊢ x : T
> \`\`\`
>
> - Both true and false have type bool
>
> \`\`\`text
> ────────────────     ─────────────────
> Δ ⊢ true : bool      Δ ⊢ false : bool
> \`\`\`
>
> - A number has type int
>
> \`\`\`text
> ───────────
> Δ ⊢ n : int
> \`\`\`

**Approfondimento.** Una variabile ha il tipo con cui è dichiarata; le costanti hanno i loro tipi ovvi. Le regole per le costanti non hanno premesse (una riga vuota sopra la linea): sono **assiomi**, veri senza condizioni.

### Slide 28 · Typing for expressions

> - *(e₁ + e₂)* has type int if both *e₁* and *e₂* have type int
>
> \`\`\`text
> Δ ⊢ e₁ : int    Δ ⊢ e₂ : int
> ────────────────────────────
>      Δ ⊢ e₁ + e₂ : int
> \`\`\`
>
> - Other expressions are typed similarly
>
> \`\`\`text
> Δ ⊢ e₁ : int    Δ ⊢ e₂ : int        Δ ⊢ e₁ : int    Δ ⊢ e₂ : int
> ────────────────────────────        ────────────────────────────
>      Δ ⊢ e₁ * e₂ : int                  Δ ⊢ e₁ <= e₂ : bool
>
>                  Δ ⊢ e₁ : int    Δ ⊢ e₂ : int
>                  ────────────────────────────
>                      Δ ⊢ e₁ == e₂ : bool
> \`\`\`

**Approfondimento.** Ogni operatore richiede operandi interi; gli operatori aritmetici producono un \`int\`, i confronti un \`bool\`. Queste regole sono la controparte statica delle regole di riduzione delle slide 20-21: le espressioni che la semantica sa calcolare (numeri per \`+\`, \`*\`, \`<=\`, \`==\`) sono esattamente quelle che il sistema di tipi accetta, quindi \`true * 7\` viene rifiutata, perché \`true\` non ha tipo \`int\`.

### Slide 29 · Typing for commands

> \`\`\`text
> Δ ⊢ c
> \`\`\`
>
> \`\`\`text
>               (x : T) ∈ Δ    Δ ⊢ e : T       Δ ⊢ c₁    Δ ⊢ c₂
> ────────      ────────────────────────       ────────────────
> Δ ⊢ noop             Δ ⊢ x = e                 Δ ⊢ c₁; c₂
>
> Δ ⊢ e : bool    Δ ⊢ c₁    Δ ⊢ c₂           Δ ⊢ e : bool    Δ ⊢ c
> ──────────────────────────────           ─────────────────────
>    Δ ⊢ if e then c₁ else c₂                Δ ⊢ while e do c
> \`\`\`

**Approfondimento.** \`noop\` è sempre ben tipizzato. Un **assegnamento** è ben tipizzato se la variabile è dichiarata e l'espressione ha lo stesso tipo della variabile. Una **sequenza** è ben tipizzata se lo sono entrambi i comandi. **if** e **while** richiedono una guardia di tipo \`bool\` e sotto-comandi ben tipizzati: questo esclude \`if 7 then c else c′\`, il comando bloccato della slide 24.

### Slide 30 · Typing: example

> \`\`\`text
> Note: Δ = f : int; c : int; m : int
>
>                      ─────────────   ─────────────
>                      (f : int) ∈ Δ   (c : int) ∈ Δ
>      ─────────────   ─────────────   ─────────────
>      (f : int) ∈ Δ    Δ ⊢ f : int     Δ ⊢ c : int
>                      ─────────────────────────────
>                            Δ ⊢ f * c : int
> D₁ = ─────────────────────────────────────────────
>                     Δ ⊢ f = f * c
>
>                      ─────────────
>                      (c : int) ∈ Δ
>      ─────────────   ─────────────   ───────────
>      (c : int) ∈ Δ    Δ ⊢ c : int    Δ ⊢ 1 : int
>                      ───────────────────────────
>                            Δ ⊢ c + 1 : int
> D₂ = ───────────────────────────────────────────
>                     Δ ⊢ c = c + 1
>
>      ─────────────   ─────────────          D₁               D₂
>      (c : int) ∈ Δ   (m : int) ∈ Δ
>      ─────────────   ─────────────
>       Δ ⊢ c : int     Δ ⊢ m : int     Δ ⊢ f = f * c    Δ ⊢ c = c * 1
>      ─────────────────────────────    ──────────────────────────────
>           Δ ⊢ c <= m : bool             Δ ⊢ f = f * c; c = c + 1
> D  = ───────────────────────────────────────────────────────────────
>             Δ ⊢ while (c <= m) do (f = f * c; c = c + 1)
> \`\`\`

**Approfondimento.** Una **derivazione di tipo** è un albero di applicazioni di regole le cui foglie sono assiomi e la cui radice è il giudizio da dimostrare; qui, che il ciclo del programma del fattoriale (slide 17) è ben tipizzato. Nella slide ogni fatto di appartenenza, come *(f : int) ∈ Δ*, è disegnato come un assioma (una linea senza nulla sopra), perché si può leggere direttamente da Δ.

- **D₁** dimostra che \`f = f * c\` è ben tipizzato con la regola dell'assegnamento: \`f\` è dichiarata \`int\`, e \`f * c\` è un \`int\` per la regola di \`*\`, le cui premesse sono la regola delle variabili per \`f\` e per \`c\`.
- **D₂** fa lo stesso per \`c = c + 1\`, usando l'assioma per il numero \`1\`.
- **D** le combina: la regola del \`while\` richiede una guardia \`bool\` (\`c <= m\`, per la regola di \`<=\`) e un corpo ben tipizzato, che è la sequenza dei due assegnamenti (la regola della sequenza con D₁ e D₂ come premesse, indicate come etichette sopra di esse).

Nell'ultimo albero la premessa destra della regola della sequenza compare nella slide come "Δ ⊢ c = c ∗ 1": è la conclusione di D₂, quindi dovrebbe essere *Δ ⊢ c = c + 1*. I tre assegnamenti iniziali \`m = 10; f = 1; c = 1;\` si tipizzano allo stesso modo con l'assioma dei numeri, e l'intero programma con la regola della sequenza.

### Slide 31 · Typing for memory

> - Typing for memory ensures that variables in memory hold values of expected type
>
> \`\`\`text
> Δ ⊢ σ
> \`\`\`
>
> if and only if
>
> \`\`\`text
> (x : int) ∈ Δ  implies  (x ↦ n) ∈ σ for some n
>
> (x : bool) ∈ Δ  implies  (x ↦ true) ∈ σ or (x ↦ false) ∈ σ
> \`\`\`

**Approfondimento.** Il teorema di type safety riguarda l'esecuzione di un programma *a partire da una memoria*, quindi la memoria deve essere coerente con le dichiarazioni: ogni variabile dichiarata \`int\` contiene un numero, ogni variabile dichiarata \`bool\` contiene un booleano. Senza questa condizione un programma ben tipizzato potrebbe comunque bloccarsi: con Δ = x : int e σ = x ↦ true, l'espressione ben tipizzata \`x + 1\` si riduce a \`true + 1\`, che è bloccata. La definizione richiede anche che ogni variabile dichiarata *abbia* un valore in σ, così la regola delle variabili della slide 20 non fallisce mai: in Mini-C non esistono variabili non inizializzate.

## Type safety (pagine 32-36)

### Slide 32 · Type safety

> Suppose
>
> - *c* is a well-typed command
> - *σ* is a well-typed memory
> - *σ; c →\\* σ′; c′*
> - Then *c′* is not stuck, i.e., it is noop, or it can reduce further

**Approfondimento.** L'enunciato della type safety a parole: si fa partire un comando ben tipizzato in una memoria ben tipizzata e lo si esegue per un numero qualunque di passi (*→\\**, zero o più passi di ⟶); qualunque sia il comando *c′* raggiunto, non è bloccato: o è \`noop\` (il programma è terminato) o qualche regola gli permette di fare un altro passo.

### Slide 33 · Type safety formally

> **Theorem** (Safety for commands). *Suppose the following holds:*
>
> 1. *Δ ⊢ c*
> 2. *Δ ⊢ σ*
> 3. *σ; c →\\* σ′; c′*
>
> *Then either c′ = noop or there are σ″ and c″ such that σ′; c′ →\\* σ″; c″*

**Approfondimento.** Nella conclusione la freccia dovrebbe essere un passo singolo, *σ′; c′ ⟶ σ″; c″*: con *→\\** sarebbe banalmente vera con zero passi. La dimostrazione standard divide il teorema in due lemmi, ciascuno dimostrato per induzione sulla derivazione di tipo (un caso per regola):

- **Progresso** (progress): se *Δ ⊢ c* e *Δ ⊢ σ*, allora *c* è \`noop\` oppure esiste un passo *σ; c ⟶ σ′; c′*. (Per esempio, per \`x = e\`: poiché *e* ha un tipo, si valuta in un valore di quel tipo, e si applica la regola dell'assegnamento.)
- **Conservazione** (preservation): se *Δ ⊢ c*, *Δ ⊢ σ* e *σ; c ⟶ σ′; c′*, allora *Δ ⊢ c′* e *Δ ⊢ σ′*: un passo mantiene ben tipizzati il comando e la memoria. (Per un assegnamento, il nuovo valore ha il tipo dichiarato della variabile, quindi *σ[x ↦ v]* è ancora ben tipizzata.)

Il teorema segue per induzione sul numero di passi: la conservazione mostra che ogni stato raggiunto è ancora ben tipizzato, e il progresso che uno stato ben tipizzato non è mai bloccato. I due lemmi hanno bisogno degli analoghi per le espressioni.

### Slide 34 · Type safety

> - Why is this theorem "type-safety"?
> - Theorem says that a well-typed program will either terminate or keep reducing
> - By definition, such a program is safe
> - Therefore, a typed program always remains safe

**Approfondimento.** "Keep reducing" comprende il girare all'infinito: la type safety non promette la terminazione (\`while true do noop\` è ben tipizzato e non finisce mai), ma solo che il programma non raggiunge mai uno stato che la semantica non definisce. Poiché unsafe era stato *definito* come bloccato (slide 18), il teorema è esattamente l'affermazione "il type checker garantisce la safety". È ciò che manca al C: il suo type checker accetta programmi, come l'esempio con \`scanf\`, che raggiungono un comportamento indefinito.

### Slide 35 · Summary: types and type-safety

> - *Types* specify expected program behavior
> - Semantics define what safe behavior is
> - *Type-safety*: Typing => always follow semantics => always safe behavior
> - *Reminder*: Not all typed languages are type-safe

**Approfondimento.** I tre ingredienti e come si incastrano: i **tipi** (controllati staticamente, a basso costo), la **semantica** (che definisce il comportamento safe), e il **teorema di type safety** che li collega. Per un linguaggio reale la dimostrazione è molto più lunga (la type safety di Java è stata studiata formalmente alla fine degli anni Novanta, e sono stati trovati difetti sia nella specifica del linguaggio sia nel verificatore del bytecode, come discusso nella prima parte della Lezione 19), ma la struttura è la stessa.

### Slide 36 · What else types can do

> - Prevent null-pointer dereferencing and dangling pointers (e.g., Cyclone)
> - Enforce array bounds (e.g., DML)
> - Prevent information leaks (e.g., Jif, Sif)
> - Enforce access control (e.g., PCML5, Aura, PCAL)
> - Ensure correctness of protocols (e.g., F7)

**Approfondimento.** Sistemi di tipi più ricchi impongono proprietà di sicurezza più ricche, con lo stesso approccio "controllare staticamente, dimostrare la correttezza una volta sola":

- **Cyclone** (AT&T Labs e Cornell, intorno al 2002), un dialetto sicuro del C: tipi di puntatori never-NULL, puntatori "fat" con i limiti, e gestione della memoria basata su regioni, che rifiuta i puntatori che potrebbero sopravvivere alla memoria a cui puntano.
- **DML** (Dependent ML, Xi e Pfenning): tipi che nominano valori, come "array di lunghezza *n*" e "intero minore di *n*", così che i controlli dei limiti degli array si possano verificare in compilazione ed eliminare.
- **Jif** e **Sif**: tipi per il flusso dell'informazione (Lezione 20); Sif applica le etichette di Jif alle applicazioni web costruite con le servlet Java.
- **PCML5**, **Aura** e **PCAL**: sistemi di tipi che includono una logica dell'autorizzazione, così che il codice possa accedere a una risorsa solo se possiede una prova che l'accesso è permesso dalla policy.
- **F7** (Microsoft Research): refinement type per F#, usati per verificare che le implementazioni dei protocolli crittografici soddisfino proprietà di sicurezza come l'autenticazione.
`;export{e as default};
