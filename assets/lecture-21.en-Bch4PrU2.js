const e=`Lecture 21 moves from what the Java platform guarantees by itself (memory safety, strong typing, visibility modifiers, sandboxing; Lecture 19) to what the programmer must still do. Even on a correct platform, a single Java class can be attacked by other code that runs in the same virtual machine, so a set of **secure programming guidelines** has been proposed (McGraw and Felten's twelve rules, Wheeler's HOWTO). The lecture goes through them, each with the attack it prevents: no public or protected fields and no trust in package protection, visibility as restrictive as possible (and why reflection is a loophole), \`final\` classes and members, no exchange of mutable objects with untrusted code (aliasing), no inner classes, no cloning, no serialisation. It closes with the limits of guidelines and with the research on richer type systems, which the next lecture (aliasing) develops. The slide deck has 21 pages.

## Why programming guidelines (pages 1-6)

### Slide 1 · Title slide

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

**Expansion.** The four features are the language-based security mechanisms of Lecture 19, seen as a platform:

- **Memory safety** and **strong typing**: no buffer overflows, no pointer arithmetic, no type confusion (Lecture 19, Slides 17-30), enforced by the compiler, by the bytecode verifier when a class is loaded, and by run-time checks.
- **Visibility restrictions**: \`private\`, package, \`protected\` and \`public\` decide which code may use a field, a method or a class. Because the platform enforces them, they are not only a matter of good style: they are what lets a class protect its own state from other code.
- **Sandboxing based on stack walking** (stack inspection): code carries permissions according to its origin, and before a sensitive operation (opening a file, opening a connection) the security manager walks the call stack and checks that *every* caller has the required permission, so untrusted code cannot obtain the operation by calling trusted code (Lecture 1).

Together they allow code of different trust levels to run in the same virtual machine, the scenario of Java applets and of plug-ins: a bug, or a hostile component, cannot break the platform or the other components. The same model was adopted by Microsoft .NET (C#, with its Code Access Security). Both sandboxes have since been abandoned: .NET Core no longer supports Code Access Security, and in Java the security manager was deprecated in Java 17 and permanently disabled in Java 24, so code that runs in a Java virtual machine is now trusted as a whole. The guidelines of this lecture remain relevant for every class that must protect its state against other code, as the next slides show.

### Slide 3 · Programming guidelines

> *Even if*
>
> - type system is sound
> - VM & type checker are correct
> - sandboxing is sound & implemented correctly
>   - ie no exploitable bugs in platform API classes like **\`java.lang.Class, java.lang.SecurityManager\`**
> - policy file is correct
>
> a particular Java class may still be vulnerable to attacks by untrusted code
>
> Programming guidelines have been proposed to prevent known vulnerabilities

**Expansion.** The list is the trusted computing base of the Java security model: the type system must be sound, the virtual machine and the bytecode verifier must have no bugs (Lecture 19, Slide 26), the sandbox must be designed and implemented correctly, including the platform classes that implement it (\`java.lang.Class\`, \`java.lang.SecurityManager\`), and the **policy file**, which says which permissions each piece of code receives, must be right. Even if all this holds, the platform only enforces what the *code of the class* says. A class that leaves a field public, or hands out a reference to its internal array, has opened a door that the platform will not close. Programming guidelines are collected from known attacks, to prevent the same mistakes from being made again.

### Slides 4-5 · Spot the defect

\`\`\`java
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
\`\`\`

> **class should be** *final* **to prevent malicious subclasses**
>
> fields should *not* be *public* to prevent unauthorised changes, ie. preserve integrity
>
> fields should be *final* (for thread-safety, see next slide)
>
> array should be cloned to prevent *representation exposure which allows unauthorised changes*

**Code analysis.** Slide 4 shows only the code; Slide 5 shows it again with four callouts. The first points to \`public class String\`, the second to \`public char[] contents\` and \`public int offset, len\`, the third to the same fields, the fourth to \`contents = a\` in the constructor.

- *What it does.* A home-made string class: the characters are stored in an array \`contents\`, and the string is the part of the array that starts at \`offset\` and is \`len\` characters long. The constructor \`String(char[] a)\` makes a string from an array, \`substring(take)\` returns a string with the first \`take\` characters, sharing the same array.
- *The vulnerabilities* (the four callouts):
  - **The class is not \`final\`.** Anybody can write a subclass, override its methods (say \`getLength\`, or add a method that changes the characters) and pass an instance of the subclass wherever a \`String\` is expected. Code that trusts a \`String\` to behave like one is then talking to the attacker's code.
  - **The fields are \`public\`.** Any code can write \`contents\`, \`offset\` and \`len\` directly: the integrity of every string is in the hands of every other class.
  - **The fields are not \`final\`.** In a multi-threaded program, another thread may see an object of this class before its constructor has finished, with fields still at their default values: a string could appear to change. The Java memory model gives visibility guarantees only to \`final\` fields (Lecture 19, Slides 35-37, and Lecture 22, Slide 21).
  - **The array is not cloned.** The constructor stores the very array it receives, \`contents = a\`. The caller still holds a reference to it and can change the characters of the "string" afterwards. This is **representation exposure**: the internal representation of the object is shared with code outside it (Lecture 22, Slides 7-8).
- *Exploit.* Suppose trusted code receives the name of a file as a \`String\`, checks that it is a harmless file and then opens it. Untrusted code passes a string built on an array it keeps, waits for the check to succeed, changes the array (or simply the public field \`contents\`) to "/etc/passwd", and the trusted code opens a file that was never checked. It is a time-of-check-to-time-of-use attack (Lecture 11), and it is the reason why the real \`java.lang.String\` is \`final\`, has private final fields and copies the arrays it receives.
- *Fix.* \`public final class String\`, fields \`private final\`, \`contents = a.clone()\` in the constructor, and no method that returns or exposes the internal array.
- *Other slips* (not security issues): \`a.len\` should be \`a.length\`, \`s.content\` and \`this.content\` should be \`contents\` (as written, the code does not compile), Java has no \`NegativeSizeException\` (the standard exception is \`NegativeArraySizeException\`), \`Math.min(take,s.len)\` uses the length of the new, empty string (0) instead of \`this.len\`, so every substring is empty, and the class lacks its closing brace. The third callout refers to a "next slide" on thread safety that is not in this deck; the topic is in Lecture 19.

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

**Expansion.** The two classic sources: the "Twelve rules for developing more secure Java code" of Gary McGraw and Edward Felten (1998, also in their book *Securing Java*), and the Java section of David Wheeler's *Secure Programming HOWTO*. Their current successors are Oracle's *Secure Coding Guidelines for Java SE* and the *CERT Oracle Secure Coding Standard for Java*.

The scope matters. The rules defend a class against **other code in the same virtual machine**: they are essential for an application that loads code it does not fully trust (plug-ins, extensions, the applets of the past) and for **libraries and APIs**, which by definition are called by code their authors do not know. In a closed application whose code is all trusted they are good engineering rather than security, but code tends to be reused in contexts its authors did not foresee ("or may some day be").

## Visibility: fields, packages and reflection (pages 7-13)

### Slide 7 · Java security programming guidelines

> - Do not use public fields

**Expansion.** A public field can be read and written by any code, without passing through a method of the class. The class can no longer check the values (a negative balance, a \`null\` reference), maintain its invariants, or notice that the field has changed. Access through methods is what makes validation and encapsulation possible. The exception usually accepted are \`public static final\` constants of an immutable type; a \`public static final\` array is not a constant, because its elements can still be changed.

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

**Expansion.** In Java \`protected\` is *more* permissive than it looks: a protected member is visible to subclasses **and** to every class of the same package. Both doors are open to an attacker:

- **Subclasses**: anyone can extend a non-final class and read or write its protected fields. Making the class \`final\` closes this door (Slide 13).
- **The package**: package membership is just a declaration, \`package com.bank;\`, at the top of a source file. Nothing prevents untrusted code from declaring itself part of the same package and gaining package access. A **sealed** package closes this door: when a JAR file declares a package sealed (with the attribute \`Sealed: true\` in its manifest), all the classes of that package must come from that JAR. The \`java.*\` packages are protected even more strongly, because the class loader refuses to define classes in them.

### Slide 9 · Java security programming guidelines

> Hence:
>
> - Do not rely on package protection for security
> - in particular: make all fields private
> - NB this conflicts another standard Java coding guideline, namely
>   - do not make fields private, make them protected instead
>
>   This guideline is motivated by desire for extensibility, not security

**Expansion.** Since package access can be obtained by anyone who can add a class to the package, and protected access by anyone who can subclass, \`private\` is the only visibility that protects a field. The opposite advice, "make fields protected so that subclasses can reuse them", comes from object-oriented design, where extensibility is the goal: it is a good example of the tension between functionality and security (Slide 19). When subclasses really need the state, they can be given protected or public *methods*, which can check what is done with it.

### Slide 10 · Java security programming guidelines

> - Limit access to classes, methods, and fields
>   - make them **private**, unless... there is a need for them to be more visible
> - cf principle of least privilege
> - A compiler only complains if visibility is too restrictive, not if it is too liberal. The JAMIT tool checks if visibility can be made more restrictive.

**Expansion.** Visibility applied to the **principle of least privilege** (Lecture 10, Slides 15-19): every class, method and field gets the smallest visibility that lets the program work, so the attack surface is as small as possible (Lecture 10, Slide 28). The compiler is asymmetric: it rejects a program that uses something it cannot see, but it never warns that something is visible without need, so excessive visibility goes unnoticed. JAMIT (Java Access Modifier Inference Tool, by Christian Grothoff) analyses the compiled classes and proposes, for each class, method and field, the most restrictive modifier compatible with the code that uses it.

### Slide 11 · Potential visibility loophole: reflection

> Reflection
>
> = ability of a program to inspect & modify itself

\`\`\`java
Class cl = o.getClass(); // o's class
Field[] fs = cl.getDeclaredFields(); //
for (Field f : fs){
  if !(Modifier.isPublic()(f.getModifiers())
           { f.setAccessible(true);}
  print("Field " + f.getName()); println(" has value " + f.get(o));
}
\`\`\`

> There is also a method to set fields, **\`f.set(o,val)\`**

**Code analysis.**

- *What it does.* It takes the class of an object \`o\`, obtains the list of *all* its declared fields (\`getDeclaredFields\` returns private ones too), makes every non-public field accessible with \`setAccessible(true)\`, which switches off the access check of the language, and prints the name and value of each field, private ones included. With \`f.set(o, val)\` the same code could also *change* them. (The condition is written loosely: in Java it reads \`if (!Modifier.isPublic(f.getModifiers()))\`. On the slide the string \`" has value "\` is split over two lines.)
- *The vulnerability.* Visibility modifiers are checked by the compiler and by the virtual machine, but reflection is an API that can bypass them at run time: \`private\` stops ordinary code, not code that uses reflection. A class that keeps a secret (a key, a password) or relies on an invariant in a private field is exposed to any code that can call \`setAccessible\`.
- *Fix.* See Slide 12: the platform must refuse \`setAccessible\` to untrusted code.

### Slide 12 · Potential visibility loophole: reflection

> - Reflection allows access to fields that are normally *not* visible
> - The default security manager prevents this, and will throw an **\`AccessControlException\`**
>   - unless **\`java.lang.reflect.ReflectPermission\`** is granted

**Expansion.** In the sandbox model, \`setAccessible(true)\` asks the security manager for the permission \`ReflectPermission("suppressAccessChecks")\`, which untrusted code does not have, so the call fails with an \`AccessControlException\` and visibility remains a real protection. Two developments have changed the picture:

- since the security manager is disabled (Slide 2), any code in the application can use reflection on the application's own classes: inside one virtual machine, \`private\` is no longer a security boundary;
- since Java 9 the module system has added **strong encapsulation**: a module decides which of its packages are open to reflection, and since Java 17 the internals of the JDK itself can no longer be accessed by reflection unless the application is launched with an explicit option (\`--add-opens\`).

The general lesson is the one already met with Solidity (Lecture 18, Slide 23): visibility modifiers organise who may *use* a piece of data, they do not make it secret.

### Slide 13 · Java security programming guidelines

> - Make classes, methods, fields **final**, unless... there is a need for them to be subclassed/overridden/modified
> - *Why?*
> - cf principle of least privilege

**Expansion.** \`final\` has three meanings, all useful for security:

- A **final class** cannot be extended, so nobody can pass a subclass with different behaviour where the class is expected (the first callout of Slide 5). \`java.lang.String\` is final for this reason; a well-known counterexample is \`java.math.BigInteger\`, which is not final, so a value received as a \`BigInteger\` may in fact be a mutable subclass written by an attacker.
- A **final method** cannot be overridden, so the checks it performs cannot be replaced.
- A **final field** cannot be reassigned after construction, and it is safely visible to all threads (Lecture 19, Slides 35-37).

The default "final unless there is a reason not to be" is least privilege again: a subclass is a privileged user of a class, since it can change its behaviour, and that privilege should be granted only when it is needed.

## Mutable objects, inner classes, cloning and serialisation (pages 14-18)

### Slide 14 · Java security programming guidelines

> - Never return (a reference to) a mutable object (incl. arrays) to untrusted code
> - Never store a reference to a mutable object (incl. arrays) obtained from untrusted code
> - *Why?*

**Expansion.** Both rules prevent **aliasing** between the internal state of an object and code outside it (Lecture 22):

- **Returning** a reference to a mutable internal object hands the caller the power to modify it. This is the \`getSigners\` flaw of JDK 1.1.1 (Lecture 22, Slide 3), in which a method returned the internal array of the signers of a class and an applet could write itself into it as signed by a trusted party.
- **Storing** a reference received from the caller leaves the caller able to change it afterwards: the object validates a value, and the caller modifies it once the validation is done (time of check to time of use, Lecture 11). This is the constructor \`contents = a\` of Slide 5.

The remedy is **defensive copying**: copy what you receive *before* validating it and copy what you return (\`array.clone()\`, \`List.copyOf\`, or an unmodifiable view). Immutable objects need no copy at all (Lecture 22, Slides 14-21).

### Slide 15 · Java security programming guidelines

> - Don't use inner classes.
> - *Why? Byte code - and byte code verifier - don't know about inner classes; in byte code:*
>   - *inner class becomes package visible normal class*
>   - *private field of outer class may become package visible*

**Expansion.** Inner classes exist only in the Java language, not in the bytecode that the virtual machine executes. The compiler turns an inner class into an ordinary top-level class (named \`Outer$Inner\`), with package visibility even if it was declared \`private\`. Since the inner class may use the private members of the outer class, but in the bytecode they are now two different classes, the compiler adds to the outer class hidden *synthetic* methods with package visibility, which read or write those private members on the inner class's behalf. Any class of the same package can call them, so a private field is in practice package-visible, and package protection is weak (Slide 8). Since Java 11 the virtual machine knows which classes belong to the same *nest* (an outer class and its inner classes) and lets them access each other's private members directly, so the synthetic accessors are no longer generated.

### Slide 16 · Example inner class

\`\`\`java
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
\`\`\`

**Code analysis.**

- *What it does.* \`Outer\` has a private field \`x = 5\` and a private inner class \`Inner\`, whose method \`helper\` reads \`x\`. \`getX\` creates an \`Inner\` and returns \`helper()\`; \`main\` prints 5.
- *The vulnerability.* In the source, \`x\` and \`Inner\` are both private. In the bytecode produced by compilers before Java 11, \`Inner\` becomes the package-visible class \`Outer$Inner\`, and \`helper\` cannot read \`x\` directly (to the virtual machine it belongs to another class); so the compiler adds to \`Outer\` a static method with a name like \`access$000(Outer)\`, with package visibility, that returns \`o.x\`.
- *Exploit.* A class placed by an attacker in the same package (Slide 8) can call \`Outer.access$000(o)\` and read the private field of any \`Outer\` object; where the inner class also writes fields of the outer class, the generated accessor lets the attacker change them.
- *Fix.* Avoid inner classes in classes that must protect their state, seal the package (Slide 8), or compile for Java 11 or later, where nestmates access private members without accessors.

### Slide 17 · Example inner class

> - Make classes non-cloneable

**Expansion.** (The title repeats that of the previous slide; the rule is about cloning.) \`clone()\` creates a copy of an object **without running a constructor**, so the checks a constructor performs are skipped, and the default copy is **shallow**: the copy shares with the original every object referenced by its fields, which is aliasing again (Lecture 2, Slide 5). If a class is not final, an attacker can subclass it, implement \`Cloneable\` and clone objects that the class never meant to duplicate (for example a capability or a session token). McGraw and Felten's rule is to make a class explicitly non-cloneable with the method \`public final Object clone() throws CloneNotSupportedException { throw new CloneNotSupportedException(); }\`: being \`final\`, it cannot be overridden by a subclass to allow cloning again.

### Slide 18 · Java security programming guidelines

> - Make classes non-deserialiseable.
> - Make classes non-serialiseable.
> - I.e. don't implement
>
>   **\`void writeObject(java.io.ObjectOutputStream)\`**
>
>   **\`void readObject(java.io.ObjectOutputStream)\`**
> - *Why?*

**Expansion.** Java serialisation turns an object into a stream of bytes, and deserialisation turns bytes back into objects. Both bypass the protections of the language:

- **Serialising** writes *all* the fields of an object, private ones included (unless they are \`transient\`): the bytes reveal the internal state, which is a confidentiality problem.
- **Deserialising** creates objects from bytes **without calling their constructors**, so the bytes, which may come from an attacker, can describe an object with any field values, also ones that the constructors would reject. Worse, during deserialisation the virtual machine executes the \`readObject\` methods of the classes involved: by chaining methods of ordinary library classes ("gadget chains", found in 2015 in Apache Commons Collections and many other libraries), an attacker who controls the bytes can make the application execute arbitrary code. Insecure deserialisation was in the OWASP Top 10 of 2017.

To make a class non-serialisable, do not implement \`Serializable\`; if a superclass already does, define \`writeObject\` and \`readObject\` so that they throw a \`NotSerializableException\`. (On the slide the second signature has a slip: \`readObject\` takes a \`java.io.ObjectInputStream\`.) Since Java 9, deserialisation filters can restrict which classes a stream may contain.

## General observations (pages 19-21)

### Slide 19 · Java security programming guidelines

> General observations
>
> - Flexibility & extensibility provided by OO is nice for programming, but nasty for security
>   - usual tension between functionality & security
> - These issues are not at all obvious, and typical programmers won't know these things, unless they have actively looked for information
>   - see principle: use your community resources,
>
>     eg google for language/setting specific security guidelines

**Expansion.** Almost every rule of this lecture removes a feature of object-oriented programming: inheritance (\`final\`), sharing of objects (defensive copies), inner classes, cloning, serialisation. Those features exist to make programs flexible, and flexibility for the programmer is also flexibility for the attacker: the usual tension between functionality and security. Since none of these issues is obvious, a programmer who has not looked for them will not know them; hence the principle "use your community resources" (Lecture 10, Slides 45-46): for each language and platform, look for the security guidelines that others have already written.

### Slide 20 · More programming guidelines

> - There are more programming guidelines, that are not directly motivated by security.
> - Specific APIs may come with their own programming guidelines, possibly security-related
> - Guidelines are very useful as checklists, but do not be tempted into thinking they are complete and give absolute guarantees.

**Expansion.** Guidelines are a checklist for writing and reviewing code (Lecture 15, code review), and many can be checked by tools: static analysers report public fields, unnecessary visibility, mutable static fields, or the return of internal arrays. But a checklist records the attacks that are *already known*: following it rules those out, not the next one. As for tools (Lecture 6), a clean result is not a proof of security.

### Slide 21 · More language-based security

> Ongoing work for
>
> - Richer type systems, eg
>   - alias protection to prevent MagicCoat,
>     - more on alias protection later
>   - **non\\_null** references
>   - **Immutable** objects
> - Tainting / information flow
>   - eg taint mode in perl
> - Program verification
>   - more on this later

**Expansion.** Guidelines rely on the programmer's discipline; the research of language-based security tries to turn them into properties that a compiler or a tool can check:

- **Alias protection**: type systems that prevent references to the internal state of an object from leaking out of it (Lecture 22). "Magic Coat" is the name given to the \`getSigners\` attack of JDK 1.1.1 (Lecture 22, Slide 3), which alias protection would have rejected at compile time.
- **Non-null references**: types that distinguish references that may be \`null\` from those that may not, so that null-pointer dereferences are excluded by type checking (Lecture 19, Slide 31; today in Kotlin, and in Java through annotation checkers).
- **Immutable objects**: types that guarantee that an object cannot change after construction (Lecture 22, Slides 14-21).
- **Tainting and information flow** (Lecture 20), such as Perl's taint mode.
- **Program verification**: proving that a program satisfies a formal specification, for example with annotations in the Java Modeling Language (JML) checked by a verification tool.
`;export{e as default};
