Lecture 19 looks at security from the side of the programming language: what a language can guarantee by itself (memory safety, type safety, thread safety, access control through visibility, information flow control) and what it can only make easier (good APIs, exceptions, modular reasoning). It distinguishes safety from security, explains why the abstractions of a language are security mechanisms only as long as they cannot be broken, and goes through the three main kinds of safety: **memory safety** (unchecked array bounds, pointer arithmetic, null pointers, manual memory management), **type safety** (what types guarantee, how type confusion breaks them, how soundness can be checked) and **thread safety** (data races, reordering in the Java memory model, aliasing and mutation). The lecture continues with a second deck, "Lecture 19 (part 2)", on the formal treatment of types. The slide deck has 42 pages.

## Language-based security and safety (pages 1-16)

### Slide 1 · Title slide

> **Security in Software Applications**
>
> Language-Based Security

### Slide 2 · Language-based Security

> Programming Languages can provide security features and guarantees
>
> - safety guarantees
>   - memory safety
>   - type safety (different levels depending on expressivity)
>   - thread safety
> - Access Control (in some form)
>   - visibility and access restrictions (public, private, ...)
>   - sandboxing mechanisms
> - Information Flow Control (in some form)
>   - JFlow/Jif or next generation Javascript
>
> These features often interdependent (type needs memory, sandboxing needs memory and type, ...)

**Expansion.** Most of the vulnerabilities of this course are possible because the language lets them happen: a buffer overflow (Lecture 3) is an out-of-bounds write that C does not prevent, a use-after-free is a memory access that C does not check. **Language-based security** moves part of the protection into the language and its implementation, so that whole classes of bugs become impossible in every program written in it. The slide lists three families of guarantees:

- **Safety guarantees**: **memory safety** (no access outside allocated memory), **type safety** (data is used only according to its type, with stronger or weaker levels depending on how expressive the type system is) and **thread safety** (concurrent code behaves predictably). They are the subject of this lecture.
- **Access control**: **visibility** modifiers (`public`, `private`, ...) restrict which code can touch which data, and **sandboxing** restricts what untrusted code can do at all (the Java applet sandbox, the JavaScript sandbox of browsers).
- **Information flow control**: the type system tracks where secret or untrusted data can flow (**JFlow/Jif**, an extension of Java with security labels, and research on information-flow control for JavaScript); this is the subject of Lecture 20.

The last line is important: the guarantees depend on each other. Type safety is meaningless without memory safety (a stray write can overwrite any typed value), and a sandbox based on visibility needs both, otherwise untrusted code could forge a reference to a private object and escape.

### Slide 3 · Other ways to help

> A programming language can help security also if it
>
> - offers good APIs and libraries
>   - API with parametrized queries for SQL
>   - secure string libraries for C
> - supports external languages
> - offers useful features
>   - such as exceptions and their handling
> - makes assurance easier
>   - understand code in modular way ...
>
> Insecure programs can be written in ANY language (forget input validation, flaw in program logic, ...)

**Expansion.** Besides hard guarantees, a language and its ecosystem help security in softer ways:

- **Good APIs** make the secure way the easy way: **parameterized queries** prevent SQL injection by construction (Lecture 9, Slides 12-14), and **safe string libraries** for C (bounded functions such as `strlcpy`, or C11's Annex K functions) reduce buffer overflows (Lecture 3, Slides 40-52).
- **Support for external languages** (embedded SQL, query builders, templating systems that know HTML) lets the compiler or library handle the escaping that programmers get wrong in injection attacks (Lectures 4-5).
- **Exceptions** make error handling explicit and harder to ignore than error codes, which helps against fail-open bugs (Lecture 10, Slides 32-40).
- **Modularity** (encapsulation, interfaces) makes assurance easier, because each module can be understood and reviewed in isolation.

The last line keeps expectations realistic: no language prevents logic errors, missing authorisation checks or unvalidated input. A memory-safe language removes buffer overflows, not SQL injection.

### Slide 4 · Safety vs. Security

> sometimes confused
>
> - SAFETY: system protected against accidental failures
> - SECURITY: system protected against induced failures (active attacker)
>
> separation line not clear, but good for safety also good for security

**Expansion.** **Safety** is about accidents: random faults, programming errors, unexpected inputs, without any intent behind them. **Security** is about an **active attacker** who deliberately looks for and triggers the failure that hurts most (Lecture 1). The two overlap because the same bug serves both: an unchecked array index is a safety problem when it crashes the program by chance and a security problem when an attacker uses it to overwrite a return address (Lecture 3). That is why "language safety" is a security topic: every guarantee that removes a class of accidental failures also removes the corresponding class of attacks. The difference shows in the assumptions: a safety argument can rely on failures being rare and random, a security argument cannot, because the attacker chooses the worst input every time.

### Slides 5-7 · General Idea

> when does the assignment `a[i] = (byte)b ;` make sense?
>
> `a` must be a non-null byte array
>
> `i` a non-negative integer < arraylength
>
> `b` should be a byte or converted to one
>
> Two approaches
>
> - the programmer is responsible for verifying these conditions
>   - unsafe approach
> - the language is responsible for checking these conditions
>   - safe approach

Page 5 shows only the question, page 6 adds the three conditions and page 7 the two approaches.

**Expansion.** A single assignment already depends on several assumptions: `a` refers to an existing array of bytes, the index `i` is within its bounds, and the value of `b` fits in a byte. If any of them is false, the assignment writes to memory it should not touch, which is exactly a buffer overflow or a type confusion. There are two ways to ensure the assumptions:

- In an **unsafe** language such as C the programmer must verify them; if one check is forgotten, the program has undefined behavior and possibly a vulnerability.
- In a **safe** language such as Java the language verifies them: the type system ensures that `a` is a byte array and that `b` is converted, and the runtime checks that `a` is not null and that `i` is in bounds, throwing an exception otherwise. The bug can still exist, but it can no longer corrupt memory.

The rest of the lecture is about how languages implement the second approach.

### Slide 8 · SAFE programming languages

> Safe programming languages
>
> - impose some discipline (via restrictions) on the programmer
> - offer **abstractions** (enforced with associated guarantees) to the programmer
>
> reduced freedom and flexibility in exchange for added safety and clearer understanding

**Expansion.** A safe language **forbids** some things that an unsafe language allows: arbitrary pointer arithmetic, casts between unrelated types, manual deallocation. In exchange it offers **abstractions with guarantees**: an array is a sequence of elements of a given type that can only be accessed within bounds, an object reference always points to a live object of the right class. The trade-off is less freedom (no direct memory manipulation, sometimes lower performance) for safety and programs that are easier to understand, because the guarantees hold everywhere and do not depend on every programmer being careful.

### Slide 9 · Example abstractions

> - programming languages constructs provide *abstraction from CPU instructions*
> - programming language variables and types provide *abstraction of memory*
> - procedure call mechanism provides abstraction over *call stack mechanism*
> - ...

**Expansion.** Every high-level language is a set of abstractions over the machine: control structures (`if`, `while`) hide jumps and branches, variables and types hide raw memory addresses and bytes, and procedure calls hide the stack, the saved return address and the frame pointer. These abstractions are exactly what attacks break: a stack buffer overflow overwrites the saved return address, an implementation detail that the *call* abstraction promises the program can never touch (Lecture 3, Slides 7-13).

### Slide 10 · Example OS abstractions

> - OS provides virtual memory as abstraction of raw memory
> - OS provides process as abstraction of CPU and memory
> - OS provide security by
>   - separating processes
>   - controlling access to resources by process
>   - BUT this security breaks whenever these abstractions break !

**Expansion.** The operating system works the same way: **virtual memory** gives every process its own address space, and the **process** abstraction gives it its own virtual CPU. Security between processes rests on these abstractions: a process cannot read another process's memory because it cannot even name it, and the OS checks access to files and devices per process. When an abstraction breaks the security built on it breaks too: kernel bugs that let a process write to arbitrary physical memory, or attacks such as Meltdown (2018), in which speculative execution let a process read kernel memory that the virtual-memory abstraction was supposed to hide.

### Slide 11 · Abstractions

> - abstractions are crucial to reduce complexity
>   - reducing complexity reduces **bugs**
> - abstractions provide security (*access control*)
>   - memory access control by paging/segmentation
>   - access to files (bits of hard disk) by processes
>
> **provided** the abstractions are rigorously enforced
>
> - but ... some abstractions may be broken
>   - stack overflows to break the procedure call mechanism
>   - uninitialized virtual memory may leak information
>   - timing attacks may reveal the virtual memory abstraction

**Expansion.** Abstractions have two security benefits: they **reduce complexity**, and fewer things to reason about means fewer bugs; and they **are** access control, since paging and segmentation decide which memory a process can touch, and the file abstraction decides who can read which disk blocks. The key word is **provided**: everything holds only if the abstraction is rigorously enforced. The slide gives three ways abstractions break:

- **Stack overflows** break the procedure-call abstraction by overwriting the return address (Lecture 3).
- **Uninitialized memory** breaks the "fresh variable" abstraction: memory handed out without being cleared can still contain secrets of its previous owner (a classic leak in kernels and in C programs that `malloc` without clearing).
- **Timing attacks** break the virtual memory abstraction: the time an access takes reveals whether the data was in the cache or whether a page is mapped, information the abstraction was meant to hide (the basis of cache side channels and of KASLR bypasses).

### Slide 12 · General definition of Safety (?)

> a programming language can be considered safe if
>
> 1. the abstractions provided by the language can be trusted
>    - enforced and cannot be broken
>    - boolean always `true` or `false`, never `35` or `null`, independently of representation `0x00 / true`
> 2. programs have precise and well-defined semantics
>    - undefined behavior is source of trouble
> 3. the behavior of programs can be understood in a modular way

**Expansion.** A working definition of a safe language, with three conditions:

1. **Trustworthy abstractions**: a boolean is always `true` or `false`, never 35 or null, and the program cannot observe how it is represented in memory (whether `true` is `0x00` or anything else; Slide 29 develops this).
2. **Well-defined semantics**: every program has a defined meaning. C's **undefined behavior** (out-of-bounds access, signed overflow, null dereference) is the opposite: the compiler may assume it never happens, and if it happens anything can follow, including code that silently removes safety checks.
3. **Modular understanding**: the behavior of a module can be understood from its own code and the interfaces it uses, without knowing what every other module does to memory. In C, a bug anywhere can corrupt data anywhere.

The question mark in the title is honest: there is no single formal definition of "safe language"; the formal treatment (part 2) defines specific notions such as type safety.

### Slide 13 · unsafe → safe languages

> - oversimplistic
> - easier if data is immutable (no side-effects) as in functional languages

![Lecture 19, page 13](L19_p13.webp "50% 1400x522")

**Figure.** Language names placed along an axis. On the left: "machine code", "C", "MISRA-C", "C++"; in the middle: "Java", "Scala", "C#", "Rust"; on the right: "Haskell", "Clean", "ML", "OCaml", "Prolog". Under them: "more 'unsafe'" with an arrow to the left, "'safe'" in the middle, and "even more 'safe'" with an arrow to the right.

**Expansion.** A rough ranking: machine code and C give no guarantees, MISRA-C (a restricted subset of C for safety-critical systems, such as cars) removes the most dangerous features, and C++ adds abstractions but keeps C's unsafety. Java, Scala, C# and Rust are memory-safe and type-safe (Rust achieves it without a garbage collector, through its ownership system). Functional languages such as Haskell, Clean, ML and OCaml (and the logic language Prolog) go further, mainly because **immutable data** removes whole classes of problems: if data never changes after creation, there are no data races and no broken assumptions due to aliasing (Slides 38-41). The slide itself calls the picture **oversimplistic**: each language has unsafe corners (Java's JNI, C#'s `unsafe` blocks, Rust's `unsafe`, Haskell's `unsafePerformIO`), and safety has several dimensions (next slide).

### Slide 14 · dimensions and levels of safety

> memory safety, type safety, thread safety, arithmetic safety, non-null safety, aliasing safety, ...
>
> within each dimension, there can be (increasing) levels of safety
>
> - e.g., index of array out-of-bounds
>   1. let attacker inject arbitrary code
>   2. possibly crash program or corrupt data
>   3. definitely crash program
>   4. throw exception, caught by the program for graceful handling
>   5. ruled-out at compile-time

**Expansion.** Safety is not a yes/no property but a set of **dimensions** (memory, types, threads, arithmetic, null references, aliasing, ...), and in each of them there are **levels**. For an out-of-bounds array index the levels are:

1. **C without protections**: the write goes wherever the index points, and an attacker can inject code (Lecture 3).
2. **Partial protections** (canaries, ASLR; Lecture 8): the program may crash or silently corrupt data.
3. **Definite crash**: for example a guard page or a sanitizer that aborts the program; no code execution, but a denial of service.
4. **Exception** (Java, C#, Python): the out-of-bounds access throws an exception that the program can catch and handle gracefully.
5. **Ruled out at compile time**: the type system proves that every index is in bounds (dependent types, or languages and verifiers such as those of Lecture 7 that check array bounds statically), so the error can never happen at run time.

Each level is better than the previous one; security requires at least level 3, and level 5 is the ideal, at the price of more work for the programmer or the compiler.

### Slide 15 · Safety : how?

> Mechanisms to provide safety include
>
> - compile time checks (e.g., type checking)
> - run time checks (for array bounds, null pointers, runtime type checks, ...)
> - garbage collector for automated memory management (no need to `free()` dynamic memory)
> - execution engine
>   - in JVM, bytecode verifier to type-check code, runtime checks, garbage collector invoked periodically

**Expansion.** The four mechanisms that safe languages combine:

- **Compile-time checks**: the type checker rejects programs that could misuse data, at no runtime cost.
- **Run-time checks**: what cannot be decided at compile time (an index computed from input, a possibly-null reference, a downcast) is checked when the program runs.
- **Garbage collection**: memory is freed automatically only when no reference to it remains, which makes dangling pointers, use-after-free and double free impossible (Slide 21).
- **The execution engine**: in Java, the JVM's **bytecode verifier** re-checks types when code is loaded (so that hand-crafted or corrupted bytecode cannot bypass the compiler's checks), the JVM performs the run-time checks, and its garbage collector runs periodically.

### Slide 16 · Safety : how?

> Compiled binary runs on bare hardware
>
> Any defensive measures must be compiled into the code
>
> Execution engine isolates code from hardware
>
> The programming language is still "there" at runtime and the execution engine can provide checks at runtime

![Lecture 19, page 16](L19_p16.webp "50% 1400x432")

**Figure.** Two stacks side by side. On the left, "high level code" goes through a green arrow labelled "compiler" to "compiled binary", which sits directly on "hardware". On the right, "high level code" goes through the "compiler" to "lower level code (eg Java bytecode)", which runs on an "execution engine (eg Java VM)" that sits on "hardware".

**Expansion.** Two architectures. A **compiled** language such as C becomes machine code that runs directly on the hardware: whatever protection the program has must be in the generated code itself (bounds checks, canaries), and once the binary runs nothing else checks it. A **managed** language such as Java or C# compiles to an intermediate code (bytecode) executed by a virtual machine: the language's rules are still present at run time, because the VM verifies the code when it is loaded and performs checks while it runs, isolating the program from the hardware. This is what makes the Java sandbox possible: untrusted code can run inside the VM because the VM enforces the language's guarantees on it. The price is that the VM itself becomes part of the trusted computing base (Slide 26).

## Memory safety (pages 17-21)

### Slide 17 · Memory Safety

> A programming language is *memory-safe* if it guarantees that
>
> 1. programs can never access *unallocated* or *de-allocated* memory
>    - hence, no segmentation faults at runtime
>    - so: OS access control for memory not necessary (if there are no bugs in execution engine)
> 2. (maybe) programs can never access uninitialized memory
>    - so there is no need to zero-out memory before deallocating to avoid information leaks (if there ...)

**Expansion.** **Memory safety** means that every memory access touches memory that is allocated and belongs to the object being accessed:

1. No access to **unallocated** memory (out of bounds, random addresses) or **de-allocated** memory (dangling pointers). Consequences: no segmentation faults, and in principle no need for the OS to protect memory between components running in the same language runtime, which is how a JVM can run untrusted code in the same process as trusted code, provided the execution engine itself has no bugs.
2. (Sometimes included) no access to **uninitialized** memory: every variable and object is initialised before it can be read (Java zeroes every new object and requires local variables to be assigned before use). Then a program can never read leftovers of previous data, so there is no need to clear memory to prevent information leaks.

Memory safety is the property whose absence causes the largest share of serious vulnerabilities: Microsoft and Google have both reported that about 70% of the security bugs they fix in C and C++ code are memory-safety bugs, which is why governments and industry now push memory-safe languages.

### Slide 18 · Memory Safety

> Unsafe language features that can break memory-safety
>
> 1. unchecked array bounds
> 2. pointer arithmetic
> 3. null pointers (only when behavior is undefined)

**Expansion.** The three C features that let a program access memory it should not:

1. **Unchecked array bounds**: `a[i]` with `i` out of range reads or writes adjacent memory: the buffer overflow (Lecture 3).
2. **Pointer arithmetic**: `p + n` can point anywhere, and nothing checks that the result still points inside the same object.
3. **Null pointers**, *when dereferencing them is undefined behavior*: in Java, dereferencing `null` is defined to throw an exception, so it is safe; in C it is undefined, and the next slides show why this matters.

### Slide 19 · Pointers in C

> Folklore:
>
> - dereferencing a NULL pointer will crash the program
>
> but the C standard says
>
> - the result of dereferencing a null pointer is undefined
>
> so the program *may* crash but anything else may happen
>
> - (see CERT Secure Coding Guidelines for C for discussion on security vulnerability in PNG library caused a null pointer dereference that did not crash)

**Expansion.** Programmers often treat a null dereference as harmless, "it just crashes". The C standard says otherwise: the behavior is **undefined**, so the program may crash, but it may also do something else. Two reasons why it can be exploitable:

- On some systems address 0 is mapped (old kernels allowed user programs to map page 0, and some embedded systems have memory there), so the dereference reads or writes valid memory chosen by the attacker.
- If the code computes `p + offset` from a null `p`, the access goes to address `offset`, which can be anywhere. The CERT rule on null pointers (EXP34-C) describes exactly this in a version of the **libpng** library: a failed allocation returned NULL, the code wrote at NULL plus an attacker-influenced length, and on the affected device the write did not crash but overwrote memory.

Moreover, since the compiler may assume that a dereferenced pointer is not null, it may delete a later `if (p == NULL)` check as dead code, turning a defensive check into nothing.

### Slide 20 · From C standard: ISO/IEC 9899:2011

> *"If an invalid value has been assigned to the pointer, the behavior of the unary operator \* is undefined.<sup>102</sup>*
>
> *<sup>102</sup> Among the invalid values for dereferencing a pointer by the unary \* operator are a null pointer, [...]"*
>
> more from the standard
>
> *"A null-pointer constant is either an integral constant expression that evaluates to zero (such as `0` or `0L`) or a value of type `nullptr_t` (such as `nullptr`)."*

**Expansion.** The first quotation is from the C11 standard (ISO/IEC 9899:2011, §6.5.3.2 on the `*` operator and its footnote 102): dereferencing an invalid pointer, null included, is **undefined behavior**, not "a crash". The second defines what counts as a null pointer constant: the integer 0 (in any integer form, such as `0L`) or, in the newer wording, the constant `nullptr` of type `nullptr_t` (this wording comes from C++11, and C23 has adopted `nullptr` too). The point is that the null pointer is just a value like any other for the compiler, and nothing in the language prevents using it.

### Slide 21 · Memory Safety

> Unsafe language features that can break memory-safety
>
> 1. unchecked array bounds
> 2. pointer arithmetic
> 3. null pointers (only when behavior is undefined)
> 4. manual memory management
>    - de-allocation e.g., `free()` in C causing dangling pointers, use-after-free and double-free bugs
>    - can be avoided by
>      - not using the heap at all (in MISRA C)
>      - automating it with garbage collection
>        - first used in LISP in 1959, then accepted with Java in 1995

**Expansion.** The fourth unsafe feature is **manual memory management**. When the programmer calls `free()` explicitly, three bugs become possible: a **dangling pointer** (a pointer to freed memory), a **use-after-free** (using it: the memory may now belong to another object, possibly controlled by the attacker, a very common exploitation technique in browsers) and a **double free** (freeing twice, which corrupts the allocator's data structures). Two ways to avoid them:

- **No heap at all**: MISRA C forbids dynamic memory allocation, so all memory is static or on the stack. This is practical for small embedded systems, not for general software.
- **Garbage collection**: the runtime frees memory only when it is no longer reachable, so no reference can ever point to freed memory. Invented for LISP by John McCarthy in 1959, it entered the mainstream with Java in 1995.

A third way, not on the slide, is Rust's **ownership and borrowing**: the compiler tracks at compile time which part of the program owns each piece of memory and frees it when the owner goes out of scope, so dangling references are rejected without a garbage collector.

## Type safety (pages 22-33)

### Slide 22 · Types and type safety

> **TYPES** assert invariant properties of elements of a program
>
> - this variable will always hold an integer
> - this function will always return an object of class C
> - this array will never store more than 10 elements
>
> **Type checking** verifies these assertions and can be done
>
> - at compile time (static typing)
> - at runtime (dynamic typing)
>
> **Type soundness** (type-safety / strong typing) refers to a system that guarantees that the assertions hold at runtime

**Expansion.** A **type** is a promise about a program element that holds throughout the execution: this variable is always an integer, this function always returns a `C`, this array never has more than 10 elements (the last kind requires richer type systems than most languages have). **Type checking** verifies the promises, either before running the program (**static typing**, as in Java, C, Rust) or while running it (**dynamic typing**, as in Python or JavaScript, where each value carries its type and operations check it). **Type soundness** is the crucial property: the type system's promises really hold at run time for every program it accepts. Robin Milner's slogan sums it up: "well-typed programs cannot go wrong". C has static types but is not sound: a cast or a buffer overflow can make an `int` variable hold anything.

### Slide 23 · Type safety

> **Type-safe** programming languages guarantee that programs that pass the type-checker verification can only manipulate data in ways allowed by their type
>
> - *booleans* are not multiplied
> - *integers* are not dereferenced
> - references not the argument of square roots
> - in OO languages, never `Method_not_found` errors at runtime

**Expansion.** In a **type-safe** language every operation is applied only to data of the right type: no multiplication of booleans, no use of an integer as a pointer (which is how an attacker turns a number into a memory access), no square root of a reference, and, in object-oriented languages, no call of a method that the object does not have. The last example shows what type safety buys: if the type checker accepts the call `o.m()`, then at run time `o` really is an object that has a method `m`, so the program can never jump to a non-existent method, or to an attacker-chosen address in its place.

### Slide 24 · Memory and type safety

> Programming languages can be
>
> - memory-safe, typed and type safe
>   - Java, C#, Rust, Go, and functional languages such as Haskell, ML, Clean, F#
> - memory-safe and untyped
>   - LISP, Prolog, many interpreted languages
> - memory-unsafe, typed and type unsafe
>   - C, C++
>     - pointer arithmetic can break any guarantee by the type system
>     - impossible to ensure type safety without memory safety

**Expansion.** The two properties combine in three ways that occur in practice:

- **Memory-safe, typed and type-safe**: Java, C#, Rust, Go and the typed functional languages; the safest category.
- **Memory-safe but untyped** (or dynamically typed): LISP, Prolog, Python, JavaScript; memory cannot be corrupted, and type errors are caught at run time instead of compile time.
- **Memory-unsafe, typed but type-unsafe**: C and C++. They have types, but pointer arithmetic and unchecked accesses can write any bytes anywhere, so the types are just suggestions.

The last sub-bullet is the key dependency: **type safety requires memory safety**. If a program can overwrite arbitrary memory, it can overwrite a value of one type with bytes that the program will later read as another type, and every type guarantee is gone.

### Slide 25 · Buffer overflow in Java or C#

> Ruled-out at the language level by combination of
>
> - compile-time (static) type checking
>   - also at *load-time* by *bytecode verifier* (bcv)
> - runtime (dynamic) checks
>
> what runtime checks are performed during the execution of

```java
public class A extends Super{
  protected int[] d;
  private A next;
  public A() { d = new int[3] ; }
  public void m(int j) { d[0] = j ;}
  public setNext(Object s) {
     next = (A)s ;
  }
}
```

> runtime check for non-nullness of d and array bound
>
> runtime check for type downcast

**Code analysis.** The two annotations are next to `m` and next to `setNext` in the code.

- *What it does.* Class `A` has an integer array `d` (allocated with 3 elements by the constructor) and a reference `next` to another `A`. `m(j)` stores `j` in `d[0]`; `setNext(s)` receives any `Object` and stores it in `next` after a cast to `A`. (As written, `setNext` lacks a return type, `void`, which a Java compiler would reject.)
- *The runtime checks.* The compiler cannot know everything, so the JVM checks at run time:
  - for `d[0] = j`: that `d` is **not null** (a subclass or other code could have set it to `null`; otherwise a `NullPointerException` is thrown) and that the index 0 is **within the bounds** of the array (otherwise an `ArrayIndexOutOfBoundsException`);
  - for `(A)s`: that the object really is an `A` (or a subclass), the **downcast** check; otherwise a `ClassCastException` is thrown.
- *Why this rules out buffer overflows.* Static type checking (by the compiler and again by the bytecode verifier at load time) guarantees that `d` is an `int[]` and `next` an `A`; the dynamic checks cover what static types cannot: null, bounds and downcasts. Together they ensure that every access stays inside a real object of the right type. The cost is a few comparisons per access, which modern JIT compilers often remove when they can prove the check always succeeds.

### Slide 26 · Buffer overflow in Java or C#

> Buffer overflow can still be present
>
> - in native code
> - in C# in code blocks declared unsafe
> - through bugs in the Virtual Machine (VM) implementation (typically written in C++)
> - through bugs in the implementation of the type-checker or in the type system (*unsound*)
>
> The *VM* (along with the *bcv*) is part of the *Trusted Computing Base* (TCB) for both *memory and type safety*

**Expansion.** The guarantees of a safe language hold only inside the language. Buffer overflows can still appear:

- In **native code** called from the safe language (Java's JNI, C#'s P/Invoke, Python's C extensions): that code is C and has all of C's problems.
- In C# code explicitly marked **`unsafe`**, where pointers are allowed.
- In the **virtual machine** itself, usually written in C or C++: a bug in the JVM or in a JavaScript engine is a memory-safety bug that affects every program it runs, and it is the classic way to escape a browser sandbox.
- In the **type checker or the type system**: if the checker accepts a program it should reject, or if the type system itself is **unsound**, type confusion becomes possible (Slides 27-28).

Hence the VM and the bytecode verifier are part of the **trusted computing base** (TCB) of the safety guarantees: everything else can be untrusted, but these must be correct (the "small TCB" principle of Lecture 10).

### Slide 27 · How to break type safety?

> Type safety is not a robust property
>
> Data values and objects are just memory locations.
>
> If type confusion is created (e.g., by *having different references with different types referring to the same memory locations*), there can be NO type guarantees
>
> Attack on Java in Netscape 3.0
>
> `public class A[] { ... }`
>
> Netscape's Java execution engine confused this type with the type `array of A`
>
> **Input validation problem**: use of [ and ] in class names

**Expansion.** Type safety is **fragile**: at the bottom, all values are bytes in memory, and the guarantees hold only as long as every reference to a memory location has the right type. A single **type confusion**, two references of different types to the same location, breaks everything: through a reference of type `int` the attacker writes a number, through the other reference of type "object" the program uses it as a pointer, so the attacker can read and write arbitrary memory. The historical example is an attack on Netscape Navigator 3.0 (1996, found by Princeton's Secure Internet Programming group): an applet could define a class whose *name* was `A[]`, and the browser's JVM confused that class with the real array type "array of `A`". The root cause was an **input validation** failure (Lecture 5): the VM did not reject `[` and `]` in class names, characters that have a special meaning in internal type names.

### Slide 28 · Another type confusion attack

```java
public class A {
...
  public Object x;
...
}
```

```java
public class A {
  public int x;
...
}

public class B {
  void setX(A a) {
     a.x = 12 ;
  }
}
```

> What happens if B is compiled against A but run against A?
>
> *Pointer arithmetic*!
>
> If JVM allowed binary incompatible classes to be loaded, the type system would break

**Code analysis.** On the slide the first version of `A` (with `public Object x`) is in blue and the second (with `public int x`) in green; the question reads "compiled against A (green) but run against A (blue)".

- *The scenario.* `B` is compiled against the version of `A` in which `x` is an `int`, so `a.x = 12` is a correct assignment of an integer. At run time, however, the other version of `A` is loaded, in which `x` is a reference (`Object`).
- *The attack.* If the JVM ran `B` without checking, the assignment would store the integer 12 into a field that the rest of the program uses as a reference: an arbitrary number becomes a pointer, which is "pointer arithmetic" in a language that forbids it. An attacker who controls the number controls where the reference points, and can read or write any memory through it.
- *The defence.* The JVM must refuse to link **binary-incompatible** classes: when `B` is linked, the JVM resolves the field `A.x` by name *and* type descriptor (`I` for int), finds that the loaded `A` has `x` of type `Object`, and throws an error (`NoSuchFieldError`) instead of running the code. This check is part of the bytecode verification and linking that make the JVM part of the TCB (Slide 26).

### Slide 29 · How to know a type system is sound?

> Representation independence (for booleans)
>
> - no difference if `true` is represented as `0` and `false` as `1` (or `FF`) or viceversa
>   - given program with either representation guaranteed to produce same result
> - test for it or prove it
>   - given formal definition of language, prove that the representation of `true/false` has no effect on any program
> - similar properties should hold for all datatypes

**Expansion.** One way to check that a type is a real abstraction is **representation independence**: if no program can tell how booleans are represented in memory (whether `true` is 0, 1 or `0xFF`), then programs can only use booleans as booleans, and the abstraction cannot be broken. This can be **tested** (run programs with different representations and compare the results) or, better, **proved** from a formal definition of the language. In C it fails immediately: a program can cast a boolean to an integer, or inspect its bytes through a `char *`, and see its representation. The same idea extends to every data type: a type-safe language hides the representation of all its values.

### Slide 30 · How to know a type system is sound?

> Give two formal definitions of the programming language
>
> - a *typed* operational semantics, which records and checks type information at runtime
> - an *untyped* operational semantics which does not
>
> and prove their equivalence for all *well-typed* programs
>
> in other words, prove the equivalence of
>
> - a defensive execution engine (which records and checks all type information at runtime) and
> - a normal execution engine which does not
>
> for any program accepted by the type checker

**Expansion.** A second, more general proof technique. Define two interpreters of the language: a **defensive** one, which keeps the type of every value at run time and stops with an error whenever an operation is applied to the wrong type, and a **normal** one, which keeps no types and just executes (like real hardware). Then prove that, for every program that **passes the type checker**, the two behave identically. If they do, the defensive checks never fail on well-typed programs, so they are unnecessary: the static type checker has already ruled out every type error. This is what "the type system is sound" means formally, and it is the basis of the type-safety theorem of part 2 (Lecture 19 part 2, Slides 32-34).

### Slide 31 · Ongoing evolution to richer type systems

> Many ways to enrich type systems (further)
>
> - distinguish non-null and possibly-null types **`public @nonNull String hello = "hello";`** to
>   - improve efficiency
>   - prevent null pointer bugs or catch them earlier, at compile time
> - alias control to restrict interferences due to 'double names'
> - information flow to control the way tainted information flows through

**Expansion.** Research and industry keep adding more guarantees to type systems:

- **Non-null types**: a type that excludes `null` (through annotations such as `@NonNull` in Java checkers, or directly in the language, as in Kotlin, Swift and C# 8's nullable reference types). The compiler then rejects code that might dereference a possibly-null value, catching null-pointer bugs at compile time, and the runtime can skip the null checks for non-null references (efficiency).
- **Alias control**: types that limit how many references to an object can exist and who may modify it, reducing interference through "double names" (Slides 39-41). Rust's ownership and borrowing is the most successful example.
- **Information flow types**: types that track whether data is secret or tainted and prevent it from flowing to the wrong place (Lecture 20).

### Slide 32 · Other language-based guarantees

> - visibility : `public, private`, etc
> - immutability
>   - of primitive values (constants)
>     - in Java: **`final int i = 4;`**
>     - in C(++): **const int `BUFF_SIZE=128;`**
>       - meaning of const confusing for C(++) pointers and objects!
>   - of objects
>     - in Java, **String** objects are constant

**Expansion.** Two further guarantees that languages offer:

- **Visibility**: `private` fields and methods cannot be accessed from other classes, and the guarantee is enforced (by the compiler and by the JVM at run time), so it can protect an object's internal state from untrusted code in the same program.
- **Immutability**: a value or object that cannot change after creation. For constants, Java's `final` and C's `const` prevent reassignment. In C and C++, `const` is confusing for pointers: `const char *p` is a pointer to constant characters, `char * const p` a constant pointer to modifiable characters, and `const` can be cast away. In Java, `String` objects are immutable, which makes them safe to share between threads and to use for security decisions (Slide 41).

### Slide 33 · Safe arithmetic

> What happens if `i=i+1;` overflows ?
>
> 1. *Unsafest approach*: leaving this as an undefined behavior (as in C and C++)
> 2. *Safer approach*: specify how over/under flow behaves (as in Java and C#)
> 3. *Safer still:* integer overflow results in an exception (as in checked mode in C#)
> 4. *Safest approach:* have infinite precision integers and reals, so that overflow never happens (in some experimental functional languages)

**Expansion.** Arithmetic safety in four levels:

1. In C and C++, **signed** overflow is undefined behavior: the compiler may assume it never happens and, for example, remove an overflow check written as `if (i + 1 < i)` (unsigned overflow is defined and wraps around).
2. Java and C# **define** overflow: integers wrap around in two's complement. The behavior is predictable, but a wrapped value is still wrong, and integer overflows still lead to vulnerabilities, for example an undersized allocation (Lecture 8, Slides 30-33).
3. C#'s **checked** mode throws an `OverflowException` instead of wrapping (Java offers `Math.addExact` and similar methods; Rust panics in debug builds; Solidity since version 0.8 reverts the transaction, Lecture 16, Slide 15).
4. **Arbitrary-precision** integers never overflow: they grow as needed (Python's integers, Haskell's `Integer`, Lisp's bignums, so not only experimental languages), at the cost of speed. Reals cannot be stored exactly with finite memory, so "infinite precision reals" remain a research topic.

## Thread safety and aliasing (pages 34-42)

### Slide 34 · (Lack of) thread safety

> Two concurrent execution threads executing the same statement
>
> `x = x+1;`
>
> at the end, x can have value 2 or 1
>
> Cause: data race since `x = x+1;` is **not** an atomic operation, but consists of two steps which may be interleaved in unexpected ways
>
> (and can cause security problems ...)

**Expansion.** The race condition of Lecture 11 at the level of a single statement. Starting from `x = 0`, two threads both execute `x = x+1`. The statement is not atomic: each thread **reads** `x`, then **writes** the incremented value. If the steps interleave as "thread 1 reads 0, thread 2 reads 0, thread 1 writes 1, thread 2 writes 1", one increment is lost and the result is 1 instead of 2. Even a memory-safe and type-safe language allows this, because the problem is not memory corruption but an unexpected interleaving. It becomes a security problem when the shared value is a balance, a reference counter or a permission check (the TOCTOU attacks of Lecture 11).

### Slides 35-36 · Multi-threading behavior in Java

```java
class A {
  private int i;
  A() {i=4;}
  int geti() {return i;}
}
```

> Can `geti()` ever return something different that 4 ?
>
> **Thread 1** initializing `x`: `static A x = new A();`
>
> **Thread 2** accessing `x`: `j = x.geti();`
>
> Execution of thread 1 takes 3 steps
>
> 1. allocate `new object m`
> 2. `m.i = 4;`
> 3. `x = m;`
>
> compiler or VM can swap 2. and 3. since independent
>
> Hence in thread 2, `x.geti();` can return 0 instead of 4

Page 35 asks the question; page 36 adds the explanation from "Execution of thread 1 takes 3 steps".

**Code analysis.** A surprising result of the Java memory model.

- *The code.* `A`'s constructor sets the private field `i` to 4, and `geti()` returns it. Thread 1 creates an `A` and publishes it in the shared static field `x`; thread 2 reads `x` and calls `geti()`. It seems that `geti()` can only return 4, since `i` is set in the constructor.
- *Why it can return 0.* `new A()` is three steps: allocate the object (fields zeroed, so `i` is 0), run the constructor (`m.i = 4`), store the reference (`x = m`). Steps 2 and 3 write to different locations, so for a single thread their order does not matter, and the compiler, the JIT or the CPU may **reorder** them. Thread 2 can then see the reference in `x` *before* the constructor's write to `i` is visible, and `geti()` returns 0: a partially constructed object.
- *Why it matters for security.* If `A` were a security object (a permission set, a validated path), another thread could observe it in an inconsistent state, before its invariants hold.
- *Fix.* Publish the object safely: make `x` `volatile`, synchronize the accesses (Lecture 11, Slides 7-9), or make the field `final` (next slide).

### Slide 37 · (Lack of) thread safety

```java
class A {
  private final int i;
  A() {i=4;}
  int geti() {return i;}
}
```

> Now `geti()` always returns 4
>
> Declaring a private field as **`final`** fixes this particular problem (because of ad-hoc restrictions on the initialization of final fields)
>
> only since the revision (2004) of Java Memory Model, which specifies how compilers and VM can deal with concurrency
>
> API implementation of **`String`** was fixed only in Java 2 (aka 1.5)

**Code analysis.** With `final`, the Java memory model (revised by JSR-133, included in J2SE 5.0, version 1.5, of 2004) gives a special guarantee: a thread that obtains a reference to an object *after* its constructor has finished sees the correct values of all its `final` fields, so `geti()` always returns 4. Before that revision the guarantee did not exist, and even `String`, whose characters are stored in a `final` array, could be seen by another thread with the wrong contents: a string checked as `"/tmp"` could appear to another thread as a different value, a serious problem for code that uses strings in security checks. The lesson is the slide's "ad-hoc": `final` fixes this particular case, but publishing objects through data races remains dangerous for non-final fields.

### Slide 38 · Data races and thread safety

> - a program contains a data race if two threads simultaneously access (not in read only) the same variable
> - **thread-safety** = the behavior of a program consisting of several threads can be understood as interleaving of those thread
> - in Java, the semantics of programs with data races is effectively undefined, so only programs without data races are thread-safe
> - MORAL: even "safe" programming languages can sport weird behavior in presence of concurrency

**Expansion.** Definitions: a **data race** occurs when two threads access the same variable at the same time, at least one of them writing, without synchronisation. A program is **thread-safe** if its behavior can be explained as some **interleaving** of the steps of its threads (sequential consistency). Java guarantees this only for programs without data races ("data-race-free programs are sequentially consistent"); for racy programs, reorderings like that of Slide 36 produce behaviors that no interleaving explains. Java, unlike C and C++, still keeps racy programs memory-safe, but their behavior is very hard to predict. The moral: even safe languages are not safe from concurrency bugs. Some languages remove data races by construction: Rust's type system rejects code that shares mutable data between threads without a lock.

### Slide 39 · Typing breaks in C, Java, C# ...

> Dangerous combinations: aliasing & mutation
>
> threads or objects A and B both have references to a mutable object `shared`
>
> this can cause many problems, not just with concurrency
>
> 1. in concurrent (multi-threaded) context: data races
>    - locking objects (as with `synchronized` in Java) can help but is expensive and risks deadlock
> 2. in single-threaded context: dangling pointers
>    - who is responsible for free-ing `shared`? A or B ?
> 3. in single-threaded context: broken assumptions
>    - if A changes the `shared` object, B's assumptions about shared may not hold and B's code broken

![Lecture 19, page 39](L19_p39.webp "35% 631x219")

**Figure.** Two green circles, **A** and **B**, each with an arrow to the same green box, "SomeObject shared".

**Expansion.** **Aliasing** (two references to the same object) is harmless if the object never changes, and **mutation** is harmless if only one reference exists; the combination is what causes trouble:

1. **Data races** in concurrent programs (Slides 34-38). Locks (`synchronized`) prevent them but cost time and can cause **deadlocks**.
2. **Dangling pointers** in languages with manual memory management: if A frees `shared` while B still uses it, B accesses freed memory (Slide 21). Who owns the object, and so who frees it, must be decided.
3. **Broken assumptions** even in a single thread: B checks a property of `shared` (for example that a path is in an allowed directory), then A modifies it, and B continues relying on a check that no longer holds; the same TOCTOU pattern as Lecture 11, without any concurrency.

Rust's type system attacks exactly this combination: at any time an object can have either many read-only references or a single mutable one, never both.

### Slide 40 · Danger of references to mutable data

> In multi-threaded programs, references to mutable data structures can be a problem, since referenced data can change even in safe languages (like Java or C#)

```java
public void f(char[] x) {
    if (x[0] != 'a' {throw new Exception();}
    // cannot assume first element is 'a'
    ...
}
```

> Another thread with reference to `x` can change the content of the array at any moment, also just after the if-statement has been executed

**Code analysis.** (The `if` condition on the slide is missing its closing parenthesis.)

- *What it does.* `f` checks that the first character of the array is `'a'` and throws an exception otherwise, then continues assuming the check passed.
- *The problem.* `x` is a reference to a **mutable** array that the caller (or another thread) still holds. Between the check and the use, another thread can change `x[0]`, so the code after the `if` cannot assume anything: a time-of-check-to-time-of-use race in a memory-safe language (Lecture 11).
- *Fix.* Make a **defensive copy** first (`char[] c = x.clone();`) and work only on the copy, or take an immutable type as parameter (next slide). Defensive copying of mutable inputs is a standard rule of secure Java coding, especially for security checks.

### Slide 41 · References to immutable data less dangerous

> In multi-threaded programs, references to immutable data structures are safer

```java
public void g(String x) {
    if (x.charAt(0) != 'a' {throw new Exception();}
    // can assume here that first character is 'a'
    ...
}
```

> Another thread with a reference to the same string x cannot change the content of the array (value of the string) since Java strings are immutable

**Code analysis.** The same check on a `String` (again with a missing parenthesis on the slide). Java strings are **immutable**: once created, their contents can never change, so after the check the code can safely assume that the first character is `'a'`, whatever other threads do with their references to the same string. This is why security-sensitive Java APIs take `String` rather than `char[]` for file names, URLs and class names, and why immutability is one of the most effective tools against both concurrency bugs and TOCTOU problems. (The guarantee depends on the `final` semantics of Slide 37.)

### Slide 42 · "Secure" programming languages

> - Languages like Java and .NET can provide security guarantees in the presence of untrusted code
> - the languages can guarantee restrictions on the possible interactions between different modules by using a combination of
>   - typing
>   - visibility
> - enforced by a combination of static and runtime checks
>   - static checks at load-time rather than at compile-time

**Expansion.** The conclusion: languages like Java and C# can run **untrusted code** in the same process as trusted code, because the language itself restricts how modules interact. **Typing** prevents forging references or misusing objects, and **visibility** prevents access to private state; together they let a trusted library hand out references to its objects without fear. The checks are partly static and partly at run time, and the static ones are done again **at load time** by the verifier, because untrusted code arrives as bytecode that may not come from a correct compiler. This is the principle behind the Java and .NET security models, and today behind WebAssembly, which runs untrusted code in browsers with a verifier and a sandbox. Its weak point is the one of Slide 26: the guarantees are only as strong as the verifier and the virtual machine that enforce them.
