Lecture 8 is the countermeasures companion to Lecture 3: a catalogue of the defences against buffer overflows, grouped by who applies them (software engineering practices, find-and-patch methods, language tools, analysis tools, compiler tools, operating system tools), each with its pros and cons; then a closer look at **StackGuard** and stack canaries and at how they can be bypassed, the **arithmetic (integer) issues** that turn length checks into overflows, and why Java is not immune when it calls native code. The slide deck has 35 pages. The code examples (Slides 31, 32 and 35) are exam-relevant.

## Kinds of defences (page 2)

### Slide 2 · Kind of Defences

> - Better software engineering practices
> - Find-and-patch methods
> - Language tools
> - Analysis tools
> - Compiler tools
> - Operating system tools

**Expansion.** The six families act at different moments in the life of the software (Lecture 3, Slide 44: "before programming, during development, when testing, when executing"):

- *Better software engineering practices* and *language tools* act **before and during development**: write fewer bugs.
- *Analysis tools* act **during development and testing**: find the bugs before shipping.
- *Compiler tools* act **at build time**, with effect **at run time**: they add checks to the binary.
- *Operating system tools* act **at run time**, on every program, without touching the code.
- *Find-and-patch methods* act **after deployment**, once a bug or an attack is known.

The pattern of the whole lecture is that each family has a clear benefit and a clear cost, and that none is sufficient on its own: defence in depth (Lecture 10) means combining several.

## Better software engineering practices (pages 3-4)

### Slide 3 · Better Code Engineering Practices - Code Inspection

> **Pros:**
>
> - Code inspection *may catch* many buffer overflows that testing won't
>
> **Cons:**
>
> - Time is money
> - When using vendor software, you cannot do a code inspection if you do not have the source code

**Expansion.**

- **Why inspection finds what testing misses.** A buffer overflow often needs a specific, unusual input (an over-long string, a negative length) that ordinary tests never supply, and even when it happens it may corrupt memory silently, with no visible failure. A reviewer who reads `strcpy(dest, src)` and asks "how long can `src` be?" finds the bug without needing the triggering input. This is the manual analysis of Lecture 6, Slide 10.
- **The cons.** Inspection is slow and needs skilled reviewers, so it is expensive and usually limited to the most sensitive code (input parsing, privileged components). And it needs the source: for closed-source third-party components only binary analysis or testing is possible (Lecture 6, Slide 8).

### Slide 4 · Better Code Engineering Practices - Documentation

> **Pros:**
>
> - Good documentation of reusable software components will allow people who use your code in their own projects to test and inspect it
>
> **Cons:**
>
> - Time is money, and the cost of documenting the code gets passed on to the customers
> - Often software companies do not want to release the source code for libraries that they sell

**Expansion.** Many overflows arise at the boundary between components: a library function assumes that the caller passes a buffer of at least N bytes, or a NUL-terminated string, and the caller does not know it. Documenting these contracts (buffer sizes, termination, maximum lengths, behaviour on error) lets the users of a component call it correctly and test it at its limits; the `strncat` "third parameter" mistake of Lecture 3, Slides 16-17 is exactly a misread contract. The cons are economic (documentation costs time, and the cost is passed on) and commercial (vendors of closed libraries do not want to expose their source).

## Find-and-patch methods (pages 5-7)

### Slide 5 · Find-and-patch Methods

> - *Software patches*
>   - released by vendors when a security problem in their software is found, to fix the vulnerability.
> - *Programs that block known attacks*
>   - Programs that keep a list of known attacks and watch for those attacks on your system

**Expansion.** Both methods are **reactive**: they work only *after* a vulnerability or an attack has been discovered. Patching removes the bug from the code; blocking leaves the bug in place and filters the attacks known to exploit it. Before the discovery lies the window of the **zero-day** (Lecture 1, Slides 23-24); between the release of a patch and its installation lies the window that Slammer exploited (Lecture 1, Slides 9-10: the patch had been published six months earlier).

### Slide 6 · Find-and-patch Methods - Software Patches

> Example: The vendor, the customer, or a group concerned about software security finds a buffer overflow and a patch is written and released
>
> **Pros:**
>
> - Very effective at preventing known buffer overflow attacks for specific vulnerabilities
>
> **Cons:**
>
> - No protection against unknown attacks or known attacks for which a patch has not been released
> - Not all patches fix the buffer overflow, some are specific to one attack but leave the buffer overflow itself in place
> - The customer must regularly check for patches for their system (at the vendor's website or www.cert.org) and install them.

**Expansion.**

- **A good patch fixes the root cause**: it replaces the unbounded copy with a bounded one, or adds the missing length check. A bad patch filters the specific exploit string seen in the wild, and a slightly different input reaches the same overflow: the blacklisting mistake of Lecture 4, Slides 35-36, applied to patches.
- **A patch protects only the systems where it is installed.** Unpatched systems remain vulnerable for years: Slammer (Lecture 1, Slides 9-10), or WannaCry in 2017, which spread through a Windows SMB flaw patched two months earlier. Today vendors push automatic updates, and advisories are published by the vendors and by CERTs (www.cert.org is the CERT Coordination Center at Carnegie Mellon's Software Engineering Institute).

### Slide 7 · Find-and-patch Methods - Programs that block known attacks

> Example: An anti-virus program that checks files and other inputs to the system for signatures of known attacks
>
> **Pros:**
>
> - Very effective against specific attacks that are known
>
> **Cons:**
>
> - Not effective against unknown attacks or attacks for which the anti-virus program does not yet have the signature
> - The program must keep a current list of signatures for known attacks and must be updated regularly

**Expansion.** Signature-based blocking (anti-virus, intrusion prevention systems, web application firewalls) recognises the *byte patterns* of known exploits. Its two weaknesses are structural: it cannot recognise an attack that nobody has seen yet (zero-days), and attackers **evade** a signature by changing the payload without changing its effect (encoding the shellcode, inserting no-op instructions, splitting the input): the same evasion game shown for SQL injection in Lecture 9, Slides 9-11. It is useful as one layer, never as the only one.

## Language tools (pages 8-12)

### Slide 8 · Language Tools

> - Languages less susceptible to buffer overflows
>   - Languages other than C/C++ that are less susceptible to buffer overflows when used properly.
> - Languages based on C
>   - Languages like Cyclone that were designed with preventing buffer overflows in mind.
> - "Safe" buffers
>   - Buffers that automatically truncate inputs, generate exceptions, grow bigger.
> - Safer library functions
>   - Library functions that are less susceptible to buffer overflow than the standard libraries.

**Expansion.** The four options trade compatibility for safety, from the most radical (change language) to the least invasive (change library). Each is detailed in Slides 9-12.

### Slide 9 · Languages Less Susceptible to Buffer Overflows

> Examples: Ada, Java, Perl, Python, etc.
>
> **Pros:**
>
> - Automatic bounds checking makes them less susceptible to the buffer overflow problem
> - Exception handling can greatly ameliorate the problem
>
> **Cons:**
>
> - Using different languages can increase development cost
> - None of these languages give the programmer access to the machine at a low level
> - None of these languages give you the performance of C/C++, most require distributable run-time environments
> - C/C++ are popular languages that many programmers are familiar with
> - What happens when a string that is too long is entered or an array is referenced out of bounds, is an exception generated, does the buffer grow, does the program just halt, is the user asked to provide different input?
> - Programmer still must be aware of buffer overflows to provide exception handlers to do what they want (Exception handling comes with its own set of problems)

**Expansion.**

- **How memory-safe languages prevent overflows.** Every array access is checked against the array's length at run time (in Java, `a[i]` with `i >= a.length` throws `ArrayIndexOutOfBoundsException`), strings carry their own length, and there is no pointer arithmetic. An out-of-bounds write becomes an exception instead of silent memory corruption: these languages remove the *exploitable* consequence, not the logic error.
- **The cons, today.** Performance and low-level access are the classic reasons to stay with C/C++ (kernels, drivers, embedded code, browsers). **Rust** largely answers them: it is memory-safe (bounds checks plus a compile-time ownership system, without a garbage collector) with performance comparable to C, and it allows low-level code inside explicitly marked `unsafe` blocks. Memory-safe languages are now the official recommendation of security agencies (Lecture 3, Slide 55).
- **Exceptions are not a free lunch.** An overflow turned into an uncaught exception still stops the program: a **denial of service**. And every handler must decide what to do (truncate? reject? ask again?); a careless one fails insecurely (Lecture 10, "fail securely": the empty or over-broad `catch`).
- Even "safe" languages run on top of C code (their runtimes and native libraries): Slides 34-35.

### Slide 10 · Language based on C

> Example: *Cyclone* is a different dialect of C that handles pointers in a much safer manner
>
> **Pros:**
>
> - The transition from C to Cyclone is an easy one because Cyclone is nearly identical to C
>
> **Cons:**
>
> - Existing C source code must be recompiled and probably modified
> - Code ported to Cyclone must be debugged, and gdb (a commonly used UNIX-based debugger) does not work well with Cyclone
> - Using pointers in Cyclone is considerably more complicated than using pointers in C (`*` is replaced with `*`, `@`, and `?`)
> - Cyclone does not provide object-oriented features

**Expansion.** **Cyclone** (AT&T Labs Research and Cornell University, early 2000s) is a safe dialect of C: it keeps C's syntax and low-level control but forbids unsafe operations and inserts checks where needed. The pointer kinds of the third con are its key idea:

- `*` is a *thin* pointer, possibly NULL, on which pointer arithmetic is not allowed;
- `@` is a **never-NULL** pointer, which needs no null check when dereferenced;
- `?` is a **fat** pointer that carries the bounds of the array it points into, so pointer arithmetic is allowed and every dereference is bounds-checked.

Cyclone also uses region-based memory management to prevent dangling pointers. It was a research language and is no longer maintained, but its ideas (non-null types, bounded "fat" pointers, regions) directly influenced **Rust**, and later "safe C" efforts (Microsoft's Checked C, CHERI capabilities in hardware) follow the same path. The cons on the slide are those of any language migration: porting, debugging and tooling costs.

### Slide 11 · «Safe» Buffers

> Example: C++ class objects that do bounds checking like **cstring**, or "limitless" strings like **libmib**
>
> **Pros:**
>
> - Much safer than standard string handling in C
> - Exceptions can be handled instead of a program halt
>
> **Cons:**
>
> - Require the use of different library functions, meaning that existing code has to be modified or interfaced with in a low-level way
> - A "limitless" string has to continually be reallocated meaning a bigger heap and a performance cost
> - What if you do not want the buffer to grow and accept a bigger input?

**Expansion.**

- **Two designs.** A *bounds-checked* string class knows its capacity and refuses to write past it (throwing an exception or truncating); a *limitless* string, like libmib's dynamically allocated strings, reallocates itself so that an over-long input never overflows. Today's equivalents are `std::string` and `std::vector::at()` in C++ (Lecture 3, Slide 49).
- **Growing is not always what you want** (last con): accepting input of unlimited size lets an attacker exhaust memory, a denial of service, and many protocols *should* reject over-long fields. Whether to grow, truncate or reject is a design decision: the static-versus-dynamic choice of Lecture 3, Slide 47.

### Slide 12 · Safer library functions

> Example: Use of a different library than the standard C libraries
>
> **Pros:**
>
> - Eliminates problems with unsafe library function calls in C/C++
>
> **Cons:**
>
> - Existing code has to be modified
> - Programmers have to become familiar with a different set of libraries
> - Often string and memory handling libraries are replaced, but not standard library functions specific to an operating system, like file handling and environment variable functions which can also lead to buffer overflows
> - Not all buffer overflows are caused by library functions
> - What happens when a buffer's limit is reached? Does the program halt? Is the string truncated? Is an exception generated?

**Expansion.** These are the libraries of Lecture 3, Slides 47-49 (`strlcpy`/`strlcat`, Microsoft's `Strsafe.h`, glib's `GString`) and the C11 Annex K "bounds-checking interfaces" (`strcpy_s`, `strcat_s`, ...). Their limits, as the slide says:

- They only fix the functions they replace: OS-specific calls dealing with paths and environment variables (`realpath`, `getenv`, Lecture 3, Slide 46) can still overflow.
- **Not all overflows come from library calls**: a hand-written copy loop (the URL loop of Lecture 3, Slides 33-36) or an off-by-one index needs no library function to overflow.
- Each library has its own failure behaviour (truncate, return an error, abort), which the program must check and handle; otherwise the truncation itself can become a vulnerability (a truncated path or command can mean something else).

## Analysis tools (pages 13-14)

### Slide 13 · Analysis Tools - Static

> Examples: Software that searches source code for unsafe library function calls like **ITS4**
>
> **Pros:**
>
> - Can be a very effective tool during code inspection by finding unsafe library function calls and making recommendations
>
> **Cons:**
>
> - Only effective against buffer overflows caused by unsafe standard C library function calls
> - Produces many false positives, only a fraction of the library function calls that are reported are actually unsafe

**Expansion.** **ITS4** ("It's The Software, Stupid! Security Scanner", Cigital, 2000) is one of the first *security defect text scanners* (Lecture 6, Slide 15, with RATS and Flawfinder): it tokenises C/C++ code, looks up every call in a database of risky functions (`gets`, `strcpy`, `sprintf`, ...) ranked by risk, and does a little extra analysis (for example, whether a format string is a constant) to reduce the noise. Its cons are those of every lexical scanner: it sees *calls*, not *data*, so it cannot tell a safe `strcpy` (the source is known to fit) from an unsafe one, which gives many **false positives**, and it misses overflows that involve no listed function (**false negatives**). Doing better requires semantic analysis: data-flow analysis and abstract interpretation (Lecture 7).

### Slide 14 · Analysis Tools - Dynamic

> Examples: Tools that analyze memory use of a program during testing, like **Purify**
>
> **Pros:**
>
> - Can detect buffer overflows that occur during testing
> - Sometimes testing will not catch buffer overflows where data is corrupted but program behavior is not affected, dynamic analysis will
>
> **Cons:**
>
> - Buffer overflows that lead to erratic program behavior can usually be found during testing without dynamic analysis tools

**Expansion.** **Purify** (Pure Software, later Rational and IBM) instruments the program so that every memory access is checked against a map of valid memory: it reports an out-of-bounds write the moment it happens, even if the program then continues "normally" (the silent corruption that ordinary testing misses, second pro). Modern equivalents are **Valgrind Memcheck** and the compiler-based **AddressSanitizer** (`-fsanitize=address`), which surrounds every object with poisoned "redzones". Combined with fuzzing (Lecture 6, Slides 25-28) they are today the most effective way to find overflows. Their limit is that of all dynamic analysis (Lecture 7, Slides 10-13): they see only the executions that the tests actually perform.

## Compiler tools (pages 15-17)

### Slide 15 · Compiler Tools

> - Add bounds checking to all buffers
> - Protect the return pointer on the stack

**Expansion.** The compiler sees every buffer and every function, so it can insert protection into the generated code automatically, without changes to the source: either check every access (complete but expensive, Slide 16) or protect only the most attacked target, the saved return address (cheap but partial, Slide 17).

### Slide 16 · Compiler Tools - Bounds Checking

> Example: Attempts to add bounds checking to **gcc**
>
> **Pros:**
>
> - Does not require modification of the source code, although you do still have to recompile
>
> **Cons:**
>
> - Very significant decrease in performance, code size and execution time can double
> - All of the programs that a systems administrator wants to protect must be recompiled
> - Cannot prevent every possible buffer overflow

**Expansion.** Bounds-checking C compilers (the Jones and Kelly patch for gcc, 1997, and its successors) keep track of the bounds of every object and check every pointer arithmetic operation and dereference against them. C pointers do not carry their bounds, so the compiled code must look them up in an auxiliary table at run time, which is why the cost is so high. "Cannot prevent every overflow", because some code escapes the instrumentation (libraries compiled without it, casts and pointer tricks). The idea lives on in cheaper forms: `_FORTIFY_SOURCE` (checks on `memcpy`, `strcpy` and similar calls when the destination size is known at compile time), AddressSanitizer for testing (Slide 14), and hardware support (Intel MPX, now abandoned; CHERI capabilities, Slide 21).

### Slide 17 · Compiler Tools - Protect the Return Pointer

> Examples: Placing a canary on the stack to detect buffer overflows such as **StackGuard**, or adding automatic bounds checking for all strings on the stack like **libsafe**.
>
> **Pros:**
>
> - Does not require that existing code be modified (although it sometimes must be recompiled)
> - Will effectively prevent stack smashing attacks
>
> **Cons:**
>
> - Not all buffer overflow attacks are stack-smashing attacks, program execution can be hijacked using heap-based attacks and data can always be corrupted
> - Significant performance overhead
> - StackGuard causes the program to halt upon detection of a buffer overflow leaving it open to denial-of-service attacks
> - StackGuard requires that the target program to be protected is recompiled, libsafe doesn't

**Expansion.**

- **StackGuard** (Cowan et al., 1998) is a gcc extension: the compiler adds to every function a prologue that places a *canary* word next to the return address and an epilogue that checks it before returning (Slides 24-25; Lecture 3, Slide 41). It needs recompilation.
- **libsafe** (Bell Labs, 2000) needs no recompilation: it is a dynamic library loaded before the C library (`LD_PRELOAD`) that replaces `strcpy`, `strcat`, `sprintf`, `gets`, ... with versions that compute, from the frame pointers, how much space is left before the saved return address of the current stack frame, and refuse to write past it (Lecture 3, Slide 48).
- **The cons** are those of every stack-only protection: heap overflows, overflows of other local data (pointers, flags) and data-only attacks are not stopped (Slides 28-29; Lecture 3, Slide 43); and since detection ends in termination, an attacker can still crash the program at will, a denial of service. The "significant overhead" was real for the first versions; the modern `-fstack-protector-strong` costs about 1-2% and is enabled by default by most Linux distributions.

## Operating system tools (pages 18-21)

### Slide 18 · Operating System Tools

> - Disable execution of code outside the code space
>   - It is possible on some architectures to distinguish between code and data, and not allow data to be executed as code.
> - Intrusion detection systems (IDS)
>   - These are programs that watch for abnormal behavior or behavior that is similar to attack behavior.
> - Generation of an interrupt
>   - With hardware support it is possible to set bounds on a buffer and generate an interrupt when an attempt is made to access or change memory outside those bounds.

**Expansion.** Operating-system defences protect *every* program on the machine, including old binaries that cannot be recompiled: this is their great advantage over compiler tools. The three approaches are detailed in Slides 19-21. Non-executable memory, together with address space layout randomisation (ASLR, Lecture 3, Slide 40), is today the standard OS mitigation.

### Slide 19 · OS Tools - Disable Code Execution

> Example: A patch for Linux that disables execution of code on the stack as well as maps library function calls to addresses with a zero byte in them
>
> **Pros:**
>
> - Currently, the most common and most devastating buffer overflow exploit is stack smashing and this patch makes stack smashing much more difficult
> - Does not require that existing software be modified or recompiled
> - A zero byte in the address of a system call forces the attacker to have a null character in the attack string
>
> **Cons:**
>
> - Does not prevent all stack smashing attacks, often attack code can be placed in global variables or on the heap, or library code to spin a shell already exists in the code space (i.e., `system()` or `execv()`)
> - Crashing still leaves programs open to denial-of-service and core dump attacks
> - A null character in just the right place in an attack string is not always impossible for an attacker to accomplish, and they can always jump to a small piece of code in variable space that contains a second jump to the desired location
> - Some legitimate programs execute code on the stack, but very few, and there is a workaround for this.

**Expansion.** This is Solar Designer's **non-executable stack patch for Linux** (Openwall, 1997), the ancestor of today's NX/DEP:

- **Non-executable stack.** Classic stack smashing (Lecture 3, Slides 8-11) puts shellcode in the overflowed buffer and returns into it; if the stack is not executable, the jump lands in data and the CPU raises a fault. It needs no change to programs, which is why the idea spread: the hardware NX bit, Windows DEP, Linux ExecShield and PaX (Slide 23).
- **Zero-byte ("ASCII-armor") addresses.** The patch also maps the shared libraries at addresses that contain a zero byte. An exploit delivered through a string function such as `strcpy` cannot contain a NUL byte, because the copy stops there, so it cannot write such an address onto the stack. This targets **return-into-libc**, where the attacker returns directly into `system()` instead of injecting code (Slide 23).
- **The cons are the bypasses.** Shellcode can still be placed in other writable areas (heap, globals) if those are executable; existing code can be reused (`system()`, `execv()`: return-into-libc, and its generalisation, return-oriented programming); the NUL byte can sometimes be supplied (input that is not copied as a string, or the terminator written by the copy itself) or avoided through a two-step jump via attacker-controlled memory (a "trampoline"). And a detected attack still crashes the program: a denial of service, and a core dump that may leak memory contents.
- **Legitimate executable stacks**: a few programs need them (gcc's trampolines for nested functions, some just-in-time compilers); the workaround is to mark those binaries as requiring an executable stack.

### Slide 20 · OS Tools - Intrusion Detection

> Example: An intrusion detection system could keep track of what patterns of system calls programs usually exhibit, and then report or react to anomalies such as an "`execv()`" call when the next system call is usually to close a file
>
> **Pros:**
>
> - Could be able to detect a variety of hijacking attacks, not just stack smashing
> - Could be able to detect many attacks on unknown vulnerabilities
>
> **Cons:**
>
> - Intrusion detection is a developing technology
> - The offending process will probably be killed, leaving it open to a denial-of-service attack

**Expansion.** This is **anomaly-based** host intrusion detection, in the style of Forrest et al.'s "A Sense of Self for Unix Processes" (1996): learn the normal sequences of system calls of a program, then flag deviations. A hijacked process behaves unlike itself (a web server suddenly calls `execve("/bin/sh")`) whatever vulnerability was used to hijack it, so, unlike signature-based blocking (Slide 7), it can catch **unknown** attacks. Its weaknesses: false alarms when legitimate behaviour changes; *mimicry attacks*, which hijack the program while imitating its normal call sequences; and the denial of service caused by killing the process. Modern descendants are system-call sandboxes (seccomp-bpf on Linux, pledge on OpenBSD), which enforce an allow-list of system calls instead of learning one, and endpoint detection and response (EDR) products.

### Slide 21 · OS Tools - Generation of an Interrupt

> Example: With hardware support the program could set the bounds of every buffer and an interrupt would be generated if an attempt was made to access or change memory outside of those bounds
>
> **Pros:**
>
> - Would prevent many buffer overflows if done properly
>
> **Cons:**
>
> - Pointer arithmetic would still be unbounded as a pointer might be pointing to an array of 100 bytes, an array of 50 bytes, or to the 40th byte of an array of 50 bytes
> - Programmers would still have to be educated about buffer overflows because they need to write an interrupt handler to do what they want it to (halt, truncate the buffer, ask the user for different input?)

**Expansion.** The hardware checks every access against the bounds of the buffer it belongs to. The first con is the core problem of C: a pointer does not say which object, or which part of an object, it points into, so the hardware cannot know which bounds apply to `p[i]` unless every pointer carries its own bounds. Attempts in this direction: segment limits on x86 (rarely used), Intel **MPX** (bounds registers, 2015, later abandoned for its overhead and complexity), and **CHERI** capabilities (University of Cambridge, implemented in Arm's Morello prototype), where every pointer is a hardware capability carrying bounds and permissions, so an out-of-bounds access traps. Even then the program must decide what to do on the trap (second con), and a crash remains a denial of service.

## StackGuard (pages 22-29)

Page 22 is the section divider "StackGuard".

### Slide 23 · Preventing BO without Programming

> - **Idea:** make the heap and stack non-executable
>   - Because many buffer overflow attacks aim at executing code in the data that overflowed the buffer
> - Does not prevent "return into libc" overflow attacks
>   - Because the return address of the function on the stack points to a standard "C" function (e.g., "system"), this attack does not execute code on the stack
> - e.g., ExecShield for Fedora Linux (used to be RedHat Linux)

**Expansion.**

- **W⊕X ("write xor execute").** A memory page is either writable or executable, never both: the stack and the heap (data) are writable but not executable, the code is executable but not writable. Injected shellcode in a buffer can therefore never run. Hardware support (the NX/XD bit) arrived with the AMD64 processors in 2003-2004; **ExecShield** (Red Hat, 2003) emulated it on older x86 CPUs using segment limits, and also randomised addresses.
- **Return-into-libc.** The attacker overwrites the return address with the address of an existing function, typically `system()`, and arranges the stack so that its argument points to the string `"/bin/sh"`. No injected code is executed, so W⊕X does not help. Its generalisation, **return-oriented programming** (ROP, 2007), chains short fragments of existing code ending in `ret` ("gadgets") to perform arbitrary computation. Defences against code reuse are ASLR (randomise where `system()` is), stack canaries (Slide 24) and control-flow integrity (e.g., the shadow stacks of Intel CET).

### Slide 24 · Canaries on a Stack

> - Add a few bytes containing special values between variables on the stack and the return address.
> - Before the function returns, check that the values are intact.
>   - If not, there has been a buffer overflow!
>     - Terminate program
> - If the goal was a Denial-of-Service, then it still happens, but at least the machine is not compromised
> - If the canary can be read by an attacker, then a buffer overflow exploit can be made to rewrite it

**Expansion.** The mechanism of Lecture 3, Slide 41, in a nutshell:

- A contiguous overflow that runs from a local buffer up to the return address must cross the canary first (the stack grows down, the buffer grows up: Lecture 3, Slide 7), so overwriting the return address without changing the canary is impossible **for a linear overflow**.
- On detection the only safe reaction is to **terminate**: the stack is already corrupted, and continuing would be unsafe. Hence the trade-off on the slide: integrity is preserved (no code execution), availability is not (denial of service).
- **Secrecy is essential.** If the attacker can read the canary (an information leak, e.g., a `%x` format-string read, Lecture 4, or an over-read like Heartbleed), they include the correct value in the overflow and the check passes. On forking servers the canary is inherited by every child process, so it can even be guessed one byte at a time (the "Blind ROP" attack).

### Slide 25 · StackGuard - Detect

> Add Canary Word next to return address
>
> - Observation (true only for BO)
>   - Return address is unaltered IFF canary word is unaltered (?)
> - Guessing the Canary?
>   - Randomize
> - When compiling the function, it adds prologue and epilogue
>   - Before execution of function, push word canary into canary vector
>     - in addition to the stack
>   - After execution, before returning from function check whether canary is intact
>   - Function returns ONLY if canary is intact

![Lecture 8, page 25](L08_p25.webp "40% 715x551")

**Figure.** A stack frame drawn from high addresses (**FFFF**, top) to low addresses (**0000**, bottom): **Attack code**, an empty slot, **return address**, **canary**, **Local variables**, **buffer**. An arrow labelled **String Growth** points up and one labelled **Stack Growth** points down; a curved arrow goes from the return address up to the attack code: the hijack that the canary is placed to detect.

**Expansion.**

- **The observation and its "(?)".** For a classic buffer overflow (a contiguous write upward from a buffer), the return address can only change if the canary changes too, so checking the canary is as good as checking the return address. The question mark is deserved: the equivalence holds only for linear overflows, and a write through a corrupted pointer can change the return address and skip the canary (Slides 28-29).
- **Guessing the canary → randomize.** A fixed canary could simply be included in the exploit. StackGuard chooses a **random** canary when the program starts, or uses a *terminator canary* made of bytes such as NUL, CR, LF and 0xFF that string functions cannot copy (Lecture 3, Slide 41).
- **Prologue and epilogue.** The compiler inserts code at the start of each function (prologue: write the canary next to the return address, keeping its reference value in a separate "canary vector") and at the end (epilogue: compare the copy on the stack with the reference before `ret`). Only if they are equal does the function return; otherwise the program is aborted. GCC's `-fstack-protector` does the same, with the reference value in thread-local storage (`%fs:0x28` on x86-64 Linux) and the failure handler `__stack_chk_fail`, which prints `*** stack smashing detected ***`.

### Slide 26 · StackGuard - Prevent

> - While function is active, make the return address read-only
>   - attacker cannot change the return address
>   - any attempt will be detected
>   - Use a library called **MemGuard**
> - mark virtual memory pages as read-only and trap every write
>   - legitimate writes to stack cause trap
>   - Performance penalty

**Expansion.** Instead of *detecting* the overwrite after the fact, the MemGuard variant of StackGuard *prevents* it: the word holding the return address is made read-only while the function runs, so an overflow that reaches it causes a trap at the moment of the write. The problem is granularity: memory protection works on whole **pages** (typically 4 KB), and the return address shares its page with all the other stack data that the program legitimately writes all the time. Every such write traps into the kernel, which must check whether it touched a protected word and emulate it otherwise: an enormous **performance penalty**. This is why detection (canaries) won; precise protection of return addresses came back only with hardware support, the **shadow stacks** of Intel CET and Arm's pointer authentication (Lecture 3, Slide 42).

### Slide 27 · Canary Implementations

> - StackGuard
> - Stack-Smashing Protector (SSP)
>   - gcc modification
>   - Used in OpenBSD
>   - http://www.trl.ibm.com/projects/security/ssp/
> - Windows: /GS option for Visual C++ .NET
> - These can be useful when testing too!

**Expansion.**

- **SSP / ProPolice** (Hiroaki Etoh, IBM Research Tokyo) improved StackGuard: besides the canary it **reorders the local variables**, placing arrays above scalars and pointers so that an overflow cannot reach them before the canary (Lecture 3, Slide 42). It was adopted by OpenBSD and became GCC's standard `-fstack-protector` (GCC 4.1, 2006); the `-fstack-protector-strong` variant (GCC 4.9) is the common default today. (The IBM URL on the slide is no longer online.)
- **Microsoft `/GS`** (from Visual C++ .NET 2002) inserts a "security cookie" with the same idea; it is on by default in modern Visual Studio.
- **Useful when testing**: a canary failure points straight at the function whose buffer overflowed, so protected builds turn silent stack corruption into a reproducible crash during testing and fuzzing, the same role as AddressSanitizer (Slide 14).

### Slides 28-29 · StackGuard Bypass

> (28)
>
> - Guarding a stack is not the answer, as B.O. is not a stack problem but a pointer problem (controlling a pointer --the instruction pointer in this case--).
> - Consider a function with several local variables, some of which are pointers: if we overflow B, we can overwrite pointer A. If this is a function pointer, it will be called, then pointing to our code.
>
> (29)
>
> - The return address can be overwritten without touching the canary value (trampolining)
> - Another possibility is to modify pointer A to point to a structure that holds function pointers, modifying an address there; point one of these back to buffer. If function gets called and buffer still around, control achieved.

![Lecture 8, page 28](L08_p28.webp "21% 383x786") ![Lecture 8, page 29](L08_p29.webp "25% 451x786")

**Figure (pages 28-29).** The stack frame of the function, from the top: **Arguments**, **Return Address**, **canary**, **LocVar: buffer A**, **LocVar: pointer A**, **LocVar: buffer B**, then two empty slots. On page 29 an arrow is added on the right, going from **LocVar: pointer A** up to **Return Address**.

**Expansion.** Why the canary is not the end of the story:

- **The attack of page 28.** Buffer B lies *below* pointer A in the frame, so an upward overflow of B overwrites A without ever reaching the canary, which sits above buffer A. If A is a **function pointer** that the function calls later, the call jumps wherever the attacker wants, e.g., into shellcode in buffer B; the canary check, done only at return, never fires. The canary protects one pointer (the return address), but the real asset is *every* pointer that steers the program: hence "a pointer problem, not a stack problem".
- **The trampoline of page 29 (the arrow).** If A is a data pointer through which the function later writes (`*A = value`, with `value` also controlled by the attacker), the attacker sets A to the address of the return address: the write lands directly on the return address, skipping the canary, which stays intact. The overwrite happens indirectly, through a pointer, instead of as a contiguous overflow.
- **Corrupting function-pointer tables.** Pointing A at a structure of function pointers (a C++ virtual table, the GOT entry of a library function, a list of `atexit` handlers) and overwriting one entry with the address of the buffer gives control when that function is next called.
- **Defences.** SSP reorders local variables so that buffers sit above pointers (Slide 27; Lecture 3, Slide 42); PointGuard encrypts pointers (Lecture 3, Slide 42); RELRO makes the GOT read-only; control-flow integrity restricts indirect calls to legitimate targets; and non-executable memory (Slide 23) stops "jump into the buffer", though not code reuse.

## Arithmetic issues (pages 30-33)

### Slide 30 · Arithmetic Issues

> - In mathematics, integers form an infinite set, but in systems they are binary strings of fixed length (precision), so a finite set. Familiar rules of arithmetic do not apply.
> - In unsigned 8-bit integer arithmetic
>   1. 255+1= 0,
>   2. 16 X 17=16 and
>   3. 0-1=255
> - In particular, a negative value (as in 3.) can be interpreted as a 'large' positive one

**Expansion.** Machine integers are arithmetic **modulo 2ⁿ**: unsigned 8-bit values live in 0..255, and every result is reduced modulo 256.

- 255 + 1 = 256 ≡ **0** (wrap-around, overflow);
- 16 × 17 = 272 = 256 + 16 ≡ **16**;
- 0 - 1 = -1 ≡ **255** (wrap-around below zero).

In C, **unsigned** arithmetic is defined to wrap like this, while **signed** overflow is *undefined behaviour*: in practice it usually wraps in two's complement, but the compiler may assume it never happens and delete the checks that rely on it. Conversions are the other trap: a negative signed value reinterpreted as unsigned (for example, when passed to a `size_t` parameter) becomes a huge positive number, -1 becomes 0xFFFFFFFF = 4,294,967,295 in 32 bits. Integer errors are dangerous because lengths and sizes are integers: a wrapped size makes a bounds check pass or an allocation too small, and the buffer overflow follows (Lecture 3, Slides 22-32; Lecture 1, Slide 12).

### Slide 31 · Example (case 1)

> Consider the following code snippet that copies two character strings into a buffer and checks the combined length so they fit
>
> ```c
> char buf [128]
> combine(char *s1, size_t len1, char *s2,size_t len2) {
>     if (len1+len2+1 <= sizeof(buf)) {
>     strncpy(buf, s1, len1);
>     strncat(buf, s2, len2);
>     }
>  }
> ```
>
> The system could be attacked by constructing s1 so that len1<= sizeof(buf) and set len2=0xFFFFFFFF (as unsigned integer, it corresponds to 4294967295)
>
> Now, since len1+0xFFFFFFFF+1 = len1 <= sizeof(buf), the strncat is executed and the buffer is overrun.

(On the slide the declaration of `buf` has no semicolon and `combine` has no return type; `void` is meant.)

**Code analysis.**

- *What the code does.* `combine` concatenates `s1` (of length `len1`) and `s2` (of length `len2`) into the global 128-byte buffer `buf`; the `if` is meant to guarantee that both strings plus the terminating NUL fit.
- *Vulnerability: the check itself overflows.* `len1 + len2 + 1` is computed in `size_t`, an unsigned type that wraps modulo 2³² on a 32-bit system (as on the slide; 2⁶⁴ on 64-bit systems). With `len2 = 0xFFFFFFFF`, the addition `len2 + 1` wraps to 0, so the sum is just `len1`, which passes the test whenever `len1 <= 128`.
- *Exploit.* Inside the `if`, `strncat(buf, s2, len2)` may append up to 4,294,967,295 characters, i.e., it is effectively unbounded. It copies all of `s2` (attacker-controlled, as long as the attacker likes) after `s1`, far past the end of `buf`: a classic buffer overflow, here in the data segment, enabled by an integer overflow.
- *Fix.* Check each length separately, in a form that cannot wrap:

```c
char buf[128];

int combine(const char *s1, size_t len1, const char *s2, size_t len2) {
    if (len1 >= sizeof(buf) || len2 >= sizeof(buf) - len1)
        return -1;                      /* does not fit: reject */
    memcpy(buf, s1, len1);              /* now len1 + len2 + 1 <= sizeof(buf) */
    memcpy(buf + len1, s2, len2);
    buf[len1 + len2] = '\0';
    return 0;
}
```

The test `a + b < max` is rewritten as `b < max - a` after checking `a < max`, so no intermediate result can wrap (the same rearrangement as in the fixed version of Lecture 1, Slides 40-42). GCC and Clang also offer checked arithmetic (`__builtin_add_overflow`). The lengths must of course be the real lengths of the strings: the caller computes them with `strlen`, or the function measures them with `strnlen`.

### Slide 32 · Example (case 2)

> Consider the following code snippet:
>
> ```c
> int main(int argc, char* argv[])
>  { char _t[10]
>    char p[]="xxxxxxx"; char k[]="zzzz";
>    strncpy(_t, p, sizeof(_t);
>    strncat(_t, k, sizeof(_t) - strlen(_t)-1);
>    return 0;
>  }
> ```
>
> After execution, the resulting string in `_t` is xxxxxxxzz;
>
> Now if we supply 10 chars in p (xxxxxxxxxx), then sizeof(`_t`) and strlen(`_t`) are equal and the third argument is -1.
>
> Since strncat expects unsigned as third argument, it is interpreted as 0xFFFFFFFF and therefore the strcat is unbounded and the buffer is overrun again.

(On the slide the strings use typographic quotes and the minus sign is an en dash, `char _t[10]` has no semicolon and the `strncpy` call is missing its closing parenthesis; in real C they are `"..."`, `-`, `char _t[10];` and `strncpy(_t, p, sizeof(_t));`.)

**Code analysis.**

- *What the code intends.* Copy `p` into the 10-byte `_t`, then append as much of `k` as still fits, keeping one byte for the terminator: the third argument of `strncat` is computed as the space left, `sizeof(_t) - strlen(_t) - 1`. With the 7-character `p`, `_t` holds "xxxxxxx", the space left is 10 - 7 - 1 = 2, and `strncat` appends "zz": `_t` becomes "xxxxxxxzz" (9 characters plus the NUL), as the slide says.
- *Vulnerability 1: the non-terminated `strncpy`.* If `p` has 10 or more characters, `strncpy(_t, p, sizeof(_t))` fills all 10 bytes and writes **no NUL terminator** (Lecture 3, Slides 18-21). `strlen(_t)` then reads past the end of `_t` until it happens to meet a zero byte, so it returns at least 10 (the slide assumes exactly 10).
- *Vulnerability 2: the subtraction wraps.* `sizeof(_t) - strlen(_t) - 1` is computed in `size_t`, which is unsigned: 10 - 10 - 1 is not -1 but 0xFFFFFFFF (2³² - 1 on 32 bits, 2⁶⁴ - 1 on 64 bits). `strncat` receives a huge limit, so it behaves like an unbounded `strcat`: it appends all of `k` after the unterminated contents, writing past the end of `_t` on the stack. A stack overflow, reachable whenever the attacker controls `p`.
- *Fix.* Terminate after `strncpy` and compute the remaining space only when it is positive, or better, use a function that takes the **destination size**:

```c
char t[10];
strncpy(t, p, sizeof t - 1);
t[sizeof t - 1] = '\0';                  /* always terminated: strlen(t) <= 9 */
size_t used = strlen(t);
if (used < sizeof t - 1)                 /* room left for at least one character */
    strncat(t, k, sizeof t - used - 1);  /* cannot wrap: used <= 8 here */

/* or simply: snprintf(t, sizeof t, "%s%s", p, k);  truncates, never overflows */
```

### Slide 33 · Important Lesson

> - Declare all integers as unsigned integers, unless negative ones are really needed. While measuring size of objects, negative ones are not needed. If compiler flags signed-unsigned mismatch, check if both representations are needed; if so, care needed to the checks implemented.
> - Most arithmetic bugs are caused by type mismatch

**Expansion.**

- **Why unsigned for sizes.** Sizes and lengths can never be negative, and the C library uses the unsigned `size_t` for them. Storing a length in a signed `int` invites the bug of Lecture 3, Slides 22-25: a negative length passes a `len < MAX` check and then becomes a huge `size_t` in `malloc` or `read`. Using `size_t` throughout removes the signed-to-unsigned conversion where the damage happens.
- **But unsigned is not a cure.** Slides 31-32 show that unsigned arithmetic wraps too: `a + b` and `a - b` on `size_t` must still be checked before they are computed (`b <= max - a`, `a >= b`). The real lesson is the second bullet: **mixing types** (signed and unsigned, 32 and 64 bits, `short` and `int` as in Lecture 3, Slides 29-30) is where most arithmetic bugs come from.
- **Let the compiler help.** Enable `-Wall -Wextra -Wsign-compare -Wconversion` and treat signed/unsigned warnings as real issues (the slide's "if compiler flags signed-unsigned mismatch"); use checked-arithmetic builtins (`__builtin_add_overflow`, `__builtin_mul_overflow`) and `calloc` for `n * size` (Lecture 3, Slides 31-32); test with UndefinedBehaviorSanitizer (`-fsanitize=undefined`, plus Clang's `-fsanitize=integer`). The SEI CERT C rules INT30-C, INT31-C and INT32-C cover exactly these cases.

## Buffer overflows and Java (pages 34-35)

### Slide 34 · Buffer Overflow in Java?

> - Not really, since Java has a type-safe memory model, and 'falling off' the end of an object is not possible.
> - Exploits against Java-based systems are typically language-based (type confusion) attacks and trust exploits (code signing errors)
> - Problem overflows typically occur in supporting code external to the JVM: use, by Java-based services, of components and services written in weakly typed languages like C and C++
> - Java supports loading of DLLs and code libraries, so that exported functions can be used directly

**Expansion.**

- **Why Java code itself cannot overflow.** Every array access is bounds-checked by the JVM, objects are reached only through typed references, there is no pointer arithmetic, and memory is managed by the garbage collector (Slide 9). An out-of-bounds index raises `ArrayIndexOutOfBoundsException` instead of corrupting memory.
- **What attacks Java instead.** *Type confusion*: bugs in the JVM or in the bytecode verifier that let code treat an object as a different type (e.g., an `int[]` as an object reference), breaking the memory model from inside; many sandbox escapes of Java applets worked this way. *Trust exploits*: abusing the code-signing and permission model (a signed applet running with full privileges, a forged or wrongly validated signature).
- **The JVM sits on native code.** The JVM itself, the native parts of the standard library (image and font decoders, compression, networking) and every native library loaded through the **Java Native Interface (JNI)** are written in C/C++. An overflow there is a real memory-corruption bug inside the Java process, reachable from Java with crafted input; several critical Java vulnerabilities were overflows in the native image-processing libraries of the JRE. The same holds for every "safe" language with a native interface (Python C extensions, `unsafe` Rust, C# P/Invoke).

### Slide 35 · Example (Java calling native code)

> ```java
> Public class MyJavaPacketEngine extends Thread
> {
>   public MyJavaPacketEngine ()
>     {
>         }
>   static
>   {
>   System.loadLibrary("packet_driver32");
>     }
> }
> ```
>
> Now calls can be made directly to the DLL.
>
> For example
>
> ```c
> wsprintf(lpAdapter->SymbolicLink,
>  TEXT("\\\\.\\%s%s"), DOSNAMEPREFIX,
>  p_AdapterName);
> ```
>
> Assigns the binding string to an unterminated string buffer

(On the slide the strings are delimited by pairs of typographic single quotes, and `class` is preceded by `Public` with a capital P; in real Java and C they are `"..."` and `public`.)

**Code analysis.**

- *What the code does.* The Java class loads a native library, `packet_driver32` (`packet_driver32.dll` on Windows), in its static initializer: `System.loadLibrary` runs when the class is loaded, and from then on the class's `native` methods are implemented by C code that runs outside the protection of the JVM. The second fragment is C code inside such a driver (it resembles the adapter-opening code of the WinPcap packet-capture library): `wsprintf` formats the device name, `\\.\` followed by `DOSNAMEPREFIX` and `p_AdapterName`, into `lpAdapter->SymbolicLink`.
- *Vulnerability.* `wsprintf` is the Windows equivalent of `sprintf`: it writes the whole formatted string with **no limit tied to the size of the destination** (its only limit is an internal maximum of 1024 characters). `p_AdapterName` is an adapter name that may come, through JNI, from the Java side, so it is attacker-influenced. If the formatted name is longer than `SymbolicLink` can hold, the write runs past the end of the field and corrupts the rest of the adapter structure and whatever follows it in memory. The slide's sentence ("assigns the binding string to an unterminated string buffer") points at the same weakness: nothing bounds the copy to the size of the buffer, so it is not guaranteed to fit, or to be properly terminated within it.
- *Exploit.* A long adapter name passed from the Java application overflows `SymbolicLink` inside the native library: memory corruption inside the Java process, which Java's bounds checks cannot prevent because they never see this memory.
- *Fix.* Use a size-bounded, always-terminating call, and validate the input at the JNI boundary:

```c
HRESULT hr = StringCchPrintf(lpAdapter->SymbolicLink,
                             _countof(lpAdapter->SymbolicLink),
                             TEXT("\\\\.\\%s%s"), DOSNAMEPREFIX, p_AdapterName);
if (FAILED(hr)) {
    /* name too long: reject it instead of truncating or overflowing */
}
```

`StringCchPrintf` (from `Strsafe.h`, Lecture 3, Slide 49) takes the size of the destination, always NUL-terminates, and fails instead of overflowing; `_snwprintf_s` or `snprintf` are alternatives. On the Java side, check the length and the characters of the adapter name before passing it to native code: input validation at the trust boundary (Lecture 5).
