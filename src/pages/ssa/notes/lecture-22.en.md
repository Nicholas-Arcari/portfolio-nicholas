Lecture 22 is devoted to **aliasing**, the existence of several references to the same object, which safe languages such as Java and C# still allow. Aliasing is useful (efficiency, shared objects, callbacks) but dangerous: through an alias, code outside an object can change its internal representation without passing through its methods (**representation exposure**), which is how the `getSigners` flaw of JDK 1.1.1 let an applet pretend to be signed by a trusted party. The lecture presents two remedies studied in language-based security: **alias control** type systems, which make explicit which fields belong to the representation of an object (`rep` fields, ownership, universes, confined types), and **immutability**, with the subtleties it brings: which fields count as representation, why `final` matters in a multi-threaded program, and why a constructor must not leak `this`. The slide deck has 22 pages.

## The problem of aliasing (pages 1-8)

### Slide 1 · Title slide

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

**Expansion.** The plan of the lecture: the problems caused by aliasing ("the joys" is ironic), then two families of remedies, alias control (of which **confined types**, by Jan Vitek and Boris Bokowski, are one example) and immutability. The suggested reading is the paper that introduced confined types (OOPSLA 1999).

### Slide 3 · Reminder of the problem

> Security flaw in JDK1.1.1

```java
package java.lang; public class
  Class {
  private Identity[] signers;
  /** Obtain list of signers of given class */
  public Identity[] getSigners() {
    return signers;
 }
```

> - Problem : unwanted aliasing

**Code analysis.**

- *What it does.* Every Java class is represented at run time by an object of class `java.lang.Class`. For a class loaded from signed code, `signers` lists the identities that signed it, and the platform uses that list to decide which privileges the code receives. `getSigners()` lets any code ask who signed a class.
- *The vulnerability.* `getSigners` returns the **internal array itself**, not a copy. The field is `private`, but the caller now holds a reference to the same array: an alias to the representation of a security-critical object, which it can modify.
- *Exploit.* An unsigned applet called `getSigners()` on its own class and wrote into the returned array the identity of a signer trusted by the user (the platform also offered a list of all the known signers). The platform then believed that the applet had been signed by that party and gave it its privileges, so the applet escaped the sandbox. The flaw was found in April 1997 by the Secure Internet Programming team of Princeton University, affected JDK 1.1.1 and the HotJava browser (the only one supporting the code signing of JDK 1.1), and is known as the "Magic Coat" attack (it is the "MagicCoat" of Lecture 21, Slide 21).
- *Fix.* JDK 1.1.2 made `getSigners` return a **copy** of the array (`return signers.clone();`), so whatever the caller does with it, the internal list stays unchanged. This is the rule "never return a reference to a mutable object to untrusted code" (Lecture 21, Slide 14).

### Slide 4 · Aliasing

> - Safe languages such as Java and C# do not have pointer arithmetic (eg **&x; x\*, ...**) but they do have references and allow aliasing
> - aliasing = having more than one reference to the same object

**Expansion.** Memory safety removes pointer arithmetic (`&x`, `*x` in C), so no reference can be forged and none can point outside an object (Lecture 19). It does not remove **aliasing**: after `b = a;` the two variables refer to the same object, and a change made through `b` is visible through `a`. Aliasing breaks local reasoning: to know whether an object can change one must know every reference to it, and the references can be anywhere in the program.

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

**Expansion.** Aliasing is not a mistake in itself: it is how object-oriented programs share state on purpose.

- **Efficiency**: a reference to the middle of a list lets a traversal continue from there without starting again (time); sharing one object instead of copying it saves memory (space).
- **Consistency**: when several parts of a program must see the same, up-to-date state (the same bank account, the same configuration), they must all refer to the same object.
- **Patterns**: callbacks and the observer pattern work by registering references to objects that will be called later.
- **Things with an identity**: a file, a window, a device are single entities in the world, and it is natural for several parts of the program to refer to the same one, unlike values such as numbers, which can be freely copied. Purely functional programming, which has no mutable shared state, finds such things awkward to model.

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

**Expansion.** The other side of the coin:

- A change made through one reference is a **side-effect** for all the others: the code that holds `a` sees its object change without having done anything. Bugs become hard to find, the **invariants** of an object (a set without duplicates, a balance never negative) can be broken from outside, and with several threads the accesses through different aliases become **race conditions** (Lecture 11, Lecture 19, Slides 34-38).
- An object protects its state by allowing changes only through its methods (its interface), which can check them. An alias to an internal object lets outside code change the state directly, bypassing those checks: **representation exposure**.

For security the last point is the crucial one: if trusted and untrusted code share objects, untrusted code can use an alias to change state that trusted code relies on, as in the `getSigners` flaw (Slide 3).

### Slide 7 · Representation exposure: spot the problems

```java
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
```

**Code analysis.**

- *What it does.* A set of integers stored in a private array `c`, with the invariant that `c` contains no duplicates. `add` creates a new array one element longer, copies the old elements and appends the new one, unless it is already present; `getcontents` returns the elements.
- *The vulnerabilities.* Two aliases to the private array `c` can be created from outside (Slide 8):
  - the constructor `IntSet(int[] a)` stores the array of the caller, which keeps a reference to it and can later change its elements, for example by writing a duplicate, without any check (it does not even check that the initial array has no duplicates);
  - `getcontents()` returns the internal array itself, so whoever calls it can change the content of the set directly, bypassing `add` and `remove`.
- *Exploit.* Suppose trusted code uses an `IntSet` as the list of user identifiers allowed to perform some operation. Untrusted code that obtained the array, through the constructor or through `getcontents`, adds its own identifier to it, and from then on passes the check.
- *Fix.* Defensive copies in both directions: `c = a.clone()` (with duplicates removed) in the constructor, `return c.clone();` in `getcontents`. (Some slips of the slide: `c.lenght` should be `c.length`, and `newc` is used without being declared, so the code does not compile as written.)

### Slide 8 · Representation exposure

> N.B. two ways to unwanted alias of internal representation:
>
> - exporting a reference
>
>   **`int[] getcontents() { return c;}`**
> - importing a reference
>
>   **`IntSet(int[] a) { c = a; }`**

**Expansion.** The two ways of Slide 7 in general form. **Exporting**: a method returns a reference to an object that belongs to the representation (the `getSigners` case). **Importing**: the object keeps, as part of its representation, a reference that it received from outside, and the sender still has it. The rules of Lecture 21 (Slide 14) correspond one to one: never return a reference to a mutable internal object, and never store a reference to a mutable object received from untrusted code. Importing is the subtler of the two, because a check made on the received object (is the array free of duplicates? is the file name allowed?) can be invalidated by the sender afterwards, a time-of-check-to-time-of-use attack (Lecture 11).

## Alias control (pages 9-13)

### Slide 9 · Alias control

> - Many systems have been - and are being - proposed for alias control (aka ownership, encapsulation, confinement,...)
>   - whole workshops dedicated to this, eg IWACO'2026
> - Many of these require annotations to express the programmer's intent
>   - Especially, things like: in

```java
class A {
private B ref;
 ....
}
```

> is **ref** allowed to be/meant to be aliased or not?

**Expansion.** **Alias control** is the research area of type systems and analyses that restrict which aliases may exist, under several names (ownership, encapsulation, confinement), with its own workshop (IWACO, held with the ECOOP conference). The basic difficulty is that the code alone does not say what the programmer intends: a `private B ref` can be the private representation of `A`, which nobody else should reference (like the array of `IntSet`), or a reference to an independent object that `A` merely uses and that others may share. The same declaration covers both cases, so the intention has to be written down, as an annotation, before a tool can check it.

### Slide 10 · Alias control

```java
public class BankTransfer{
  private BankAccount from,to;
  private int[] amount;
  private char[] description;
  ...
}
```

> Which fields do you think are (not) meant to be aliased?

**Expansion.** A natural answer: `from` and `to` refer to bank accounts, which exist independently of the transfer and are shared by many transfers and by the rest of the bank's code, so these fields are *meant* to be aliases. `amount` and `description` are the transfer's own data, part of its representation: if another object held a reference to the same arrays, it could change the amount or the description of a transfer that has already been checked and approved.

### Slide 11 · Alias control

> Several alias control type systems use notion of rep field

```java
public class BankTransfer{
  private BankAccount from,to;
  private @rep int[] amount;
  private @rep char[] description;
  ...
}
```

> - rep field is owned by the object
> - Important design decision, about the programmer's intention, which should be made explicit
>   - for documentation
>   - for type checking
>
> (Note this decision also affects implementation of .clone and .equals)

**Expansion.** The annotation `@rep` (representation) declares that the object referenced by the field is **owned** by the `BankTransfer` object: it is part of its representation and must not be reachable from outside. Writing the intention down serves twice: as documentation for the next programmer, and as information for a type checker that can then reject the code that would leak the field (Slide 12). The same distinction decides how to copy and compare objects: `clone` must copy the `rep` fields (a deep copy, otherwise original and copy share their representation, the shallow-copy problem of Lecture 21, Slide 17) but not the other references (both transfers refer to the same accounts), and `equals` compares the *contents* of `rep` fields but the *identity* of shared objects.

### Slide 12 · Alias control

> Several alias control type systems use notion of rep field

The code is that of Slide 11.

> Idea: objects of type **`@rep int[]`** and of type **`int[]`** are not *assignment compatible*
>
> *Question*: should **`a.amount`** and **`b.amount`** be assignment compatible for different Banktransfer objects **`a`** and **`b`**?
>
> *Question*: could this solve the signers problem?

**Expansion.** If an `@rep int[]` cannot be assigned to an ordinary `int[]` (or vice versa), a representation object can never be stored in, or returned as, an ordinary reference: the compiler rejects the code that would create the alias.

- *First question.* No: the representation of `a` belongs to `a` and that of `b` to `b`, so `a.amount = b.amount` would make two transfers share the same array. Ownership type systems make the owner part of the type (the `rep` of `a` and the `rep` of `b` are different types), precisely to reject such assignments.
- *Second question.* Yes. With `private @rep Identity[] signers;`, the statement `return signers;` in a public method returning an ordinary `Identity[]` would be a type error: the bug of Slide 3 would have been caught at compile time, and the programmer forced to return a copy.

### Slide 13 · Alias control

> - Many type systems have been - and are still being - proposed for alias control, e.g.
>   - universes by Peter Muller
>     - fine-grained alias control per object
>   - confined types by Jan Vitek and Boris Bokowski
>     - coarser alias control per package
> - Design challenge: defining a system that is
>   - flexible and expressive enough to capture typical programming patterns,
>   - simple enough to be understandable and statically checkable

**Expansion.** Two representative systems:

- **Universe types** (Peter Müller and Arnd Poetzsch-Heffter) organise the objects in a hierarchy of owners: every object has an owner, and a reference is annotated as `rep` (to an object owned by `this`), `peer` (to an object with the same owner as `this`) or `any`/`readonly` (to an object anywhere, through which no change is allowed). References that cross the boundaries of an owner are permitted only for reading, so an object's representation can be modified only through its owner. The control is **per object**.
- **Confined types** (Vitek and Bokowski) work **per package**: objects of a class declared *confined* may be referenced only by code of their own package, never from outside. The rules forbid every way in which a reference could escape: storing it in a public field, returning it from a public method, converting it to a non-confined type, and calling on it inherited methods that might leak `this` (methods must be *anonymous*, the notion that returns in Slide 19).

The design challenge is the usual balance of type systems: a system that rejects too much forces the programmer to fight it, and a system that is too complicated will not be understood or adopted.

## Immutability (pages 14-21)

### Slide 14 · Immutability

> - Another way to prevent aliasing problems:
>   - make objects immutable
>
>   *Why does this prevent aliasing problems?*
> - About 660 (20%) classes in the Java standard library are immutable
>   - Prime example: **`java.lang.String`** is immutable.
>
>   NB many (trusted) API methods take/produce strings as arguments/result. *(Why is immutability important then?)*
> - The programming language Scala clearly distinguishes immutable objects and treats them in special ways
>   - encouraging a more functional programming style

**Expansion.**

- *Why it prevents the problems.* Aliasing is dangerous only together with **mutation** (Lecture 19, Slides 40-41): if an object can never change, it does not matter how many references to it exist, because none of them can be used to change it.
- *Why it matters for strings.* Many trusted API methods receive security-relevant strings: the name of a file to open, a URL, the name of a class to load, a permission. A typical method checks the string and then uses it. If `String` were mutable, untrusted code could pass a harmless string, wait for the check to succeed and then change it, so that the operation is performed on a value that was never checked (Lecture 21, Slides 4-5). Because `String` is immutable (and final, so no mutable subclass can be passed instead), the value checked is the value used.
- *Scala* separates immutable values (`val`) from mutable variables (`var`) and makes immutable collections the default, which encourages a functional style. Java has moved in the same direction: records (Java 16) and the unmodifiable collections of `List.of`.

### Slide 15 · Advantages of immutability

> - Immutable objects can be aliased without problems
> - They are immune to race conditions
> - Conceptually simple (they are values)
> - Because immutable objects can be safely shared, this can *improve* efficiency
>   - because sharing objects saves the cost of copying them
> - However, using immutable objects can also *decrease* efficiency
>   - because not being able to change requires the creation of new objects for every change
>   - eg think of using StringBuffer vs String

**Expansion.** An immutable object behaves like a value, such as a number: it can be shared, passed to untrusted code and used by many threads with no defensive copies and no synchronisation, since there is nothing to protect. The price appears when values change often: every "modification" creates a new object. Building a long string by repeated concatenation of `String`s creates a new string at every step and copies all the characters each time; the mutable `StringBuffer` (or `StringBuilder`) appends in place and produces the final immutable `String` once.

### Slide 16 · Advantages of immutability

> - Could we use immutability to solve the problem with signers?

```java
public class Class {
 private Identity[] signers;
 /** Obtain list of signers of given class */
   public Identity[] getSigners() {
     return signers;
 }
```

> We could, if we had immutable arrays...

**Code analysis.** The code is the vulnerable `getSigners` of Slide 3. Returning the internal array would be harmless if the array could not be modified, but Java has no immutable arrays: every array can be written by whoever holds a reference to it. The alternatives are a copy (`return signers.clone();`, the actual fix) or a different type that cannot be modified, such as an unmodifiable list (`List.copyOf(...)`), which can be shared freely.

### Slide 17 · Advantages of immutability

> Using immutability in the BankTransfer example: instead of

```java
public class BankTransfer{
  private BankAccount from,to;
  private int[] amount;
  private char[] description;
```

> we would get

```java
public class BankTransfer{
  private BankAccount from,to;
  private Integer amount;
              // Integer objects are immutable, so no worries
  private String description;
          // String objects are immutable , so no worries
```

**Code analysis.** The arrays of Slide 10 are replaced by immutable types: an `Integer` and a `String`. Now the constructor can store the values it receives and the getters can return them without copying: anyone who holds a reference to the same `Integer` or `String` cannot change it. The `BankTransfer` object itself, however, is not yet immutable, because its fields can still be reassigned by its own methods (next slide).

### Slide 18 · Better still, of course

> Even better

```java
public class BankTransfer{
   final private BankAccount from,to;
   final private Integer amount;
                    // Integer objects are immutable
   final private String description;
                   // String objects are immutable
  ...
 }
```

> now BankTransfer objects are also immutable
>
> - NB **`final`** is easy to forget but crucial for immutability in multi-threaded context; see slides on Language-Based Security!

**Expansion.** With `final` fields that refer to immutable objects, a `BankTransfer` cannot change after construction. Two remarks:

- `from` and `to` still refer to mutable bank accounts, but they are references to shared objects, not part of the transfer's representation (Slide 10): the transfer always refers to the same accounts, and that is all its immutability promises. Making this distinction precise is the subject of Slide 20.
- Without `final`, an object that is never modified may still appear to change in a multi-threaded program: another thread can see it before its fields have been written, with their default values. The Java memory model guarantees that every thread sees the values assigned to `final` fields in the constructor, provided the object does not escape before the constructor ends (Lecture 19, Slides 35-37, and Slide 21).

### Slide 19 · Immutability

> - Immutability of classes is an important property that deserved to be made explicit in code, and checked
>
> Eg **`public @Immutable class BankTransfer{ ...}`**
>
> - Proposal for this
>
> Immutable Objects for a Java-like Language
>
> Christian Haack, Erik Poll, Jan Schäfer, and Aleksy Schubert, ESOP'07 & ECOOP'09
>
> - uses notions of rep fields and anonymity, plus more
> - Used today by many system, e.g. Google ErrorProne

**Expansion.** As for `rep` fields, the intention "objects of this class never change" should be written in the code (the annotation `@Immutable`) and checked by a tool, instead of being a comment that the next change may silently contradict. The proposal cited is a type system for immutability in a Java-like language (Haack, Poll, Schäfer and Schubert at ESOP 2007, followed by Haack and Poll at ECOOP 2009), which needs the two notions of the next slides: **rep fields**, to know which objects belong to the representation, and **anonymity**, to make sure that `this` does not escape during construction. Similar checks are used in practice: Google's Error Prone, a static analyser that runs inside the Java compiler, rejects a class annotated `@Immutable` whose fields are not final or refer to mutable types.

### Slide 20 · immutability and the need for rep

> - We need to know which fields are rep-fields, ie. part of the object representation, in order to know what immutability means.
> - E.g.

```java
public @immutable class A{
  final private @rep int[] a;     // a and contents of a immutable
     ...
     }
```

> vs

```java
public @immutable class A{
  final private int[] a;          // contents of a can mutate
   ...
}
```

**Code analysis.** In both versions the field `a` is `final`, so it always refers to the same array. In the first, the array is declared part of the representation (`@rep`), so the immutability of `A` covers it as well: neither the reference nor the contents may change (**deep** immutability). In the second, the array is an ordinary reference, possibly shared with other objects, and only the reference is fixed: the contents can change (**shallow** immutability). `final` alone gives only the second, and this is why the immutability of a class cannot be defined without knowing which fields are representation.

### Slide 21 · immutability and the need for anonymous

```java
public @immutable? class Integer {
  public static Integer latest; // latest integer object allocated
  private final int i;
  public Integer(int j){ i = j;
                         latest = this;}
  public int getValue(){ return i;)
}
```

> Are these integer objects immutable?
>
> - No, not in a multi-threaded context:
>
> Constructor leaks **`this`**, hence field **`i`** not immutable: **`Integer(5)`** may be observed to change from 0 to 5.

**Code analysis.**

- *What it does.* A wrapper of an `int` with a `final` field `i`, which looks immutable. But the constructor also stores `this` in the public static field `latest`, so that anybody can find the last integer created.
- *The vulnerability.* The guarantee of `final` fields (Slide 18) holds only for objects that are published *after* their constructor has finished. Here the object escapes *during* construction: another thread can read `latest` while the constructor of `Integer(5)` is still running, or before its write to `i` is visible, see `getValue()` return 0, and later return 5. An object whose only field is `final` has changed value: it is not immutable.
- *Fix.* The constructor must be **anonymous**: it must not let `this` escape (no assignment of `this` to fields of other objects or to static fields, no calls that pass `this` to other code). Publishing the object after construction (`Integer x = new Integer(5); latest = x;`) restores the guarantee. (On the slide, `return i;)` should end with `}`; the question mark in `@immutable?` is the question of the slide.)

## Recap (page 22)

### Slide 22 · Recap

> - Language constructs such as public/private/... enable protection of access to fields, methods, classes
> - but do *not* provide a way to protect integrity of objects in system of interacting objects
> - Confined Types
>   - a particular scheme for alias control, that can provide integrity
>   - all package scoped objects should be confined?
> - Immutability
>   - another way to avoid/reduce aliasing problems
>   - built-in in newer programming languages such as Scala

**Expansion.** The lecture in three points. Visibility modifiers control who can *name* a field or a method, but not who can *reach* an object: a private field is not protected if a reference to its object has been handed out, so access control on names does not give integrity of objects. **Alias control** (here confined types) restricts where references may go, and asks whether every package-scoped class should be confined by default. **Immutability** removes the danger instead of the aliases: objects that cannot change can be shared freely. Both turn into checkable rules the guidelines of Lecture 21 (no public fields, defensive copies, `final`), which otherwise depend on the programmer's discipline.
