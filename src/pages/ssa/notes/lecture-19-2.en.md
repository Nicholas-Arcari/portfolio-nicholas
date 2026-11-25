The second deck of Lecture 19 makes the notion of **type safety** precise. It starts from types in C: what a type is, why compilers need types, which "bad" programs types can reject, and why C, although typed, is not type-safe (the `scanf` buffer overflow and unsafe casts), with the distinction between untyped, weakly typed and strongly typed languages. It then defines a tiny strongly typed language, **Mini-C**, and gives it a formal **operational semantics** (reduction rules for expressions and commands, in which unsafe operations simply have no rule) and a **type system** (typing rules for expressions, commands and memories), with a complete typing derivation for the factorial program. The deck ends with the **type-safety theorem** (a well-typed program in a well-typed memory never gets stuck) and with other properties that richer type systems can enforce. The slide deck has 36 pages.

## Types and type safety in C (pages 1-15)

### Slide 1 · Title slide

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

**Expansion.** Language-based security moves the protection from the running system to the **language and its compiler**: if the language is designed so that insecure programs cannot be written, or are rejected at compile time, then no testing or run-time monitoring is needed to exclude them. Since the compiler does not run the program, the guarantee covers *all* executions, not only the tested ones. The insecurities on the list each have a type-based answer: buffer overflows are excluded by memory- and type-safe languages (this deck and Lecture 19), information-flow leaks by security types (Lecture 20), violations of access rights by type systems that include authorization (Slide 36). This deck is the formal counterpart of Slides 22-30 of the first part of Lecture 19 (types, type safety and how to know that a type system is sound).

### Slide 3 · TYPES: Overview

> A *type* is a *specification* of data or code in a program
>
> Examples from C:
>
> - Basic types
>   - `int, char, float, double, void`
>   - `int x;` --- variable x will store an integer
> - Function types
>   - `int -> double, …`
>   - `int factorial(int);` --- factorial is a function that takes an integer as an argument and returns an integer (type `int -> int`)

**Expansion.** A type is a **specification**: it says what kind of values a variable may hold, or what a piece of code expects and returns, and the compiler checks that every use agrees with it. For functions the type is written `argument -> result`: `factorial` has type `int -> int`, so `factorial(3)` is an `int` and `factorial("abc")` is a type error. `int -> double` is the type of any function from integers to doubles. (C does not use the arrow notation in its syntax; the arrow is the standard notation of type theory, used in languages such as ML and Haskell.)

### Slide 4 · TYPES: Overview

> - Structures types
>   - `struct pair {int x; int y;};`
> - Array types
>   - `int[n], char[n][m], ...`
>   - `int arr[8];` --- variable `arr` stores sequence of 8 integers
> - Pointer types
>   - `int*, int**, ...`
>   - `int* p;` --- variable p stores the address of a variable that stores an integer
>   - `int** p;` --- variable p stores the address of a variable that stores the address of a variable that stores an integer

**Expansion.** Compound types are built from simpler ones: **structures** group fields of different types, **arrays** are sequences of a fixed number of elements of the same type, **pointers** hold addresses of values of a given type (and pointers to pointers hold addresses of pointers). Note that the length of an array is part of its type (`int[8]`), but C forgets it very easily: an array passed to a function becomes a pointer to its first element, and its length is lost. This is exactly the problem of the `scanf` example on Slides 10-11.

### Slide 5 · Type-correct program

```c
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
```

**Code analysis.** On the slide the code is on the left and the type annotations, aligned with each line, on the right (the comment `//f: int` sits between the closing brace of the loop and `return f;`).

- *What it does.* `main` reads an integer `v`, computes `factorial(v)` with a loop that multiplies `f` by `c` for `c` from 1 to `n`, and writes the result.
- *The types.* Every element of the program has a type, and the comments make them explicit: the functions (`readint: void -> int`, `writeint: int -> void`, `factorial: int -> int`, `main: void -> void`), the variables (`f`, `c`, `v`: `int`), the condition (`c <= n` is a boolean; C itself represents it as an `int`, 0 or 1), even the operators, which are functions too (`*` takes two integers and returns an integer, `++` takes an integer and returns one).
- *Why it is type-correct.* Every use agrees with the specification: `readint()` returns an `int` that is assigned to an `int` variable, `factorial` receives an `int` and its result is passed to `writeint`, which expects an `int`.

### Slide 6 · Type-correct program

```c
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
```

**Code analysis.** The same program, with `main` changed; the changed code (`string s;`, `s = readint();` and `factorial(s)`) is in red on the slide, and the words "**error**" and "**no type**" in the comments are in bold.

- *What changed.* `v` is now a variable `s` of type `string` (C has no built-in `string` type; the example is pseudo-C, as in C++ or Java).
- *The type errors.* `s = readint()` assigns an `int` to a `string` variable: the types of the two sides do not match, an error. `factorial(s)` passes a `string` where `factorial` expects an `int`, so the expression has **no type** at all, and neither does `writeint(factorial(s))`.
- *The point.* The compiler finds both errors by looking at the types, without running the program, and rejects it. If it were compiled anyway, the bits of an integer would be treated as a string (or vice versa), and the behavior would be unpredictable.

### Slide 7 · Why types? Compilation

> Types are *necessary* to compile source code
>
> - What is the binary representation of variables?
>   - `int x;` --- `x` is 4 bytes
>   - `char x;` --- `x` is 1 byte
>   - `int arr[8];` --- `arr` is 32 bytes
> - How to compute in assembly?
>   - `int x; int y; x + y` → `add r1,r2`
>   - `float x; float y; x + y` → `fadd r1,r2`
>   - Difference is based on types

**Expansion.** The first, practical reason for types: the compiler needs them to generate code. It must know how much memory each variable takes (an `int` is 4 bytes on the usual platforms, although the C standard only requires at least 16 bits; an array of 8 `int`s is 8 × 4 = 32 bytes) and which machine instructions to use: the same `+` becomes an integer addition (`add`) for `int`s and a floating-point addition (`fadd`, executed by a different unit, on a different bit representation) for `float`s. Without types, the same source would not determine the machine code.

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

**Expansion.** The second reason, the one that matters for security: **type checking** guarantees statically that data and code are used only as their types specify. The first two items are what ordinary type systems do (Slide 6 was an example). The others need richer types: **null-pointer exceptions** are prevented by types that distinguish references that can be null from those that cannot (Cyclone's never-NULL pointers, `Option` in Rust, nullable types in Kotlin); **array overflows** by types that carry the length (dependent types, as in DML, Slide 36); **leaks of secret information** by security types (the information-flow type system of Lecture 20).

### Slide 9 · Type safety definitions

> - A *program* is called *safe* if it is not stuck and has not crashed
> - A *language* is called *type-safe* if well-typed programs always remain safe
> - Presence of types does not imply type-safety
>   - e.g., C has types but is not type-safe

**Expansion.** The key definitions. A program is **stuck** when it is in a state where the language does not say what happens next (adding a boolean to a number, reading outside an array): on a real machine, the hardware still does *something*, and that "something" is undefined behavior, which is where exploits live. A language is **type-safe** if the type checker is a guarantee: every program it accepts can never reach such a state. Milner's slogan (1978) is "well-typed programs cannot go wrong". C has types, but it accepts programs that go wrong (next slides), so its types do not give this guarantee. Slides 16-34 make these definitions formal for a small language.

### Slide 10 · Buffer overflow with scanf in C

```c
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
```

> This program is well-typed, but can crash with input longer than 7 bytes
>
> *C is not type-safe*

### Slide 11 · Buffer overflow with scanf in C - What is wrong?

```c
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
```

> Unbounded length of the array (type `char[]`)
>
> Buf has length 8 (type `char[8]`)
>
> `char[] != char[8]`
>
> This program should be rejected! However, C allows unsafe *type-casting* and accepts the program

**Code analysis.** The code of the two slides is identical; on Slide 11 the callout "Unbounded length of the array (type `char[]`)" points to the parameter `char str[]`, and the callout "Buf has length 8 (type `char[8]`)" points to the declaration `char buf[8];`.

- *What it does.* `readstring` reads a word from the standard input into the array it receives; `main` passes it an 8-byte buffer on the stack.
- *The vulnerability.* `scanf("%s", str)` copies characters until a whitespace, with no limit. `buf` holds 7 characters plus the terminating `'\0'`, so an input longer than 7 characters writes past the end of `buf`: a stack buffer overflow (Lecture 3). The type checker does not see it because the parameter `char str[]` has type "array of `char` of unknown length" (in fact, a `char *` pointer), and C silently converts `buf`, of type `char[8]`, to it: the length 8, which was part of the type, is lost in the conversion.
- *Exploit.* The bytes after `buf` include the saved frame pointer and the return address of `main`; a long input overwrites them, so at the return the program jumps to an address chosen by the attacker (classic stack smashing, Lecture 3).
- *Fix.* Limit the read to the size of the buffer, `scanf("%7s", str)`, or better pass the size explicitly and use `fgets(str, size, stdin)`. At the language level, the fix is a type system in which `char[8]` cannot be used as an unbounded `char[]`: that is what a type-safe language does (Java arrays carry their length and every access is checked; Cyclone uses "fat" pointers that carry the bounds).

### Slide 12 · Unsafe type-casting in C

> **Type-casting**: convert the type of a variable to another
>
> - The C compiler will convert types (e.g., from `char[8]` to `char[]`)
> - Some conversions violate type specifications
> - This makes C type-unsafe

**Expansion.** A **type cast** converts a value from one type to another, either implicitly (the compiler does it, as for `char[8]` to `char[]` on Slide 11) or explicitly with the syntax `(T) x`. Some casts convert the *value* (an `int` to a `float`, a number with the same meaning in a different representation); others just *reinterpret the bits*, telling the compiler to treat a memory location as something it is not (a `char *` as an `int *`, an integer as a pointer). Reinterpretations violate the type specifications, and a language that allows them cannot be type-safe.

### Slide 13 · Safe and Unsafe type cast in C

> | Type-cast | Safe in C? |
> | --- | --- |
> | `char* x; int* y = (int*) x` | No |
> | `int* x; void* y = (void*) x` | Yes |
> | `void* x; int* y = (int*) x` | No |
> | `int x; char* y = (char*) x` | No |
> | `char* x; int y = (int) x` | Yes |
> | `int x; float y = (float) x` | Yes |
> | `float x; int y = (int) x` | Yes |

**Expansion.** Row by row:

- `char*` to `int*`: **unsafe**. `x` may point to a single character (or to an address not aligned for an `int`); through `y` the program reads or writes 4 bytes there, outside the object.
- `int*` to `void*`: **safe**. `void*` is the generic pointer type: it only "forgets" the type and cannot be dereferenced without a further cast.
- `void*` to `int*`: **unsafe**. Nothing checks that the memory really contains an `int`; this is the cast that turns any pointer into any other (through `void*`).
- `int` to `char*`: **unsafe**. An arbitrary number becomes an address, the "integers used as pointers" of Slide 8: the program can then read or write anywhere.
- `char*` to `int`: considered **safe**, because it only reads the address as a number and does not give access to memory (on 64-bit platforms a pointer does not fit in an `int`, so the value is truncated, and compilers warn).
- `int` to `float` and `float` to `int`: **safe** in the sense of type safety, because they are value conversions: the result is a legal value of the new type (precision may be lost; a `float` too large for an `int` is, in C, undefined behavior).

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
> - Often allow unsafe casts, e.g., `char[8]` to `char[]` and int to `char*`
> - Program safety is programmer's responsibility: buffer overflows and segmentation faults are common in programs
>
> **Strongly typed languages use types for compilation and guarantee type-safety**
>
> - e.g., BASIC, Pascal, Cyclone, Haskell, SML, Java, etc.
> - No unsafe casts, e.g., an integer cannot be cast to a pointer, an array of length 8 is not an unbounded array, etc.
> - Safety is guaranteed but believed unsuitable for some low-level programs (debatable)

**Expansion.** The terminology "weak/strong typing" is informal and used differently by different authors; the precise notion is type safety (Slide 9). Two remarks on the classification of the slide:

- Perl and Ruby are better described as **dynamically typed**: they have no types in the source code, but their values carry a type at run time and operations check it, so a Ruby program cannot use an integer as a pointer (it raises an error instead). Bash is closer to untyped, since everything is a string.
- "Believed unsuitable for some low-level programs" refers to operating systems, drivers and embedded code, traditionally written in C because they need direct control over memory. The parenthesis "(debatable)" is now well supported: Rust is a type-safe (outside `unsafe` blocks) systems language used in the Linux and Windows kernels, and Cyclone was an earlier research attempt at a safe C.

### Slide 15 · Summary of types

> - Types are specifications of data and code
> - Compiler may check well-typedness without executing the program
> - Existence of type specifications may imply program safety (type-safety)
> - Not all languages with types are type-safe
>   - e.g., C is not type-safe
>
> Now we take a simple type-safe language and understand type-safety more formally

**Expansion.** The first half of the deck in four points. "May imply" is the important wording: types imply safety only if the type system is **sound**, and soundness is something to be proved. The rest of the deck shows how, on a language small enough to do it completely.

## Mini-C and its semantics (pages 16-25)

### Slide 16 · Mini-C: A strongly typed language

> ```text
> Types          T  ::=  int | bool
> Variables      x, y
> Declarations   Δ  ::=  x₁ : T₁; … ; xₙ : Tₙ
> Integers       n  ::=  … | -1 | 0 | 1 | …
> Expressions    e  ::=  x | true | false | n | e₁ + e₂ | e₁ * e₂ | e₁ <= e₂ | e₁ == e₂
> Commands       c  ::=  noop | x = e | c₁; c₂ | if e then c₁ else c₂ | while e do c
> Programs       P  ::=  decl Δ begin c end
> Values         v  ::=  true | false | n
> Stores         σ  ::=  x₁ ↦ v₁, … , xₙ ↦ vₙ
> ```
>
> No functions · No structures · No pointers · No casts

**Expansion.** The syntax of Mini-C, in BNF notation (`::=` "is defined as", `|` "or"):

- Two **types**, `int` and `bool`. **Declarations** Δ assign a type to each variable.
- **Expressions** are variables, the boolean constants, integer constants, and four operators: `+` and `*` on integers, `<=` and `==` comparisons.
- **Commands**: `noop` (do nothing, also the "finished" command), assignment, sequence, `if` and `while`.
- A **program** is a list of declarations followed by a command.
- **Values** are the results of expressions: booleans and integers. A **store** σ (the memory) maps variables to values.

The language deliberately leaves out functions, structures, pointers and casts: the features that make C unsafe (and that would make the proofs long). The integers are mathematical integers, so there is no overflow, and there is no division, so no division by zero: the only way for a Mini-C program to "go wrong" is to use a value with the wrong type, which is exactly what the type system will exclude.

### Slide 17 · Mini-C Factorial program

```text
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
```

**Code analysis.** On the slide a brace marks the declaration line as "Δ (Declarations)", a second brace marks the body from `begin` to `end` as "c (Commands)", and red circles around `c <= m`, `f * c;` and `c + 1` point to a callout "e (Expressions)".

- *What it does.* It computes 10! = 3 628 800: `f` accumulates the product, `c` goes from 1 to `m` = 10. Mini-C has no input/output, so the output is only a comment.
- *The structure.* The program has the form `decl Δ begin c end` of Slide 16: Δ is `f : int; c : int; m : int`, the command is a sequence of three assignments and a `while`, whose guard `c <= m` and right-hand sides `f * c` and `c + 1` are expressions. The body of the loop, `f = f * c; c = c + 1`, is a sequence of two commands (the `;` is the sequence operator, not a terminator).

### Slide 18 · Type safety through semantics

> - Semantics define safe program computation
> - Unsafe programs are those that cannot compute
> - Type-safety: A correctly typed program is never stuck
> - Game-plan:
>   - Describe semantics for Mini-C
>   - Describe typing for Mini-C
>   - Prove that typing => Not stuck (*Type-safety*)

**Expansion.** The approach (the "syntactic" method of Wright and Felleisen, 1994): first define the **operational semantics**, a set of rules that say how each construct executes, one step at a time. The rules only cover the *meaningful* cases; a state that is not finished and to which no rule applies is **stuck**, and stuck means unsafe by definition. Then define the **type system**, and finally prove that a well-typed program can never reach a stuck state. Slides 19-25 give the semantics, Slides 26-31 the typing, Slides 32-34 the theorem.

### Slide 19 · Semantic of expressions

> ```text
> Expressions   e  ::=  x | true | false | n | e₁ + e₂ | e₁ * e₂ | e₁ <= e₂ | e₁ == e₂
>
> Values        v  ::=  true | false | n
> ```
>
> - Expressions compute by evaluation to values
> - Formalized by a reduction relation:
>
> ```text
> σ ⊳ e ↪ e′
>
> Stores        σ  ::=  x₁ ↦ v₁, … , xₙ ↦ vₙ
> ```

**Expansion.** The judgement *σ ⊳ e ↪ e′* reads "in the store σ, the expression *e* reduces in one step to *e′*". Evaluation is a sequence of such steps, which ends when the expression has become a value. This is a **small-step** semantics: each rule describes one elementary step, so it is possible to talk about the state reached after any number of steps, which is what the definition of "stuck" needs.

### Slide 20 · Semantic of expressions

> - To evaluate a variable, read its value from memory
>
> ```text
> (x ↦ v) ∈ σ
> ───────────
>  σ ⊳ x ↪ v
> ```
>
> - To evaluate *(e₁ + e₂)*, first evaluate *e₁*, then evaluate *e₂*, and then **add** them
>
> ```text
>      σ ⊳ e₁ ↪ e₁′               σ ⊳ e₂ ↪ e₂′             add(n₁, n₂) = n
> ───────────────────────    ───────────────────────    ─────────────────
> σ ⊳ e₁ + e₂ ↪ e₁′ + e₂     σ ⊳ v₁ + e₂ ↪ v₁ + e₂′      σ ⊳ n₁ + n₂ ↪ n
> ```

**Expansion.** How to read a rule: if the **premises** above the line hold, the **conclusion** below holds.

- **Variable**: a variable reduces to the value it has in the store.
- **Addition**, three rules. The first reduces the left operand, one step at a time, as long as it is not a value. The second applies only when the left operand is already a value *v₁*, and reduces the right operand: together, the two rules fix the evaluation order, left to right. The third applies when both operands are numbers and replaces them with their sum (`add` is the mathematical addition).

For example, with σ = x ↦ 3: *σ ⊳ x + (1 + 1) ↪ 3 + (1 + 1) ↪ 3 + 2 ↪ 5*.

### Slide 21 · Semantic of expressions

> - Similar rules for other expressions
>
> **Important:** No rules to evaluate unsafe expressions like (true * 7)
>
> ```text
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
> ```

**Expansion.** The same three-rule pattern for `*`, `<=` and `==`: `mult` is the multiplication, `leq` and `eq` compare two numbers and produce a boolean *b*. The **important** remark is the heart of the method: the last rule of each row requires two *numbers* *n₁*, *n₂*, so an expression such as `true * 7` matches no rule. It does not "crash" or "do something undefined": it simply cannot continue, it is **stuck**. Note that `==` is defined only on numbers, so `true == true` is stuck too; the typing rule for `==` will accordingly require integer operands (Slide 28).

### Slide 22 · Semantic of commands

> ```text
> Commands   c  ::=  noop | x = e | c₁; c₂ | if e then c₁ else c₂ | while e do c
> ```
>
> - Commands compute to noop, but change memory
> - Formalized by a reduction relation
>
> ```text
> σ; c ⟶ σ′; c′
> ```
>
> - Starting from memory *σ*, command *c* reduces to command *c′* and updates memory to *σ′*

**Expansion.** For commands the state is a pair (store, command). A command is executed for its effect on the memory, so its reduction changes both: one step of *c* in σ leads to the remaining command *c′* in the updated store σ′. Execution ends when the remaining command is `noop`.

### Slide 23 · Semantic of commands

> - To evaluate *(x = e)*, first evaluate expression *e* to a value *v*. Then update memory by putting the value *v* in *x*
>
> ```text
>        σ ⊳ e ↪* v
> ──────────────────────────────
> σ; (x = e) ⟶ σ[x ↦ v]; noop
> ```
>
> - To evaluate *(c₁ ; c₂)*, first evaluate *c₁*, then evaluate *c₂*
>
> ```text
>      σ; c₁ ⟶ σ′; c₁′
> ───────────────────────────      ───────────────────────
> σ; (c₁; c₂) ⟶ σ′; (c₁′; c₂)      σ; (noop; c₂) ⟶ σ; c₂
> ```

**Expansion.**

- **Assignment**: *↪\** means "zero or more steps", so the premise says that *e* evaluates completely to a value *v*; the assignment then becomes `noop` and the store becomes *σ[x ↦ v]*, "σ with *x* now mapped to *v*".
- **Sequence**: as long as the first command is not finished, execute one step of it inside the sequence; when it has become `noop`, the second rule (which has no premises) drops it and continues with *c₂*.

### Slide 24 · Semantic of commands

> - Similar rules for other commands
>
> ```text
>           σ ⊳ e ↪* true                            σ ⊳ e ↪* false
> ─────────────────────────────────────    ─────────────────────────────────────
> σ; (if e then c₁ else c₂) ⟶ σ; c₁        σ; (if e then c₁ else c₂) ⟶ σ; c₂
>
>                σ ⊳ e ↪* true                             σ ⊳ e ↪* false
> ───────────────────────────────────────────    ──────────────────────────────
> σ; (while e do c) ⟶ σ; (c; (while e do c))     σ; (while e do c) ⟶ σ; noop
> ```
>
> **Important:** No rules to evaluate unsafe expressions like *(if 7 then c else c′)*

**Expansion.** The **if** command evaluates its guard and continues with one of the two branches. The **while** command is defined by unfolding: if the guard is true, it becomes "the body, then the same loop again"; if it is false, it becomes `noop`. Again, the guard must evaluate to `true` or `false`: a guard that is a number, as in `if 7 then c else c′`, matches no rule and is stuck. (In C, `if (7)` is legal, because any nonzero integer counts as true: Mini-C keeps `bool` and `int` apart.)

### Slide 25 · Summary of semantics

> - Semantics are rules for evaluating programs safely
> - Programs that cannot evaluate are unsafe by definition
> - Two types of reductions, for expressions and commands
>
> ```text
> σ ⊳ e ↪ e′          σ; c ⟶ σ′; c′
> ```

**Expansion.** The semantics turns "safe" into a precise, mathematical notion: a program is unsafe exactly when it can reach a state that is neither finished nor reducible. For Mini-C the only such states are the ones where an operator, a guard or a variable lookup receives something of the wrong kind (a boolean where a number is needed, a number where a boolean is needed, a variable missing from the store).

## Typing rules (pages 26-31)

### Slide 26 · Type checking

> ```text
> Declarations   Δ  ::=  x₁ : T₁; … ; xₙ : Tₙ
> ```
>
> - Typing for expressions
>
> ```text
> Δ ⊢ e : T
> ```
>
> - Typing for commands
>
> ```text
> Δ ⊢ c
> ```
>
> Important: A compiler can check efficiently whether a program is well typed or not

**Expansion.** Two typing judgements: *Δ ⊢ e : T* says that, with the declarations Δ, the expression *e* has type *T*; *Δ ⊢ c* says that the command *c* is well-typed (commands have no type, they are only well-typed or not). Type checking is **efficient** because the rules are **syntax-directed**: there is exactly one rule for each construct, so the checker visits the program once, in time proportional to its size. This is the crucial difference from the property it guarantees: whether a program can get stuck is undecidable in general (Rice's theorem, the same limit as for the program analyses of Lecture 7), while whether it is well-typed is decided by a simple, fast algorithm, at the price of rejecting some programs that would never get stuck.

### Slide 27 · Typing for expressions

> - To type check a variable, find its declaration
>
> ```text
> (x : T) ∈ Δ
> ───────────
>  Δ ⊢ x : T
> ```
>
> - Both true and false have type bool
>
> ```text
> ────────────────     ─────────────────
> Δ ⊢ true : bool      Δ ⊢ false : bool
> ```
>
> - A number has type int
>
> ```text
> ───────────
> Δ ⊢ n : int
> ```

**Expansion.** A variable has the type it is declared with; the constants have their obvious types. The rules for constants have no premises (an empty line above): they are **axioms**, true without conditions.

### Slide 28 · Typing for expressions

> - *(e₁ + e₂)* has type int if both *e₁* and *e₂* have type int
>
> ```text
> Δ ⊢ e₁ : int    Δ ⊢ e₂ : int
> ────────────────────────────
>      Δ ⊢ e₁ + e₂ : int
> ```
>
> - Other expressions are typed similarly
>
> ```text
> Δ ⊢ e₁ : int    Δ ⊢ e₂ : int        Δ ⊢ e₁ : int    Δ ⊢ e₂ : int
> ────────────────────────────        ────────────────────────────
>      Δ ⊢ e₁ * e₂ : int                  Δ ⊢ e₁ <= e₂ : bool
>
>                  Δ ⊢ e₁ : int    Δ ⊢ e₂ : int
>                  ────────────────────────────
>                      Δ ⊢ e₁ == e₂ : bool
> ```

**Expansion.** Each operator requires integer operands; the arithmetic operators produce an `int`, the comparisons a `bool`. These rules are the static counterpart of the reduction rules of Slides 20-21: exactly the expressions that the semantics can compute (numbers for `+`, `*`, `<=`, `==`) are the ones the type system accepts, so `true * 7` is rejected, because `true` does not have type `int`.

### Slide 29 · Typing for commands

> ```text
> Δ ⊢ c
> ```
>
> ```text
>               (x : T) ∈ Δ    Δ ⊢ e : T       Δ ⊢ c₁    Δ ⊢ c₂
> ────────      ────────────────────────       ────────────────
> Δ ⊢ noop             Δ ⊢ x = e                 Δ ⊢ c₁; c₂
>
> Δ ⊢ e : bool    Δ ⊢ c₁    Δ ⊢ c₂           Δ ⊢ e : bool    Δ ⊢ c
> ──────────────────────────────           ─────────────────────
>    Δ ⊢ if e then c₁ else c₂                Δ ⊢ while e do c
> ```

**Expansion.** `noop` is always well-typed. An **assignment** is well-typed if the variable is declared and the expression has the same type as the variable. A **sequence** is well-typed if both commands are. **if** and **while** require a guard of type `bool` and well-typed sub-commands: this excludes `if 7 then c else c′`, the stuck command of Slide 24.

### Slide 30 · Typing: example

> ```text
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
> ```

**Expansion.** A **typing derivation** is a tree of rule applications whose leaves are axioms and whose root is the judgement to prove; here, that the loop of the factorial program (Slide 17) is well-typed. On the slide each membership fact, such as *(f : int) ∈ Δ*, is drawn as an axiom (a line with nothing above), since it can be read directly from Δ.

- **D₁** proves that `f = f * c` is well-typed with the assignment rule: `f` is declared `int`, and `f * c` is an `int` by the `*` rule, whose premises are the variable rule for `f` and for `c`.
- **D₂** does the same for `c = c + 1`, using the axiom for the number `1`.
- **D** combines them: the `while` rule needs a `bool` guard (`c <= m`, by the `<=` rule) and a well-typed body, which is the sequence of the two assignments (sequence rule with D₁ and D₂ as premises, written as labels above them).

In the last tree the right premise of the sequence rule appears on the slide as "Δ ⊢ c = c ∗ 1": it is the conclusion of D₂, so it should read *Δ ⊢ c = c + 1*. The three initial assignments `m = 10; f = 1; c = 1;` are typed in the same way with the number axiom, and the whole program with the sequence rule.

### Slide 31 · Typing for memory

> - Typing for memory ensures that variables in memory hold values of expected type
>
> ```text
> Δ ⊢ σ
> ```
>
> if and only if
>
> ```text
> (x : int) ∈ Δ  implies  (x ↦ n) ∈ σ for some n
>
> (x : bool) ∈ Δ  implies  (x ↦ true) ∈ σ or (x ↦ false) ∈ σ
> ```

**Expansion.** The type-safety theorem is about running a program *from a memory*, so the memory must agree with the declarations: every variable declared `int` holds a number, every variable declared `bool` holds a boolean. Without this condition, a well-typed program could still get stuck: with Δ = x : int and σ = x ↦ true, the well-typed expression `x + 1` reduces to `true + 1`, which is stuck. The definition also requires every declared variable to *have* a value in σ, so the variable rule of Slide 20 never fails: in Mini-C there are no uninitialised variables.

## Type safety (pages 32-36)

### Slide 32 · Type safety

> Suppose
>
> - *c* is a well-typed command
> - *σ* is a well-typed memory
> - *σ; c →\* σ′; c′*
> - Then *c′* is not stuck, i.e., it is noop, or it can reduce further

**Expansion.** The statement of type safety in words: start a well-typed command in a well-typed memory and run it for any number of steps (*→\**, zero or more steps of ⟶); whatever command *c′* has been reached, it is not stuck: either it is `noop` (the program has finished) or some rule lets it make another step.

### Slide 33 · Type safety formally

> **Theorem** (Safety for commands). *Suppose the following holds:*
>
> 1. *Δ ⊢ c*
> 2. *Δ ⊢ σ*
> 3. *σ; c →\* σ′; c′*
>
> *Then either c′ = noop or there are σ″ and c″ such that σ′; c′ →\* σ″; c″*

**Expansion.** In the conclusion, the arrow should be a single step, *σ′; c′ ⟶ σ″; c″*: with *→\** it would be trivially true with zero steps. The standard proof splits the theorem into two lemmas, each proved by induction on the typing derivation (one case per rule):

- **Progress**: if *Δ ⊢ c* and *Δ ⊢ σ*, then *c* is `noop` or there is a step *σ; c ⟶ σ′; c′*. (For example, for `x = e`: since *e* has a type, it evaluates to a value of that type, and the assignment rule applies.)
- **Preservation**: if *Δ ⊢ c*, *Δ ⊢ σ* and *σ; c ⟶ σ′; c′*, then *Δ ⊢ c′* and *Δ ⊢ σ′*: a step keeps the command and the memory well-typed. (For an assignment, the new value has the declared type of the variable, so *σ[x ↦ v]* is still well-typed.)

The theorem follows by induction on the number of steps: preservation shows that every state reached is still well-typed, and progress that a well-typed state is never stuck. The two lemmas need the analogous ones for expressions.

### Slide 34 · Type safety

> - Why is this theorem "type-safety"?
> - Theorem says that a well-typed program will either terminate or keep reducing
> - By definition, such a program is safe
> - Therefore, a typed program always remains safe

**Expansion.** "Keep reducing" includes running forever: type safety does not promise termination (`while true do noop` is well-typed and never ends), only that the program never reaches a state the semantics does not define. Since unsafe was *defined* as stuck (Slide 18), the theorem is exactly the statement "the type checker guarantees safety". This is what C lacks: its type checker accepts programs, such as the `scanf` example, that reach undefined behavior.

### Slide 35 · Summary: types and type-safety

> - *Types* specify expected program behavior
> - Semantics define what safe behavior is
> - *Type-safety*: Typing => always follow semantics => always safe behavior
> - *Reminder*: Not all typed languages are type-safe

**Expansion.** The three ingredients and how they fit: the **types** (checked statically, cheaply), the **semantics** (which defines safe behavior), and the **type-safety theorem** that connects them. For a real language the proof is much longer (Java's type safety was studied formally in the late 1990s, and flaws were found both in the language specification and in the bytecode verifier, as discussed in the first part of Lecture 19), but the structure is the same.

### Slide 36 · What else types can do

> - Prevent null-pointer dereferencing and dangling pointers (e.g., Cyclone)
> - Enforce array bounds (e.g., DML)
> - Prevent information leaks (e.g., Jif, Sif)
> - Enforce access control (e.g., PCML5, Aura, PCAL)
> - Ensure correctness of protocols (e.g., F7)

**Expansion.** Richer type systems enforce richer security properties, with the same "check statically, prove sound once" approach:

- **Cyclone** (AT&T Labs and Cornell, around 2002), a safe dialect of C: never-NULL pointer types, "fat" pointers with bounds, and region-based memory management, which rejects pointers that could outlive the memory they point to.
- **DML** (Dependent ML, Xi and Pfenning): types that mention values, such as "array of length *n*" and "integer smaller than *n*", so that array bounds checks can be verified at compile time and removed.
- **Jif** and **Sif**: information-flow types (Lecture 20), Sif applying Jif's labels to web applications built with Java servlets.
- **PCML5**, **Aura** and **PCAL**: type systems that include an authorization logic, so that the code can access a resource only if it holds a proof that the access is allowed by the policy.
- **F7** (Microsoft Research): refinement types for F#, used to verify that implementations of cryptographic protocols satisfy security properties such as authentication.
