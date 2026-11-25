const e=`Lecture 2 checks the prerequisites with small C and Java snippets (each hiding a security bug), tells Ken Thompson's "Trusting Trust" story, and fixes the basic vocabulary: bug, vulnerability, exploit, threat, malware, countermeasures. The slide deck has 27 pages.

## Prerequisites and sample code (pages 1-5)

### Slide 1 · Title slide

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
>   - eg. \`malloc()\`, \`free()\`, \`*(p++)\`, \`strings\` in C using \`char*\`
> - Java
>   - eg. public, final, private, protected
> - Bits of PHP and javascript

**Expansion.** A quick refresher of the notions listed, since every attack in the course builds on them.

- \`malloc(n)\` reserves n bytes on the **heap** and returns a pointer to them, or \`NULL\` on failure; the memory is not initialised. \`free(p)\` gives the block back to the allocator. Using \`p\` after \`free\` is a *use-after-free*, calling \`free\` twice on it is a *double free*: both are exploitable memory-corruption bugs.
- \`*(p++)\` reads the element \`p\` points to and then advances \`p\` to the next element (post-increment returns the old value). It is the idiom behind the classic string copy loop \`while ((*d++ = *s++) != '\\0');\`, which copies until the terminator and never checks the size of the destination: the essence of a buffer overflow.
- **Strings in C** are arrays of \`char\` terminated by the NUL byte \`'\\0'\`; a \`char*\` points to the first character. The length is stored nowhere: functions find the end by scanning for \`'\\0'\`. Hence \`strlen("abc")\` is 3 but the string occupies 4 bytes. Forgetting that extra byte, or the terminator itself, causes countless overflows (next slide).
- **Java modifiers.** \`private\`: visible only inside the class; no modifier (package-private): inside the same package; \`protected\`: same package plus subclasses; \`public\`: everywhere. \`final\` on a class forbids subclassing, on a method forbids overriding, on a field forbids reassignment after initialisation (the referenced object may still be mutable). They are the basis of encapsulation and of language-based security.
- **PHP and JavaScript** are needed for web vulnerabilities (SQL injection, XSS); **OS and DB** basics for process memory layout, system calls, users and permissions, and SQL queries.

### Slide 3 · Sample C Code

The code on the slide:

\`\`\`c
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
\`\`\`

**Code analysis.** The slide is presented as a check of C skills, but both functions contain textbook security bugs.

*Function 1, \`copying_a_string\`*: intended to return a heap copy of the string \`a\`.

- **Off-by-one heap overflow.** \`strlen(a)\` counts the characters *without* the terminating \`'\\0'\`, but \`strcpy\` copies them *plus* the terminator. So \`strlen(a) + 1\` bytes are written into a block of \`strlen(a)\` bytes, and the \`'\\0'\` lands one byte past the end of the heap block. Example: with \`a = "hello"\`, \`malloc(5)\` is called but \`strcpy\` writes 6 bytes.
- **Why a single byte matters.** Heap allocators keep their metadata right next to user data. With glibc on x86-64, a request such as 24 bytes leaves no slack, so the stray NUL overwrites the lowest byte of the next chunk's size field. This *poison null byte* technique makes the allocator miscalculate chunk sizes, produce overlapping chunks and eventually hand out memory that overlaps live objects: a one-byte overflow can end in code execution. For other sizes the byte falls into alignment padding and nothing visible happens, which is exactly why such bugs survive testing.
- **Unchecked \`malloc\`.** If the allocation fails, \`malloc\` returns \`NULL\` and \`strcpy(NULL, a)\` crashes: a denial of service.
- **No check on \`a\`**: \`strlen(NULL)\` crashes too.
- **Ownership**: the caller must \`free\` the result, otherwise memory leaks, a slow denial of service in long-running servers.

Fixed version:

\`\`\`c
#include <stdlib.h>
#include <string.h>

char *copying_a_string(const char *a) {
    if (a == NULL)
        return NULL;
    size_t len = strlen(a);
    char *b = malloc(len + 1);          /* +1 for the terminating '\\0' */
    if (b == NULL)
        return NULL;                     /* allocation failed: report it */
    memcpy(b, a, len + 1);               /* copies the terminator as well */
    return b;                            /* the caller must free(b) */
}
\`\`\`

The POSIX function \`strdup(a)\`, also standard C since C23, does exactly this.

*Function 2, \`using_pointer_arithmetic\`*: intended to add up the four digits of a PIN.

- **Out-of-bounds read.** In C an array parameter \`int pin[]\` is just a pointer (\`int *pin\`): the function has no way to know how many elements the caller's array really has, yet the loop blindly reads four integers. If the caller passes a shorter array (a 3-digit PIN, or a PIN parsed from user input), the function reads beyond its end. This is undefined behaviour; in practice it reads whatever lies next in memory (other variables, possibly secrets): an *information leak*, the same kind of bug as Heartbleed.
- **Magic number 4**: the size is hard-coded instead of being passed by the caller.
- **Pointer arithmetic**: \`pointer++\` advances by \`sizeof(int)\` bytes, which is correct here, but pointer arithmetic is never bounds-checked and easy to get wrong.
- **Integer overflow** of \`sum\` is possible if the values are not small digits, and a \`NULL\` argument crashes the function.

Fixed version:

\`\`\`c
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
\`\`\`

### Slide 4 · Sample Java Code

The code on the slide:

\`\`\`java
public int summingAnArray(int[] pin)
            throws NullPointerException,
                   ArrayIndexOutOfBoundsException{

   int sum = 0;
    for (int i=0; i<4; i++ ){
            sum = sum + a[i];
   }
   return sum;
}
\`\`\`

**Code analysis.** The same function as in C, now in Java. What changes:

- **A bug in the snippet itself.** The loop reads \`a[i]\`, but the parameter is called \`pin\`. As written the code does not compile ("cannot find symbol: a"), unless \`a\` happens to be a field of the class, in which case the parameter is silently ignored. The intended line is \`sum = sum + pin[i];\`.
- **Memory safety.** Every Java array carries its length, and the JVM checks every access: if \`pin\` has fewer than four elements, \`pin[3]\` throws \`ArrayIndexOutOfBoundsException\` instead of reading adjacent memory; if \`pin\` is \`null\`, a \`NullPointerException\` is thrown. The C out-of-bounds read becomes a well-defined error: no memory corruption, no information leak. This is *language-based security* (Lecture 1, Slide 58).
- **The \`throws\` clause.** Both exceptions are *unchecked* (subclasses of \`RuntimeException\`), so declaring them is optional: here it only documents the behaviour. An exception that nobody catches still terminates the thread, a residual **denial-of-service** risk when the input comes from an attacker. Stack traces must not be shown to users either (information disclosure).
- **What Java does not check: integer overflow.** \`sum + pin[i]\` wraps around silently (two's complement), exactly like C in practice, although in Java the wrap-around is defined behaviour. \`Math.addExact\` throws an \`ArithmeticException\` instead.
- **Hard-coded 4** again: use \`pin.length\`.

Fixed version:

\`\`\`java
public int summingAnArray(int[] pin) {
    Objects.requireNonNull(pin, "pin must not be null");
    int sum = 0;
    for (int value : pin) {                 // iterates exactly pin.length times
        sum = Math.addExact(sum, value);    // ArithmeticException on overflow
    }
    return sum;
}
\`\`\`

### Slide 5 · Sample Java OO Code

The code on the slide:

\`\`\`java
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
\`\`\`

**Code analysis.**

- **Pseudo-Java.** As written it does not compile: the constant has no type and no \`=\` (it should be \`public static final int SOME_CONSTANT = 2;\`), \`x\` is never declared, and \`new(A)\` is not Java syntax (\`A x = new A();\`). Method names are normally lowerCamelCase (\`shallowClone\`).
- **\`final class\`**: \`A\` cannot be subclassed. Security-wise, this stops an attacker from passing a malicious subclass, wherever an \`A\` is expected, that overrides methods to capture or alter internal state or to skip checks. Oracle's Secure Coding Guidelines for Java SE recommend limiting the extensibility of security-sensitive classes in exactly this way.
- **\`private B b1, b2\`**: encapsulated state. Note that \`private\` in Java is per *class*, not per object, which is why the method may read \`((A)o).b1\` from another instance.
- **\`protected\` in a final class**: since no subclass can exist, \`protected\` here just means package-private (every class in the same package can call it). Always choose the narrowest modifier that works.
- **Shallow copy, hence aliasing (the main security issue).** The clone copies the *references* to \`b1\` and \`b2\`, not the objects. Original and clone share the same \`B\` objects, so if \`B\` is mutable, a change made through one is visible through the other. Whoever obtains the clone can therefore modify the private state of the original, breaking its encapsulation and invariants. A typical attack: a check is performed on a shared object, which is then modified through an alias before it is used (a time-of-check to time-of-use problem). Fix: *defensive (deep) copies* of mutable components, or make \`B\` immutable.
- **Unchecked cast**: \`(A)o\` throws \`ClassCastException\` if \`o\` is not an \`A\`, and \`NullPointerException\` if \`o\` is \`null\`. Declaring the parameter with the right static type lets the compiler do the check.

Fixed version (assuming \`B\` has a copy constructor, or is immutable):

\`\`\`java
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
\`\`\`

## Trusting TRUST (pages 6-9)

Page 6 is the section divider "Trusting TRUST".

### Slides 7 and 9 · Trusting Trust

> **Ken Thompson:** Co-Creator of *UNIX* and *C*
>
> **Turing Award:** 1983

**Figure.** A portrait of Ken Thompson. On page 9 the same photo is stamped "HACKER" in red.

**Expansion.** Ken Thompson created UNIX together with Dennis Ritchie at Bell Labs, and designed the language B, the direct predecessor of Ritchie's C; the two shared the 1983 Turing Award for UNIX. The "HACKER" stamp refers to his award lecture (next slide), in which he explained how he could have planted an undetectable backdoor in every UNIX system.

### Slide 8 · Trusting Trust (the compiler backdoor)

![Lecture 2, page 8](L02_p08.webp "50% 1400x971")

**Figure.** A screenshot of ordinary C source code (the function \`print_section_stabs\` of \`objdump.c\`, part of GNU binutils) enters a box labelled COMPILER, which outputs the binary \`011001001111010\`. A speech bubble shows what the compiler secretly contains:

\`\`\`c
...
if(program == "login")    add-login-backdoor();
if(program == "compiler") add-compiler-backdoor();
\`\`\`

**Expansion.** This is Thompson's Turing Award lecture *Reflections on Trusting Trust* (published in *Communications of the ACM*, August 1984). It shows a backdoor that is invisible in every source file:

1. **Stage 1, the login backdoor.** The C compiler is modified so that, when it recognises it is compiling the UNIX \`login\` program, it inserts extra code that accepts a secret master password for any account. The source of \`login\` is clean; its binary is not.
2. **Stage 2, the self-propagating compiler backdoor.** The compiler is also modified so that, when it recognises it is compiling *a compiler* (its own source), it inserts both pieces of malicious logic into the output. The trick relies on self-reproducing programs (quines).
3. **Stage 3, erase the evidence.** The malicious code is deleted from the compiler's source, and the compiler is rebuilt with the infected binary. From then on, compiling the *clean* compiler source with the infected binary yields an infected compiler, forever. Auditing the sources of both \`login\` and the compiler reveals nothing.

Thompson's moral: *"You can't trust code that you did not totally create yourself. (Especially code from companies that employ people like me.) No amount of source-level verification or scrutiny will protect you from using untrusted code."* The idea had first appeared in the 1974 US Air Force evaluation of Multics by Karger and Schell, which Thompson credited.

**Why it matters for this course.**

- Every program implicitly trusts a chain of tools: compiler, linker, libraries, build system, package manager, even CPU microcode. They are part of the **trusted computing base** of the build: the "weakness in depth" of Lecture 1, Slides 35-36.
- **Real cases.** The *Induc* virus (2009) infected Delphi compiler installations, so every program built with them was infected. *XcodeGhost* (2015), a trojanised copy of Apple's Xcode spread through Chinese download sites, inserted malicious code into thousands of iOS apps that reached the App Store. *SolarWinds* (2020): attackers compromised the build system, so signed Orion updates carried the SUNBURST backdoor to about 18,000 customers. The *xz-utils* backdoor (2024) was hidden in build scripts and binary test files, and targeted OpenSSH through the build process.
- **Countermeasures.** *Diverse Double-Compiling* (David A. Wheeler, 2005): compile the compiler's source with an independent second compiler and check that the results are bit-for-bit identical; *reproducible builds*, so that anyone can rebuild a package and obtain the same binary hash; *bootstrappable builds* that start from a tiny auditable seed; signed and audited supply chains (the SLSA framework, software bills of materials).

## Context and definitions (pages 10-14)

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

**Expansion.**

- **IoT** (Internet of Things): connected sensors and actuators such as cameras, thermostats and door locks. **Smart cards** are tiny secure computers (bank cards, SIM cards, e-passports) with their own CPU, memory and operating system, running applets (e.g., Java Card); their attacker may physically hold the device.
- **Embedded systems**: a modern high-end car contains around a hundred electronic control units and on the order of 100 million lines of code, linked by internal buses and reachable through infotainment, Bluetooth and cellular connections. In 2015 Charlie Miller and Chris Valasek remotely took control of a Jeep Cherokee's steering and brakes through its infotainment unit, which led to the recall of 1.4 million vehicles.
- **Cloud**: computing as a service (IaaS, PaaS, SaaS) on shared infrastructure; isolation between customers (multi-tenancy) becomes a security property, and everything is exposed through APIs.
- **ICS/SCADA** (Industrial Control Systems; Supervisory Control And Data Acquisition): they run power grids, water treatment plants and factories. They were designed for reliability in isolated networks and are now connected, and attacks on them have physical consequences (Stuxnet; the 2015 and 2016 attacks on the Ukrainian power grid).
- **The two characteristics** explain why all of these are in scope: (1) they contain software, so they inherit software bugs; (2) they are connected, so those bugs are reachable by remote attackers (compare Lecture 1, Slides 20-21).

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

**Expansion.**

- **Specific to the system?** Yes: the weight of each goal depends on the system. For a bank, integrity of balances dominates; for a medical device, integrity and availability (lives are at stake); for a messaging app, confidentiality; for a smart card, resistance to an attacker who physically holds it. The high-level goals must be refined into a system-specific *security policy* (Lecture 1, Slide 50).
- **"Unsecure" executions** are executions that violate the policy. Three ways to deal with them: *prevent* them (make them impossible: type safety, access control), *detect* them at run time and stop the program (monitors, stack canaries), or *contain and recover* (sandboxing limits the damage, backups restore the data). This is the prevention/detection/reaction triad of Lecture 1, Slide 55.
- **Security vs safety vs fault tolerance.**
  - *Safety* deals with accidental failures that can cause harm: hazards such as a worn-out component, a faulty sensor reading or a random bit flip. Hazards follow probability distributions, so failure rates can be estimated and redundancy sized accordingly.
  - *Fault tolerance* masks such random faults (redundant hardware, retries, error-correcting codes).
  - *Security* faces an **intelligent adversary**, the intruder, who chooses inputs and timing on purpose, adapts to the defences, and aims exactly at the rare corner case that random testing never hits. A "probability of failure" is meaningless when the attacker can make the bad event happen every time. Ross Anderson and Roger Needham called this "programming Satan's computer", as opposed to Murphy's.
- **Threat model.** An explicit statement of the attacker's capabilities (what can they observe, send, modify? do they have physical access, insider knowledge, how much computing power?) and of their goals. A classic example is the Dolev-Yao model for network protocols, in which the attacker controls the whole network. Security claims only make sense relative to a threat model.
- **Definition by default**: the same idea as Lecture 1, Slide 32. Security properties are negative ("should not"), defined against everything the system *could* do.

### Slide 12 · Software Security: an example

> Consider 2 programs:
>
> - \`Compress\`, to compress a file \`f\`
> - \`Uncompress\`, to uncompress a (compressed) file \`C\`
>
> Expected behavior (the one we try to validate)
>
> \`Uncompress(Compress(f)) = f\` (1)
>
> What about uncompressing an arbitrary (i.e., maliciously crafted) file? (e.g., CVE-2010-0001 for gzip)
>
> \`If C is not Compress(f) for any f then Uncompress(C) = "Error_Msg"\` (2)
>
> Actually (2) is much more difficult to validate than (1)

**Expansion.**

- **Property (1)** is a *functional* (correctness) property: for every file f, compressing and then decompressing gives back f. It only concerns inputs that \`Compress\` itself produced, i.e., well-formed compressed data, and it can be tested with a large corpus of ordinary files.
- **Property (2)** is a *security* (robustness) property: for every input that is *not* the output of \`Compress\` (truncated files, corrupted headers, inconsistent lengths, deliberately malicious files), \`Uncompress\` must fail gracefully with an error, and nothing worse: no crash, no out-of-bounds write, no endless loop, no code execution.
- **Why (2) is much harder.** The set of invalid inputs is infinite and unstructured, and an attacker does not sample it at random: they *search* it for the single input that triggers a bug. Validating (1) needs a few good files; validating (2) means exploring an astronomically large space. This is exactly what **fuzzing** automates (Lecture 6), and why parsers must check every field before using it.
- **CVE-2010-0001**: an *integer underflow* in the \`unlzw\` function of gzip before 1.4 (decompression of the old LZW \`.Z\` format) on 64-bit platforms. A crafted archive causes an array index error, allowing a crash or possibly arbitrary code execution: running \`gunzip\` on a downloaded file was enough.
- **Even valid input can be malicious.** *Decompression bombs* (the well-known 42.zip is 42 KB compressed and petabytes uncompressed) exhaust disk and memory, so a robust decompressor must also limit output size and nesting depth.
- **LangSec** (language-theoretic security) generalises the lesson: treat every input format as a formal language and *fully recognise* (parse and validate) the input before acting on it, instead of scattering checks throughout the processing code ("shotgun parsing").

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

**Expansion.**

- **"Or even by the compiler".** The source is correct but the binary is not. Causes: compiler bugs; Trusting-Trust-style backdoors (Slide 8); and, most often, **optimisations that exploit undefined behaviour**. Examples: a check \`if (ptr + len < ptr)\` meant to detect wrap-around is deleted, because pointer overflow is undefined and the compiler may assume it never happens; a \`memset(password, 0, n)\` just before \`free\` is removed as a useless store (use \`explicit_bzero\` or \`memset_s\`); a NULL check placed *after* a dereference is removed, as in the 2009 Linux kernel \`tun\` driver bug (CVE-2009-1897), which turned into a root exploit.
- **Two terminologies.** In Lecture 1 (Slide 37) a flaw becomes a *vulnerability* only if it is accessible and exploitable. Here *vulnerability* means any bug that opens a security breach, split into *exploitable* and *non-exploitable*. The substance is the same; know both vocabularies.
- **"(known!)"** is the key word: non-exploitability is a statement about current knowledge. Many bugs once dismissed as harmless crashes later became exploitable thanks to new techniques: one-byte NUL overflows (poison null byte), kernel NULL-pointer dereferences (exploitable by mapping memory at address 0, until the \`mmap_min_addr\` protection), use-after-free. Treat every memory-safety bug as potentially exploitable.
- **Exploit** as "a concrete program input": for a buffer overflow, the exact bytes (padding, the overwritten return address, shellcode) that turn the bug into control of the program. A *proof of concept* (PoC) only demonstrates the bug, e.g., with a crash; a *weaponised* exploit is reliable and delivers a payload.
- **Malware** (malicious software): viruses, worms, trojans, ransomware, spyware, rootkits, botnet agents (Lecture 1, Slide 8). It gets "injected" either by exploiting vulnerabilities (worms, drive-by downloads) or by tricking users (social engineering, malicious attachments).

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

**Expansion.**

- **Programming level.**
  - *From disclosed vulnerabilities to secure patterns*: each disclosed vulnerability (a CVE) is classified under a weakness type (a CWE); recurring weakness types become coding rules (SEI CERT C, MISRA C) and safer libraries and APIs (\`snprintf\` instead of \`sprintf\`, prepared statements instead of string-built SQL, safe string libraries).
  - *Aggressive compiler options*: warnings treated as errors (\`-Wall -Wextra -Werror\`, \`-Wformat=2 -Wformat-security\`) and hardening flags (\`-fstack-protector-strong\`, \`-D_FORTIFY_SOURCE=3\`, \`-fPIE -pie\`, \`-Wl,-z,relro,-z,now\`, \`-fstack-clash-protection\`, \`-fcf-protection\`).
  - *Code instrumentation*: the compiler adds run-time checks, the *sanitizers*: AddressSanitizer (\`-fsanitize=address\`, out-of-bounds accesses and use-after-free), UndefinedBehaviorSanitizer (\`-fsanitize=undefined\`, signed overflow, invalid shifts, misaligned pointers), MemorySanitizer, ThreadSanitizer. Combined with tests and fuzzing they catch bugs early, during development. Lecture 8 covers the run-time defences in detail.
- **OS level.**
  - *Sandboxing*: run code with minimal rights (seccomp-bpf on Linux, AppArmor or SELinux profiles, the browser and mobile-app sandboxes, containers).
  - *Address space layout randomisation (ASLR)*: stack, heap, libraries and executable are placed at random addresses on every run, so an exploit cannot hard-code addresses.
  - *Non-executable memory (NX, DEP, W^X)*: data pages such as stack and heap cannot be executed, so injected shellcode does not run; attackers answer with code reuse (return-to-libc, return-oriented programming).
- **Hardware level.**
  - *TPM* (Trusted Platform Module): a tamper-resistant chip that stores keys, measures each stage of the boot chain (measured boot) and can prove the software state to a remote party (remote attestation). It underpins disk encryption such as BitLocker.
  - *Secure crypto-processors and enclaves*: Intel SGX creates *enclaves* whose memory is encrypted and protected even from the OS; related technologies are ARM TrustZone, AMD SEV and Intel TDX. Enclaves have been broken by side-channel attacks (e.g., Foreshadow, 2018), and SGX was dropped from Intel's consumer processors from the 11th/12th generation, remaining on server CPUs.
  - *CPU tracking*: hardware support to record or enforce control flow, e.g., Intel Processor Trace (records executed branches), Intel CET (a *shadow stack* against return-address overwrites and *indirect branch tracking* against code-reuse attacks), ARM Pointer Authentication and the Memory Tagging Extension.

## What is Secure? (pages 15-27)

Page 15 is the section divider "What is Secure? (in the sense of Engineering Secure Software)".

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

**Expansion.** The last question is the central problem of security *assurance*. Possible indicators and evidence:

- *Process evidence*: security requirements were written down; a threat model exists and was reviewed; code review and static analysis run on every change; developers are trained.
- *Product evidence*: static-analysis results with no open high-severity findings; fuzzing campaigns (CPU-hours spent, code coverage reached, no open crashes); penetration-test reports; bug-bounty results; memory-safe languages and compiler hardening in use; dependencies checked for known CVEs.
- *Operational evidence*: how many vulnerabilities were found after release, and how fast they were fixed.
- *Convincing others*: an **assurance case**, i.e., a structured argument ("the system is acceptably secure because ..., supported by the evidence ..."), certifications (Common Criteria; FIPS 140-3 for cryptographic modules), and compliance with standards (ISO/IEC 27001, OWASP ASVS).

None of these *proves* security; together they give justified confidence. The first question matters too: each language and framework comes with its own typical vulnerabilities and safety features.

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

**Expansion.**

- **Not black-and-white**: a system is not "secure" or "insecure" in absolute terms, but more or less secure *against a given threat model*, at a given cost, for a given period. Security is a level of risk.
- **"Until proven insecure"**: we can never prove that a real system has no vulnerabilities; we can only fail to find one, so far, while a single discovered vulnerability proves it insecure. Security claims are therefore provisional, like scientific hypotheses that have not yet been falsified, and systems must be maintained.
- **Security theatre** (a term coined by Bruce Schneier): measures that make people *feel* safer without making them safer, e.g., ineffective but visible checks, password rules that force predictable changes ("Password1!" becomes "Password2!"), secret questions whose answers are on social media. Because people act on *perception*, theatre has some effect (reassurance, deterrence), but it wastes resources and creates false confidence.
- **Protection can be costly**, and not only in money: in liberty and privacy too (mass surveillance, data retention, intrusive identity checks). Security decisions involve ethical trade-offs.
- **Eliminating a threat vs protection**: one can act on the *source* (eliminate the threat: arrest the attacker, remove the incentive, take down the botnet) or on the *target* (protection: patch, harden, isolate). Developers rarely eliminate threats; they protect by removing vulnerabilities.
- **Vulnerability vs exploit vs threat**: the weakness, the means of abusing it, and the agent or class of attack (defined on Slides 19-20).

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

**Expansion.**

- "Cannot be broken into" is not achievable in absolute terms (Slide 17); the engineering question is how much evidence is enough for the risk at stake.
- **When are you done?** Security has no natural end point, so explicit exit criteria are needed, tied to risk: all high-risk threats of the threat model mitigated, no critical static-analysis findings, a fuzzing campaign of a given length with no new crashes, a passed penetration test.
- **Prioritisation**: by risk (likelihood × impact, e.g., with CVSS scores), starting from the attack surface exposed to untrusted input.
- **SE (software engineering) as a zero-sum game**: with a fixed budget and deadline, time spent on security is taken from features, performance or polish; the quoted question is the one a project manager will ask. Two counter-arguments: security work done early is cheap (Lecture 1, Slide 43), and many security practices (code review, testing, simpler designs) also raise general quality, so over the whole life cycle the game is less zero-sum than within a single release.

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
> Alternative definition: "an instance of a fault that violates an \\[implicit or explicit\\] security policy"

**Expansion.**

- **The airport analogy.** After the 2001 "shoe bomber" attempt, airports started screening shoes; *not* examining shoes is a gap in the checking procedure that an attacker can exploit. In software, vulnerabilities are likewise missing or faulty checks.
- **Poor coding vs design flaw.** Accepting "123456" as a password is an implementation problem: a check on password strength is missing. Having no authentication at all on an administrative function is a design problem: no single line of code is wrong, the design is. McGraw's 50/50 split is the "equally common" of Lecture 1, Slide 38.
- **The alternative definition** ties vulnerabilities to the *security policy*, which may be explicit (written requirements) or implicit (what users can reasonably expect, e.g., that a chat app does not leak messages even if no document says so). It echoes Ivan Krsul's classic definition (PhD thesis, Purdue, 1998): a vulnerability is "an instance of an error in the specification, development, or configuration of software such that its execution can violate the security policy".

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

**Expansion.**

- **Three forms of exploit**: a *program* (a script that connects to a server and sends a crafted request), a *chunk of data* (a malicious PDF, image or audio file, an overlong string), a *sequence of commands* (typed into a vulnerable application, e.g., a SQL injection performed by hand).
- **Manual vs automated**: a penetration tester exploiting a SQL injection by hand vs a worm or an exploit kit doing it automatically on millions of hosts. "Viruses are merely automated exploits": malware is the automation and packaging of exploitation, plus a payload.
- **Many exploits for one vulnerability**: a single stack overflow can be exploited by injecting shellcode, by return-to-libc, by return-oriented programming, or by overwriting a function pointer or a nearby variable instead of the return address. A defence that blocks one technique (e.g., a non-executable stack) leaves the vulnerability in place; only fixing the root cause is complete.
- **Threat, usage (A)**, the *threat agent*: *who* attacks (black-hat hackers, insiders, criminals, states). Black hat = malicious hacker; white hat = ethical hacker; grey hat = in between.
- **Threat, usage (B)**, the *threat category*: *what kind* of attack (spoofing, tampering, information disclosure, denial of service: the STRIDE categories of Lecture 1, Slide 56).

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

**Expansion.** Three levels of defence, from the symptom to the root cause:

- **Against exploits**: recognise and block known attack patterns (antivirus signatures, intrusion detection and prevention systems, firewalls, web application firewalls). These defences are *reactive* (they know only attacks seen before), can be evaded by modifying the exploit, and leave the vulnerability in place. Useful as an extra layer.
- **Against threats**, i.e., the attackers: forensics establishes who attacked and how; then legal action, policies, removing incentives (e.g., stolen data made worthless by encryption or tokenisation) and deterrents (penalties, visible monitoring) shrink the threat itself. Mostly outside the developer's control.
- **Against vulnerabilities**: remove the weakness that every exploit needs. This is the only defence that also works against *unknown* exploits, and it is the subject of this course: engineering secure software.

### Slide 22 · Software Security is... NOT a myth

> **NOT** a myth but a reality
>
> Insecure software causes *immeasurable* harm
>
> Sony, NSA, android, browser, and now AI agents… just read the news

**Expansion.** The stories behind the names:

- **Sony**: the 2011 PlayStation Network breach (about 77 million accounts exposed, the service offline for weeks); in the same year the LulzSec group breached Sony Pictures' websites with a simple SQL injection; in 2014 Sony Pictures' network was wiped and its data leaked, an attack attributed by the US to North Korea.
- **NSA**: in 2016-2017 the *Shadow Brokers* leaked NSA hacking tools. One of them, the EternalBlue exploit for a Windows SMBv1 vulnerability (MS17-010), was reused by the **WannaCry** ransomware worm (May 2017, around 200,000 computers in 150 countries, including UK hospitals) and by **NotPetya** (June 2017, about $10 billion of damage).
- **Android**: **Stagefright** (2015), integer overflows in the media library that allowed remote code execution just by receiving a crafted MMS, affecting about 950 million devices; the fragmented update ecosystem left many of them unpatched.
- **Browsers**: every year several zero-days in Chrome, Safari and Firefox are exploited in the wild, mostly memory-safety bugs in the JavaScript engines (JIT compilers) or renderers.
- **AI agents**: LLM-based agents that browse the web, read e-mail and call tools can be hijacked by *prompt injection*, i.e., instructions hidden in a web page or a document that the agent then obeys, leading to data exfiltration or unwanted actions. It is the old pattern of mixing data and commands, in a new form.

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

**Expansion.**

- What looks like magic is skill plus method: *reverse engineering* (disassemblers and decompilers such as Ghidra or IDA rebuild program logic without the source), *fuzzing* (finding crashing inputs automatically), and well-documented exploitation techniques; this course covers the classic ones (stack smashing, format strings, injection, races).
- **The defender's advantage**: developers have the source code, the design documents, the requirements, the tests and the threat model, while attackers usually have only the binary. A developer who knows the attack patterns can find and fix bugs far more cheaply than an attacker can find them. The attacker's advantage is asymmetry: they need one hole, the defender must close them all.
- **Responsibility**: security cannot be delegated entirely to a separate security team or to a final penetration test, since every developer writes code that may be attacked.

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

**Expansion.**

- **Secure software vs security software.** *Security software* means security features: login, encryption, access control, a firewall. *Secure software* means software whose every part resists attack. Adding security features does not make software secure: a login page with a SQL injection, or an encryption tool with a buffer overflow in its file parser, is security software that is not secure. Security is a property of the whole code base, not a module you add.
- **No magical tool**: static analysers, fuzzers and scanners find many bugs, but not all of them (Rice's theorem rules out analyses that are both complete and precise), raise false alarms, and know nothing about design flaws or business logic. Experts help, but someone in the team must understand the findings and the system.
- **Using security libraries properly**: most cryptographic failures are misuses of correct libraries: ECB mode, hard-coded keys and IVs, a reused nonce with AES-GCM, MACs compared with a non-constant-time comparison (timing attacks), TLS certificate verification switched off, passwords hashed with fast hashes (MD5, SHA-256) instead of bcrypt, scrypt or Argon2.

**Code example: misusing vs using a crypto API (Java).**

\`\`\`java
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
\`\`\`

In ECB mode identical plaintext blocks give identical ciphertext blocks (the famous "ECB penguin" picture remains recognisable after encryption), and a hard-coded key is readable by anyone who has the binary. GCM provides confidentiality *and* integrity, as long as each nonce is used only once with a given key.

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

**Expansion.**

- **Pick-proof lock vs open window**: strong cryptography is an unpickable lock on the front door; a buffer overflow in the server is an open window. Attackers go *around* cryptography, not through it: Heartbleed read the keys straight from memory, and malware reads messages before they are encrypted. In Adi Shamir's words, "cryptography is typically bypassed, not penetrated".
- **Inherently incomplete**: a proof is only as good as its model and assumptions. Formally verified systems (the seL4 microkernel, the CompCert C compiler) are proven correct with respect to a specification, assuming that the hardware, the rest of the toolchain and the specification itself are right; side channels (timing, power consumption, Spectre) lie outside most models; a specification can be wrong or incomplete. Access-control rules can each be correct and still combine badly (e.g., the *confused deputy* problem). Formal methods raise assurance considerably but do not replace secure engineering.

### Slide 26 · Software Security is... NOT a problem for just networking and operating systems

> **NOT** a problem for just networking and operating systems
>
> Software had security problems long before we had the internet
>
> If you left a window open in your house, would you try to fix the roads?

**Expansion.**

- **Before the Internet**: the multi-user time-sharing systems of the 1960s and 1970s already suffered privilege-escalation bugs (the 1974 Multics evaluation by Karger and Schell broke in several ways); the 1972 Anderson report described buffer overflows; viruses spread by floppy disk in the 1980s (Elk Cloner on the Apple II in 1982, Brain on the IBM PC in 1986).
- **The roads analogy**: network security (firewalls, VPNs, TLS) protects the *roads* leading to the house, while the vulnerability is an open *window* in the application. Hardening the network does not close application holes, because the traffic the application must accept (web requests, e-mails, files) carries the attack straight to the bug. The fix belongs in the software.

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

**Expansion.**

- **All stakeholders**: managers set budgets and deadlines (Slide 18), architects choose designs, testers write abuse-case tests, operations teams configure and patch, users choose passwords and click on links, executives are legally accountable (in the EU, the NIS2 directive and the Cyber Resilience Act impose security obligations on organisations and on manufacturers of products with digital elements).
- **A learnable mindset**: thinking like an attacker (Lecture 1, Slide 32) is a skill that improves with practice: studying past vulnerabilities, playing CTFs, reviewing code with an adversarial eye.
- **Unintended functionality** is the best one-line summary of a vulnerability: the software can do something its designers never intended (run injected code, reveal data, skip a check). A buffer overflow gives a program the "feature" of running attacker code; SQL injection gives a login form the "feature" of logging in without a password. Security means removing unintended functionality at *all* layers (hardware, OS, libraries, application, configuration) and in *all* parts of the system, including the ones that look unimportant (logging, error handling, build scripts).
`;export{e as default};
