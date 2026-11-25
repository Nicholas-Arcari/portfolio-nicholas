const e=`Lecture 3 is the heart of the course: the buffer overflow, historically the number-one software vulnerability. It explains why C and C++ allow it, how the process memory layout and the call stack make it exploitable, a long series of "spot the defect" code snippets with the bug and the fix, and the run-time and development-time countermeasures. The slide deck has 55 pages. The "spot the defect" snippets are the most exam-relevant part of the whole course.

## The problem (pages 2-6)

### Slide 2 · Essence of the problem

> Suppose in a C program we have an array of length 4:
>
> \`char buffer[4]\`
>
> What happens if we execute the statement below?
>
> \`buffer[4]='a'\`
>
> **Anything** can happen!
>
> If the data written (i.e. the "a") is user input that can be controlled by an attacker, this vulnerability can be exploited: anything that the attacker wants can happen.

**Expansion.** The array \`char buffer[4]\` has valid indices 0, 1, 2, 3. Writing \`buffer[4]\` touches the fifth element, one past the end. In C this is not an error that the language reports; it is **undefined behaviour**, so the standard places no requirement at all on what happens next.

- In practice the byte lands on whatever is stored right after the array in memory: another local variable, a saved register, a loop counter, the function's saved return address, or allocator metadata. The outcome ranges from "nothing visible" (the byte fell in unused padding) to a wrong result, a crash (segmentation fault), or full attacker control of the program.
- The phrase **"anything can happen"** is literal. If the attacker controls the data *and* the amount written, they can overwrite a saved return address and redirect execution. This is why a memory-safety bug is treated as potentially critical even when, during testing, it only seems to corrupt a nearby variable.
- A single out-of-bounds element is enough to matter; the rest of the lecture is about the many ways this one kind of mistake is made.

### Slide 3 · Solution to the problem

> Check array bounds at runtime
>
> \\- Algol 60 proposed this back in 1960!
>
> Unfortunately, C and C++ have not adopted this solution, for efficiency reasons.
>
> (Ada, Perl, Python, Java, C#, and even Visual Basic have.)
>
> As a result, buffer overflows have been the no 1 security problem in software ever since.

**Expansion.** The fix has been known since 1960: on every array access, check that the index is within bounds, and raise an error otherwise.

- **Why C does not do it.** C was designed (1972) for systems programming as "portable assembler": the programmer, not the language, is responsible for safety, and every machine instruction has a predictable cost. A bounds check adds a comparison and a branch to each access, which the designers judged too expensive, especially in tight loops. The philosophy is "trust the programmer" and "you don't pay for what you don't use".
- **Languages that do check**: Java, C#, Python, and others carry the length with each array and check every access, throwing an exception (\`ArrayIndexOutOfBoundsException\` in Java) on a violation. The overflow becomes a controlled, non-exploitable error.
- **Modern view on the cost.** The compiler can often prove an index is in range and remove the check, so the real overhead is a few percent. Rust gets memory safety with bounds checks and a compile-time ownership system at near-C performance, which is why it is now promoted as a C replacement (Slide 55 and Lecture 1).

### Slide 4 · Problems caused by buffer overflows

> - The first *Internet worm*, and all subsequent ones (CodeRed, Blaster, ...), exploited buffer overflows
> - Buffer overflows cause in the order of 50% of all security alerts
>   - Eg check out CERT, cve.mitre.org, or bugtraq
> - Trends
>   - Attacks are getting cleverer, defeating even more clever countermeasures
> - Attacks are getting easier to do, by script kiddies

**Expansion.**

- **The worms.** The Morris worm (1988) used a stack overflow in \`fingerd\` (which read input with \`gets\`). **Code Red** (2001) exploited an overflow in Microsoft IIS's indexing service; **Blaster** (2003) exploited the Windows DCOM RPC service (MS03-026). Each turned one memory-safety bug into worldwide, automatic compromise.
- **"About 50%".** For two decades memory-safety bugs were roughly half of all serious vulnerabilities. The share has fallen in managed languages but remains dominant in C/C++ code bases: Microsoft and Google both report around 70% of their severe vulnerabilities are memory-safety issues.
- **Sources.** *CERT* (CERT/CC at Carnegie Mellon) issues advisories; *cve.mitre.org* is the CVE list; *Bugtraq* was the historic full-disclosure mailing list.
- **Two opposite trends.** Attacks grow *more sophisticated* (defeating each new defence: NX answered by return-oriented programming, ASLR answered by information leaks) and simultaneously *easier to launch* (exploit frameworks such as Metasploit, point-and-click tools), so even unskilled "script kiddies" can run advanced exploits written by others.

### Slide 5 · Problems caused by buffer overflows: who is at risk

> Any C(++) code acting on untrusted input is at risk. Eg
>
> - code taking input over untrusted network
>   - eg. sendmail, web browser, wireless network driver, ...
> - code taking input from untrusted user on multi-user system,
>   - esp. services running with high privileges (as ROOT on Unix/Linux, as SYSTEM on Windows)
> - code acting on untrusted files
>   - that have been downloaded or emailed
> - also embedded software, eg. in devices with (wireless) network connection such as mobile phones with Bluetooth, wireless smartcards, airplane navigation

**Expansion.** The common factor is *untrusted input reaching C/C++ code* (Lecture 1, Slides 20-21).

- **Network input**: any program that parses bytes from the network: mail servers (sendmail), browsers, and especially low-level code such as wireless/Bluetooth drivers, which process attacker-chosen packets in the kernel with full privileges (e.g., the 2017 BroadPwn and Broadcom Wi-Fi driver overflows).
- **Privileged local services**: a buffer overflow in a program running as *root* or *SYSTEM*, or in a *setuid-root* binary, turns into a full privilege escalation. The extra privilege is what makes the bug valuable.
- **Untrusted files**: a crafted document, image, video or font processed by a vulnerable parser (a media library, a PDF reader, a font engine) runs code just by being opened. This is the FFmpeg case of Lecture 1 and the typical phishing-attachment vector.
- **Embedded and wireless devices**: phones, smartcards, cars and avionics run C with few protections and are hard to update, so overflows there are both likely and long-lived.

### Slide 6 · Memory Management in C/C++

> - Program responsible for its memory management
> - Memory management is very error-prone
>   - Who here has had a C(++) program crash with a segmentation fault?
> - Typical bugs:
>   - Writing past the bound of an array
>   - Dangling pointers
>     - missing initialisation, bad pointer arithmetic, incorrect de-allocation, double de-allocation, failed allocation, ...
> - Memory leaks
> - For efficiency, these bugs are not detected at runtime, as discussed before:
>   - behaviour of a buggy program is undefined

**Expansion.** In C/C++ the programmer allocates, uses and frees memory by hand, and each step can go wrong. The main memory-error families (all exploitable, not just crashes):

- **Out-of-bounds access** (the buffer overflow): reading or writing before the start or past the end of an array (CWE-125 read, CWE-787 write).
- **Dangling pointer / use-after-free** (CWE-416): using memory through a pointer after it has been freed; if the allocator has reused that memory for another object, the attacker can corrupt it. Caused by freeing too early, keeping a pointer to a local variable after the function returns, etc.
- **Missing initialisation** (CWE-457): reading an uninitialised variable or \`malloc\`'d block, whose contents are unpredictable and may leak previous data.
- **Bad pointer arithmetic**: computing an address wrongly (off-by-one, wrong element size) and then dereferencing it.
- **Incorrect or double free** (CWE-415): freeing the same block twice, or freeing something not returned by \`malloc\`, which corrupts allocator metadata.
- **Failed allocation**: \`malloc\` returns \`NULL\` on failure; dereferencing it without checking crashes (or, historically, was exploitable).
- **Memory leak** (CWE-401): never freeing memory; in a long-running server this is a slow denial of service.

A *segmentation fault* is the OS catching an access to memory the process may not touch; many memory bugs do *not* fault (they corrupt memory the process is allowed to use), which is exactly what makes them dangerous rather than merely annoying.

## Process memory and the stack (pages 7-13)

### Slide 7 · Process Memory Layout

![Lecture 3, page 7](L03_p07.webp "50% 1400x806")

**Figure.** A diagram of a process's virtual address space, high addresses at the top:

| Region | Contents | Grows |
| --- | --- | --- |
| High addresses | Command-line arguments / environment variables | - |
|  | **Stack** | downwards, by procedure calls |
|  | *Unused memory* (the gap the stack and heap grow into) | - |
|  | **Heap** (dynamic data) | upwards, e.g. by \`malloc\` and \`new\` |
|  | **Static data** (\`.data\`) | - |
| Low addresses | **Program code** (\`.text\`) | - |

**Expansion.** A running program's memory is divided into regions, each with a purpose and typical permissions:

- **Text (\`.text\`)**: the machine code. Read-only and executable, so the program cannot (and should not) modify its own instructions.
- **Static/global data**: variables that live for the whole run. \`.data\` holds initialised globals; \`.bss\` holds those initialised to zero. Read-write, not executable.
- **Heap**: dynamically allocated memory (\`malloc\`/\`free\`, \`new\`/\`delete\`), managed by the allocator; it grows towards higher addresses. Overflows here are *heap overflows*.
- **Stack**: local variables, function parameters, saved return addresses and saved registers, organised in *activation records* (stack frames). On x86 and most architectures the stack grows *downwards*, towards lower addresses. Overflows here are *stack overflows* (next slides).
- **Arguments/environment**: \`argv\` and the environment variables, placed at the top.
- **The key tension.** The stack grows down and the heap grows up, into the unused gap between them. Crucially, a **buffer grows upwards (towards higher addresses) while the stack grows downwards**, so writing past the end of a stack buffer moves *towards* the saved return address, which sits at a higher address than the buffer. That opposition is the whole mechanism of the classic stack-smashing attack.

### Slides 8-11 · Stack Overflow (the mechanism)

![Lecture 3, page 8](L03_p08.webp "50% 1400x821")

![Lecture 3, page 9](L03_p09.webp "50% 1400x818")

![Lecture 3, page 10](L03_p10.webp "50% 1400x815")

![Lecture 3, page 11](L03_p11.webp "50% 1400x814")

**Figure.** The same picture is built up over four slides. The call stack is drawn as a column of activation records, with \`AR main()\` above \`AR f()\`. The frame of \`f\` is expanded on the right, from high address (top) to low address (bottom):

\`\`\`
   x                 <- parameter of f (higher address)
   return address    <- where f returns to in main
   buf[4..7]         <- upper half of buf
   buf[0..3]         <- lower half of buf (lower address)
\`\`\`

The code shown:

\`\`\`c
void f(int x) {
    char buf[8];
    gets(buf);
}
void main() {
    f(...); ...
}
void format_hard_disk(){...}
\`\`\`

A red arrow shows that overflowing \`buf\` upwards overwrites the saved **return address**, redirecting the control flow of the program (on the later slides it points into \`format_hard_disk\`). \`buf[0..3]\` and \`buf[4..7]\` turn red as they are overflowed. A speech bubble on \`gets(buf)\` reads **"NEVER use gets()!"**.

**Expansion: how a stack smash works, step by step.**

1. **Call.** When \`main\` calls \`f\`, the CPU pushes the **return address** (the address of the instruction in \`main\` after the call) onto the stack; then \`f\`'s prologue sets up the frame and reserves space for the local \`buf\`.
2. **Layout.** Because the stack grew *down* to build the frame, \`buf\` sits at a *lower* address than the saved return address. The buffer is filled from its start *upwards*, i.e., towards the return address.
3. **Overflow.** \`gets(buf)\` copies input until a newline or end-of-file, with **no limit**. If the input is longer than 8 bytes, it keeps writing past \`buf\`, over \`buf[4..7]\`, then over the saved return address, then over \`x\`.
4. **Hijack.** When \`f\` finishes, the \`ret\` instruction jumps to whatever is now stored where the return address was. The attacker chooses the overflowing bytes so that this value points where they want: here, at \`format_hard_disk\`, a function that would otherwise never be called. In a real attack it points at injected *shellcode* (code placed in the buffer itself) or, when the stack is non-executable, at existing code (return-to-libc, ROP; Lecture 8).

**Why \`gets\` must never be used.** \`gets(buf)\` cannot be given the size of \`buf\`; it simply cannot be used safely with any input the attacker can lengthen. It was removed from the C standard in C11. The safe replacement is \`fgets(buf, sizeof buf, stdin)\` (Slide 14), which takes the buffer size.

### Slide 12 · Stack Overflow: lots of details to get right

> - Lots of details to get right:
>   - No nulls in (character-)strings
>   - Filling in the correct return address:
>     - Fake return address must be precisely positioned
>     - Attacker might not know the address of his own string
>   - Other overwritten data must not be used before return from function
> - …

**Expansion.** Writing a *reliable* exploit (not just causing a crash) is fiddly; these are the classic obstacles, and each one inspired a tool or technique:

- **No NUL bytes.** String functions (\`gets\`, \`strcpy\`) stop at the first \`'\\0'\`. If the payload must contain a zero byte (common in addresses), the copy stops there and truncates the exploit. Attackers craft NUL-free shellcode (alphanumeric or self-modifying) to avoid this.
- **Precise return address.** The overwritten return address must land exactly on the saved-return-address slot and hold a usable target. The attacker must know the stack layout and the buffer's offset to it.
- **Not knowing the exact address of the payload.** Stack addresses vary between runs (and ASLR deliberately randomises them). The old workaround is a **NOP sled**: a long run of no-op instructions before the shellcode, so that an approximate jump still slides down into the payload.
- **Collateral data must survive.** The overflow also overwrites other locals and the saved registers between \`buf\` and the return address; if the function uses them *before* returning, it may crash first. The payload must keep those values sane.

These details are what make exploitation a skill, and also what the countermeasures target (canaries detect the overwrite, ASLR hides the addresses, NX stops execution of the buffer).

### Slide 13 · Stack Overflow: stack vs heap, and causes

> - **Stack overflow** is overflow of a buffer allocated on the stack
> - **Heap overflow** idem, of buffer allocated on the heap
>
> Common causes:
>
> - poor programming with of arrays and strings
>   - esp. library functions for null-terminated strings
> - problems with format strings
>
> But other low-level coding defects than can result in buffer overflows, eg integer overflows or data races

**Expansion.**

- **Stack vs heap overflow.** A *stack* overflow overwrites the orderly frame layout (locals, saved registers, return address), so it most directly targets the return address. A *heap* overflow overwrites whatever follows the buffer on the heap: adjacent objects or the allocator's metadata (chunk headers, free-list pointers). Heap exploits corrupt that metadata so that a later \`malloc\`/\`free\` writes an attacker-chosen value to an attacker-chosen address. Crucially, **stack canaries do not protect the heap** (Slide 43).
- **Most common cause**: misuse of C string functions on NUL-terminated strings (\`strcpy\`, \`strcat\`, \`sprintf\`, \`gets\`), covered next.
- **Format strings** (Slide 37 onwards) are a second route to the same memory corruption.
- **Indirect causes**: an *integer overflow* produces a wrong (too small, or negative-turned-huge) size that is then used in an allocation or copy, causing a buffer overflow (Slides 22-23, 29-32); a *data race* (Lecture 11) can let a size or pointer change between a check and its use.

## Spot the defect: string functions (pages 14-21)

### Slide 14 · Example: gets()

\`\`\`c
char buf[20];
gets(buf); // read user input until
           // first EoL or EoF character
\`\`\`

> - Never use gets
> - Use fgets(buf, size, stdin) instead

**Code analysis.**

- *Vulnerability.* \`gets\` reads from standard input into \`buf\` until a newline or end-of-file, with **no way to limit the number of bytes**. Any input longer than 19 characters (20 minus the terminator) overflows \`buf\` and smashes the stack. This is CWE-242, Use of Inherently Dangerous Function.
- *Fix.* \`fgets(buf, sizeof buf, stdin)\` reads at most \`sizeof buf - 1\` characters and always NUL-terminates. Note that \`fgets\` keeps the trailing newline, which \`gets\` stripped, so code that relied on that must trim it:

\`\`\`c
char buf[20];
if (fgets(buf, sizeof buf, stdin) != NULL) {
    buf[strcspn(buf, "\\n")] = '\\0';   // remove the trailing newline, if any
}
\`\`\`

### Slide 15 · Example: strcpy()

\`\`\`c
char dest[20];
strcpy(dest, src); // copies string src to dest
\`\`\`

> - strcpy assumes that
>   - dest is long enough
>   - src is null-terminated
> - Use strncpy(dest, src, size) instead

**Code analysis.**

- *Vulnerability.* \`strcpy\` copies bytes from \`src\` until it meets a \`'\\0'\`, with no knowledge of the size of \`dest\`. If \`src\` is longer than 19 characters, or is not NUL-terminated at all (so the copy runs until it happens to hit a zero byte somewhere in memory), \`dest\` overflows. The two unstated assumptions, "\`dest\` is long enough" and "\`src\` is NUL-terminated", are exactly what an attacker violates.
- *Fix.* \`strncpy(dest, src, sizeof dest)\` copies at most \`sizeof dest\` bytes, but note the subtlety that Slide 21 makes explicit: \`strncpy\` does **not** add a terminator if the source is too long, so the result may be non-terminated. The genuinely safe idiom caps the length and forces termination (Slide 21), and better still uses \`snprintf\` or the BSD \`strlcpy\`.

### Slide 16-17 · Spot the defect: strncat

\`\`\`c
char buf[20];
char prefix[] = "http://";
...
strcpy(buf, prefix);
   // copies the string prefix to buf
strncat(buf, path, sizeof(buf));
   // concatenates path to the string buf
\`\`\`

**The professor's answer (page 17):** *"strncat's 3rd parameter is number of chars to copy, not the buffer size. Another common mistake is giving sizeof(path) as 3rd argument..."*

**Code analysis.**

- *Vulnerability.* The third argument of \`strncat(dst, src, n)\` is the **maximum number of characters to append**, *not* the size of the destination buffer. \`strncat\` writes up to \`n\` characters **plus** a terminating \`'\\0'\`, and it appends them *after* the existing contents of \`dst\`. Here \`buf\` already holds \`"http://"\` (7 characters), and the code then permits appending up to \`sizeof(buf)\` = 20 more, so it can write 7 + 20 + 1 = 28 bytes into a 20-byte buffer: an overflow.
- The "other common mistake", passing \`sizeof(path)\`, is just as wrong: it bounds the copy by the size of the *source*, which again has nothing to do with the space left in \`dst\`.
- *Fix.* The third argument must be the **space remaining** in the destination, leaving room for the terminator:

\`\`\`c
char buf[20];
strcpy(buf, "http://");                    // 7 chars + '\\0'
strncat(buf, path, sizeof(buf) - strlen(buf) - 1);  // only the space left
\`\`\`

Or, more robustly, build the whole string with a size-checked call:

\`\`\`c
char buf[20];
int n = snprintf(buf, sizeof buf, "http://%s", path);
if (n < 0 || (size_t)n >= sizeof buf) {
    /* output was truncated: handle the error */
}
\`\`\`

\`snprintf\` always respects the buffer size and always NUL-terminates (when the size is non-zero), and it reports the length that *would* have been written, so truncation is detectable. The BSD \`strlcat(buf, path, sizeof buf)\` (Slide 48) takes the destination size directly and is another clean fix.

### Slides 18-20 · Spot the defect: non-terminated strncpy

\`\`\`c
char src[9]; char dest[9];
char base_url = "www.ru.nl";
strncpy(src, base_url, 9);
    // copies base_url to src
strcpy(dest, src);
    // copies src to dest
\`\`\`

**The professor's answer (pages 19-20):** *"base\\_url is 10 chars long, incl. its null terminator, so src won't be null-terminated ... so strcpy will overrun the buffer dest."*

**Code analysis.**

- *Setup.* \`"www.ru.nl"\` is 9 visible characters plus the terminator = **10 bytes**. (The slide writes \`char base_url = ...\`, which should be \`char base_url[] = ...\` or \`char *base_url = ...\`; the single-character form does not compile, and is a typo.)
- *Vulnerability.* \`strncpy(src, base_url, 9)\` copies exactly 9 bytes, the 9 letters, and stops **before** the terminator. The critical property of \`strncpy\`: if the source is as long as, or longer than, the count, it does **not** append a \`'\\0'\`. So \`src\` holds 9 letters and is *not* NUL-terminated.
- *Consequence.* \`strcpy(dest, src)\` then copies from \`src\` until it finds a \`'\\0'\`. Since \`src\` has none, \`strcpy\` reads past the end of \`src\`, through whatever bytes follow in memory, until it stumbles on a zero byte, writing all of them into the 9-byte \`dest\`, an overflow of \`dest\` (and an over-read of \`src\`). This is CWE-170, Improper Null Termination.
- *Fix.* Reserve room for the terminator and set it explicitly, and make \`dest\` big enough:

\`\`\`c
char src[10], dest[10];
const char *base_url = "www.ru.nl";
strncpy(src, base_url, sizeof src - 1);
src[sizeof src - 1] = '\\0';          // guarantee termination
strcpy(dest, src);                   // now safe: src fits and is terminated
\`\`\`

### Slide 21 · Example: strcpy and strncpy (the correct idiom)

> Don't replace \`strcpy(dest, src)\` by \`strncpy(dest, src, sizeof(dest))\` but by
>
> \`strncpy(dest, src, sizeof(dest)-1)\`
>
> \`dst[sizeof(dest-1)] = '\\0';\`
>
> if dest should be null-terminated!
>
> Btw: a *strongly typed programming language* could of course enforce that strings are always null-terminated...

**Expansion.** This slide states the rule behind the previous two defects. Because \`strncpy\` does not terminate when the source is too long, the safe replacement is:

\`\`\`c
strncpy(dest, src, sizeof(dest) - 1);   // copy at most size-1 bytes
dest[sizeof(dest) - 1] = '\\0';          // force the terminator into the last slot
\`\`\`

- **Note on the slide's second line.** It reads \`dst[sizeof(dest-1)]\`, which is a typo: \`sizeof(dest-1)\` would take the size of a *pointer* (because \`dest-1\` is pointer arithmetic that decays the array to a pointer), not the array size minus one. The intended expression is \`dest[sizeof(dest) - 1] = '\\0';\`. The variable is also \`dest\`, not \`dst\`. Getting this exactly right is itself error-prone, which is the slide's deeper point.
- **\`strncpy\` has a second trap**: if the source is *shorter* than the count, \`strncpy\` pads the rest of the destination with \`'\\0'\` bytes, which can be a performance cost for large buffers. \`strncpy\` was designed for fixed-width fields, not for safe string copying; \`snprintf\` or \`strlcpy\` express the intent better.
- **The closing remark** repeats the course theme: a stronger type system (a real string type that always carries its length and terminator, as in Java, C#, Rust or C++'s \`std::string\`) removes this entire class of bug by construction.

## Spot the defect: integer issues and bad parsing (pages 22-36)

### Slides 22-25 · Spot the defect: negative length from the network

\`\`\`c
char *buf;
int i, len;
read(fd, &len, sizeof(len));
       // read sizeof(len) bytes, ie. an int
       // and store these in len
buf = malloc(len);
read(fd, buf, len);
\`\`\`

**The professor's answer (pages 23-25):** *"We forget to check for bytes representing a negative int, so len might be negative ... len cast to unsigned and negative length overflows ... read then goes beyond the end of buf."* And then: *"Remaining problem may be that buf is not null-terminated."*

**Code analysis.** This is the classic "length field from the network" bug, the shape of countless real CVEs.

- *Vulnerability 1: attacker-controlled signed length.* \`len\` is a signed \`int\` read straight from the file/socket, so the attacker fully controls it, including **negative** values. Nothing validates it.
- *Vulnerability 2: the signed-to-unsigned conversion.* \`malloc\` takes a \`size_t\`, which is **unsigned**. A negative \`int\` such as -1 converts to a huge \`size_t\` (on 64-bit, 2^64 - 1). The allocation then either fails (returning \`NULL\`, which is used unchecked) or, for a value such as a negative number that wraps to a small positive size, succeeds with a buffer far smaller than the attacker intends.
- *Vulnerability 3: the over-read/over-write.* The third argument of \`read\` is also a \`size_t\`; the negative \`len\` becomes an enormous count, so \`read\` writes far past the end of \`buf\`: a heap overflow driven purely by the length field.
- *Residual issue (Slide 24).* Even after fixing the length, \`buf\` holds raw bytes with no terminator, so any later string operation on it over-reads.
- *Fix (Slide 25 plus validation).* The slide adds one byte and terminates:

\`\`\`c
buf = malloc(len + 1);
read(fd, buf, len + 1);   // the slide's correction
buf[len] = '\\0';          // null terminate buf
\`\`\`

but the real fix must *validate the length first*, because without that the \`len + 1\` can itself wrap:

\`\`\`c
int32_t len;
if (read_full(fd, &len, sizeof len) != sizeof len)   return -1;
if (len < 0 || len > MAX_MESSAGE)                     return -1;  // reject hostile lengths
char *buf = malloc((size_t)len + 1);
if (buf == NULL)                                      return -1;  // check malloc
if (read_full(fd, buf, (size_t)len) != (size_t)len) { free(buf); return -1; }
buf[len] = '\\0';
\`\`\`

(\`read\` can also return *fewer* bytes than requested, so a correct version loops until \`len\` bytes arrive, shown here as \`read_full\`.) Define a sane upper bound \`MAX_MESSAGE\` and reject anything outside \`[0, MAX_MESSAGE]\`.

### Slide 26 · Absence of language-level security

> In programming languages with "security" provisions, the programmer would not have to worry about
>
> - writing past the bounds of the array (\`IndexOutOfBoundsException\` for example)
> - implicit conversion from signed to unsigned integers (forbidden or warned by compiler/typechecker)
> - \`malloc\` returning null value (\`OutOfMemoryException\` for example)
> - \`malloc\` non initializing memory (by default)
> - integer overflow (\`IntegerOverflowException\` for example)

**Expansion.** Every bug on the previous slides exists because C leaves these five checks to the programmer. A safer language removes whole classes at once:

- **Bounds checks** turn an overflow into a caught exception (Java's \`ArrayIndexOutOfBoundsException\`, a Python \`IndexError\`, a Rust panic).
- **Signed/unsigned conversions** are forbidden or warned (Java has no unsigned types in this sense; Rust requires an explicit cast and the \`as\` conversion is visible; \`-Wconversion\`/\`-Wsign-conversion\` warn in C).
- **Allocation failure** is an exception or a \`Result\`, not a silent \`NULL\` that is later dereferenced.
- **Memory is zero-initialised by default** (Java fields, Go), so no uninitialised reads.
- **Integer overflow** is detected: Python integers are unbounded; C# has \`checked\` blocks; Rust panics on overflow in debug builds and offers \`checked_add\`, \`saturating_add\`, \`wrapping_add\`. In C, \`-fsanitize=undefined\` detects signed overflow at run time.

The lecture's recurring moral: the same discipline a safe language enforces automatically must be applied by hand, on every line, in C.

### Slides 27-28 · Spot the defect: ANSI/Unicode size mismatch (the Code Red bug)

\`\`\`c
#ifdef UNICODE
#define _sntprintf _snwprintf
#define TCHAR wchar_t
#else
#define _sntprintf _snprintf
#define TCHAR char
#endif

TCHAR buff[MAX_SIZE];
_sntprintf(buff, sizeof(buff), "%s\\n", input);
\`\`\`

**The professor's answer (page 28):** *"\\_snwprintf's 2nd param is # of chars in buffer, not # of bytes. The CodeRed worm exploited such an ANSI/Unicode mismatch."*

**Code analysis.** This is a Windows idiom: \`TCHAR\` is \`char\` in an ANSI build and \`wchar_t\` (2 bytes on Windows) in a Unicode build, and \`_sntprintf\` maps to the matching narrow or wide function.

- *Vulnerability.* The count argument of the wide function \`_snwprintf\` is a **number of characters**, not a number of **bytes**. In a Unicode build each character is 2 bytes, so \`sizeof(buff)\` = \`MAX_SIZE * 2\` bytes. Passing \`sizeof(buff)\` as the character count tells \`_snwprintf\` it may write \`MAX_SIZE * 2\` wide characters, i.e., up to \`MAX_SIZE * 4\` bytes, into a buffer of only \`MAX_SIZE * 2\` bytes: a 2x overflow.
- *The general trap*: confusing \`sizeof\` (bytes) with element count whenever the element is larger than one byte. It is invisible in the ANSI build (where \`char\` is 1 byte and the numbers coincide), so it survives testing and only breaks in the Unicode configuration.
- *Real-world impact*: **Code Red** (2001) exploited exactly this kind of ANSI/Unicode length confusion in Microsoft IIS's URL handling to overflow a buffer, and spread to hundreds of thousands of servers.
- *Fix.* Pass the size in the unit the function expects, the number of elements, using a count that works in both builds:

\`\`\`c
TCHAR buff[MAX_SIZE];
_sntprintf(buff, _countof(buff), _T("%s\\n"), input);  // _countof = sizeof(a)/sizeof(a[0])
buff[_countof(buff) - 1] = _T('\\0');                  // _sntprintf may not NUL-terminate on overflow
\`\`\`

\`_countof(buff)\` is \`sizeof(buff)/sizeof(buff[0])\`, the element count regardless of character width. Note also that \`_sntprintf\`/\`_snprintf\` on Windows do not always NUL-terminate on truncation, so the terminator must be forced in.

### Slides 29-30 · Spot the defect: short integer overflow in a length

\`\`\`c
#define MAX_BUF = 256
void BadCode (char* input)
{   short len;
    char buf[MAX_BUF];
    len = strlen(input);
    if (len < MAX_BUF) strcpy(buf, input);
}
\`\`\`

![Lecture 3, page 30 (2)](L03_p30_2.webp "50% 1188x405")

**The professor's answer (page 30):** *"What if input is longer than 32K? len will be a negative number, due to integer overflow, hence: potential buffer overflow. The integer overflow is the root problem, but the buffer overflow that this enables make it exploitable."*

**Code analysis.**

- *Vulnerability.* \`len\` is a \`short\`, typically a 16-bit signed integer, with range -32768 to 32767. \`strlen(input)\` returns a \`size_t\`; if \`input\` is longer than 32767 bytes, assigning it to \`short len\` overflows, and \`len\` becomes **negative** (e.g., a length of 32768 becomes -32768). The guard \`if (len < MAX_BUF)\` then passes trivially, because a negative number is less than 256, and \`strcpy\` copies the whole over-long \`input\` into the 256-byte \`buf\`: a large stack overflow.
- *Chain of causes.* The **root cause is the integer overflow** (a too-narrow type holding an attacker-controlled size), and the **buffer overflow is the exploitable consequence**. This is the lecture's recurring point that an integer bug becomes a memory-safety bug when the bad number is used as a size.
- *Side note.* \`#define MAX_BUF = 256\` is itself wrong: the macro expands to \`= 256\`, so \`char buf[MAX_BUF]\` becomes \`char buf[= 256]\`, which does not compile. The correct form is \`#define MAX_BUF 256\` (no \`=\`).
- *Fix.* Use the right (unsigned, wide enough) type and compare against the real capacity:

\`\`\`c
#define MAX_BUF 256
void betterCode(const char *input) {
    size_t len = strlen(input);          // size_t: unsigned, cannot go negative
    if (len < MAX_BUF) {                 // room for the terminator too (len <= 255)
        char buf[MAX_BUF];
        memcpy(buf, input, len + 1);     // or snprintf(buf, sizeof buf, "%s", input);
    } else {
        /* input too long: reject it */
    }
}
\`\`\`

### Slides 31-32 · Spot the defect: integer overflow in an allocation size

\`\`\`c
bool CopyStructs(InputFile* f, long count)
{   structs = new Structs[count];
    for (long i = 0; i < count; i++)
        { if !(ReadFromFile(f,&structs[i])))
              break;
        }
}
\`\`\`

**The professor's answer (page 32):** *"effectively does a malloc(count\\*sizeof(type)) which may cause integer overflow. And this integer overflow can lead to a buffer overflow. (Microsoft Visual Studio 2005(!) C++ compiler adds check to prevent this)."*

**Code analysis.**

- *Vulnerability.* \`new Structs[count]\` must allocate \`count * sizeof(Structs)\` bytes. If \`count\` is attacker-controlled (it comes from the file being parsed) and large, the product **overflows** the integer used to compute the allocation size and wraps to a small value. The allocator then returns a *small* buffer, but the loop still iterates \`count\` times writing \`structs[i]\`, far past the small allocation: a heap overflow. (On 32-bit systems with \`count\` around 2^28 and a 16-byte struct, the product wraps past 2^32.)
- *Why it is subtle*: the multiplication is implicit in the array-\`new\`, so there is no visible \`*\` to flag. The same bug occurs with \`malloc(count * size)\` written by hand.
- *Historical note*: the slide's remark that Visual Studio 2005 added an automatic overflow check on array \`new\` shows that even compiler vendors recognised this as common enough to mitigate in the toolchain.
- *Fix.* Check the multiplication before allocating, and allocate with a primitive that checks internally:

\`\`\`c
if (count < 0 || (size_t)count > SIZE_MAX / sizeof(Structs))
    return false;                               // product would overflow: reject
Structs *structs = (Structs*)calloc((size_t)count, sizeof(Structs));  // calloc checks count*size
if (structs == NULL)
    return false;
\`\`\`

\`calloc(n, size)\` is required to detect overflow of \`n * size\` and fail safely; in C++ the standard array-\`new\` now throws \`std::bad_array_new_length\` on such overflow. Always validate \`count\` against a sane maximum first.

### Slides 33-36 · Spot the defect: hand-written URL copy loop

\`\`\`c
char buff1[MAX_SIZE], buff2[MAX_SIZE];
// make sure url a valid URL and fits in buff1 and buff2:
if (!isValid(url)) return;
if (strlen(url) > MAX_SIZE - 1) return;
// copy url up to first separator, ie. first '/', to buff1
out = buff1;
do {
   // skip spaces
    if (*url != ' ') *out++ = *url;
} while (*url++ != '/');
strcpy(buff2, buff1);
...
\`\`\`

**The professor's answers (pages 34-36):** *"what if there is no '/' in the URL?"* - the fix on page 35 adds \`&& (*url != 0)\` to the loop condition - and then page 36: *"Order of tests is wrong (note the first test includes ++). What about 0-length URLs? Is buff1 always null-terminated?"*

**Code analysis.** The loop copies characters of \`url\` into \`buff1\`, skipping spaces, until it meets a \`/\`. Several defects hide in it.

- *Defect 1: no terminator check (pages 33-34).* The loop stops only on \`/\`. If the URL contains no \`/\`, the \`while (*url++ != '/')\` keeps reading and copying past the end of the \`url\` string (past its \`'\\0'\`), through arbitrary memory, overflowing \`buff1\`. The initial \`strlen(url) <= MAX_SIZE-1\` check does *not* save it, because that length is measured "up to the first null", whereas the loop can run past that null.
- *Defect 2: wrong order of tests (pages 35-36).* The page-35 fix appends \`&& (*url != 0)\`, but the first clause \`*url++ != '/'\` has already **incremented \`url\`** (post-increment) before the second clause is evaluated, so the zero byte is tested one position too late, after \`url\` has moved past it. Side effects (\`++\`) in a compound condition evaluated left to right make the check off-by-one.
- *Defect 3: zero-length URLs.* A \`do ... while\` runs the body at least once, so an empty URL is still processed, reading \`*url\` when there may be nothing valid to read.
- *Defect 4: \`buff1\` not NUL-terminated.* The loop copies characters but never writes a \`'\\0'\` into \`buff1\`. The following \`strcpy(buff2, buff1)\` then reads past the end of \`buff1\` until it finds some zero byte, overflowing \`buff2\` (the same non-termination bug as Slides 18-20).
- *Fix.* Stop on the separator **or** the terminator, bound the output index explicitly, and terminate the result:

\`\`\`c
char buff1[MAX_SIZE], buff2[MAX_SIZE];
if (!isValid(url)) return;
if (strlen(url) > MAX_SIZE - 1) return;

size_t j = 0;
for (size_t i = 0; url[i] != '\\0' && url[i] != '/' && j < MAX_SIZE - 1; i++) {
    if (url[i] != ' ')
        buff1[j++] = url[i];
}
buff1[j] = '\\0';                 // always terminate
if (j < sizeof buff2)            // buff1 now fits, and is terminated
    strcpy(buff2, buff1);
\`\`\`

The condition tests for the terminator *and* the separator *before* advancing, and a separate output index \`j\` is kept strictly below \`MAX_SIZE - 1\` so the buffer can never be overrun.

## Format strings (pages 37-39)

### Slide 37 · Spot the defect: printf(argv\\[1\\])

\`\`\`c
#include <stdio.h>
int main(int argc, char* argv[])
{   if (argc > 1)
        printf(argv[1]);
    return 0;
}
\`\`\`

> This program is vulnerable to *format string attacks*, where calling the program with strings containing special characters can result in a buffer overflow attack.

**Code analysis.**

- *Vulnerability.* \`printf\`'s first argument is a **format string**, and here it is \`argv[1]\`, which comes straight from the attacker. If the argument contains format specifiers (\`%x\`, \`%s\`, \`%n\`, ...), \`printf\` interprets them and reads (or writes) arguments that were never passed. This is CWE-134, Use of Externally-Controlled Format String. Format strings are previewed here and are the full subject of Lecture 4.
- *Fix.* Never pass untrusted data as the format string. Supply a constant format and put the data in an argument:

\`\`\`c
printf("%s", argv[1]);   // argv[1] is data, not a format
\`\`\`

### Slide 38 · Format String attacks

> - Complete new type of attack, invented/discovered in 2000. Like integer overflows, it can lead to buffer overflows.
> - Strings can contain special characters, eg \`%s\` in \`printf("Cannot find file %s", filename);\` Such strings are called format strings
> - What happens if we execute the code below? \`printf("Cannot find file %s");\`
> - What may happen if we execute \`printf(string)\` where string is user-supplied? Esp. if it contains special characters, eg \`%s\`, \`%x\`, \`%n\`, \`%hn\`?

**Expansion.**

- A format string tells \`printf\` how many arguments to expect and of what type. In a correct call, \`printf("...%s...", filename)\`, the number of specifiers matches the number of extra arguments, and all is well.
- \`printf("Cannot find file %s")\` has a \`%s\` but **no corresponding argument**. \`printf\` still reads where that argument *would* be (the next slot in the calling convention: a register or a stack position) and treats whatever is there as a \`char*\`, then dereferences it, usually crashing or leaking memory.
- \`printf(string)\` with an attacker-controlled \`string\` lets the attacker put *any* specifiers they like, turning a print statement into a tool for reading and writing memory (detailed next).

### Slide 39 · Format String attacks: %x and %n

> - \`%x\` reads and prints 4 bytes from stack
>   - this may leak sensitive data
> - \`%n\` writes the number of characters printed so far onto the stack
>   - this allow stack overflow attacks...
> - Note that format strings break the "don't mix data & code" principle.
> - Easy to spot & fix: replace \`printf(str)\` by \`printf("%s", str)\`

**Expansion.**

- **\`%x\` reads memory (information disclosure).** Each \`%x\` makes \`printf\` fetch and print the next "argument" from the stack as hexadecimal. Since no real arguments were supplied, these are actually stack contents: saved registers, local variables, pointers, possibly secrets such as the stack canary or addresses that defeat ASLR. A string of \`%x %x %x ...\` dumps the stack upward. \`%s\` is worse: it treats the fetched value as a pointer and prints the string it points to, leaking arbitrary memory (or crashing).
- **\`%n\` writes memory (the dangerous one).** \`%n\` is unusual: instead of printing, it **writes** the number of characters output so far to the address given by the corresponding argument. With a controlled format string, the attacker places a target address in the string and uses width specifiers (e.g., \`%100x\`) to control the count, writing an arbitrary value to an arbitrary address, enough to overwrite a return address or a function pointer and hijack control. \`%hn\` writes a 16-bit \`short\`, used to write a 4-byte address two bytes at a time.
- **The principle.** Format string bugs are a textbook violation of *"don't mix data and code"*: user data (the string) is interpreted as code (format directives). This is the same root cause as buffer overflows (data treated as a return address) and injection (data treated as SQL or HTML), one of the three generalisations on Slide 54.
- **The fix is trivial**: use a constant format string, \`printf("%s", str)\`. Because it is so easy to spot and fix, compilers warn about it (\`-Wformat -Wformat-security\`), and \`%n\` is disabled or restricted on many platforms (Windows, FORTIFY\\_SOURCE).

## Countermeasures (pages 40-52)

### Slide 40 · Dynamic Countermeasures

> Protection by kernel
>
> - Non-executable memory (NOEXEC) - Prevents attacker executing her code
> - Address space layout randomisation (SLR) - Generally makes attacker's life harder
> - Instruction set randomisation - Hardware support needed to make this efficient enough
>
> Protection inserted by the compiler
>
> - Stack canaries to prevent or detect malicious changes to the stack; examples to follow
> - Obfuscation of memory addresses
>
> Doesn't prevent against heap overflows

**Expansion.** These defences do not remove the bug; they make a bug harder to *exploit*. Lecture 8 covers them in depth.

- **Non-executable memory (NX / DEP / W^X).** Memory is either writable or executable, never both. Data pages (stack, heap) are marked non-executable, so shellcode written into a buffer cannot run. The CPU's NX bit enforces it. Attackers respond with **code reuse** (return-to-libc, return-oriented programming), which executes existing code instead of injecting new code.
- **Address Space Layout Randomisation (ASLR; the slide's "SLR").** The base addresses of the stack, heap, libraries and (with PIE) the executable are randomised on each run, so the attacker cannot hard-code the addresses an exploit needs. It is defeated by an *information leak* (e.g., a \`%x\` format bug, Slide 39) that reveals an address, or by brute force on 32-bit systems where the entropy is small.
- **Instruction Set Randomisation (ISR).** The program's instructions are encoded (e.g., XORed) with a secret key, so injected code, not encoded with that key, decodes to garbage and faults. It needs hardware or emulation support to be efficient, so it is mostly research.
- **Stack canaries** and **address obfuscation** are inserted by the compiler (next slides).
- **The crucial caveat on the slide: none of these stops heap overflows.** Canaries guard the return address on the *stack*; NX and ASLR raise the bar everywhere but do not prevent corruption of heap data or metadata.

### Slide 41 · Dynamic Countermeasures: Stack Canaries

> - introduced in StackGuard in gcc
> - a dummy value - stack canary or cookie - is written on the stack in front of the return address and checked when function returns
> - a careless stack overflow will overwrite the canary, which can then be detected.
> - a careful attacker can overwrite the canary with the correct value.
> - additional countermeasures:
>   - use a random value for the canary
>   - XOR this random value with the return address
>   - include string termination characters in the canary value

**Expansion.** The name is from the "canary in a coal mine": a sentinel that dies first to warn of danger.

- **Mechanism.** The function prologue writes a secret value (the canary/cookie) on the stack **between the local buffers and the saved return address**. The epilogue, just before \`ret\`, re-reads it and compares it with the stored reference. A linear overflow that reaches the return address must first overwrite the canary, so the mismatch is detected and the program aborts (\`*** stack smashing detected ***\`) instead of returning to attacker code.
- **The weakness.** An attacker who can *read* the canary (via an information leak) or who overwrites memory non-linearly (e.g., through a pointer) can leave the canary intact or rewrite it with its correct value, defeating the check.
- **Hardening the canary** (the three sub-bullets):
  - *Random value*: choose the canary randomly at program start, so it cannot be guessed. (This is the standard **terminator-and-random** design.)
  - *XOR with the return address*: store \`canary XOR return_address\`, so the check also detects a changed return address and the correct canary alone is not enough.
  - *Terminator canary*: include string-terminator bytes (\`'\\0'\`, \`'\\n'\`, \`0xFF\`) in the canary, so that string functions like \`strcpy\`, which stop at those bytes, cannot copy a forged canary through.
- In GCC/Clang this is \`-fstack-protector\`, \`-fstack-protector-strong\` (common default) and \`-fstack-protector-all\`; on Windows it is \`/GS\`.

### Slide 42 · Further Improvements

> - **PointGuard** - also protects other data values, eg function pointers, with canaries
> - **ProPolice's Stack Smashing Protection (SSP)** by IBM - also re-orders stack elements to reduce potential for trouble
> - **Stackshield** has a special stack for return addresses, and can disallow function pointers to the data segment

**Expansion.**

- **PointGuard** encrypts pointers (including function pointers) in memory by XORing them with a secret key, decrypting only when a pointer is used. An attacker who overwrites an encrypted pointer cannot control where it points after decryption. It generalises the canary idea from the return address to all pointers.
- **ProPolice / SSP** (IBM, the basis of GCC's stack protector) adds a canary *and* **reorders local variables** so that arrays (buffers) are placed *above* scalar variables and pointers in the frame. Then an array overflow cannot corrupt those scalars/pointers before reaching the canary, shrinking what an overflow can damage.
- **StackShield** keeps a separate **shadow stack** of return addresses: on entry it saves the real return address in a protected area, and on exit it restores or checks against that copy, so overwriting the on-stack return address has no effect. It can also forbid jumps into the data segment. The modern hardware version is Intel CET's shadow stack (Lecture 2, Slide 14).

### Slide 43 · Dynamic Countermeasures: imperfections

> NB none of these protections is perfect! Eg
>
> - even if attacks to return addresses are caught, integrity of other data on the stack can still be abused
> - clever attacks may leave canaries intact
> - where do you store the "master" canary value
>   - a cleverer attack could change it
> - none of this protects against heap overflows
>   - eg buffer overflow within a struct...
> - ....

**Expansion.** The lecture insists these are *mitigations*, not cures, because the underlying bug is still there.

- **Other stack data.** A canary protects only the return address. An overflow can still corrupt *other* locals *below* the canary and use them maliciously (a data-only attack: overwrite an "isAdmin" flag, a length, or a pointer that is used before the function returns, so the canary is never even checked).
- **Canaries left intact.** Non-linear writes (through a corrupted pointer or array index) can reach the return address without touching the canary; an information leak reveals the canary so it can be rewritten correctly.
- **Storing the master canary.** The reference value has to live somewhere; if the attacker can find and change it (or the per-function copy), the check passes. Its secrecy is an assumption.
- **Heap overflows (repeated for emphasis).** Stack canaries do nothing for the heap. An overflow of a buffer *inside a struct* can overwrite a later field of the same struct, e.g., a function pointer, with no stack involved at all. Heap hardening is a separate problem (safe unlinking, heap cookies, allocator hardening).

### Slide 44 · Other Countermeasures (when to act)

> We can take countermeasures at different points in time
>
> - before we even begin programming
> - during development
> - when testing
> - when executing code
>
> to prevent, to detect - at (pre)compile time or at runtime -, and to mitigate problems with buffer overflows

**Expansion.** This frames the remaining slides as a defence-in-depth timeline, matching the SDLC of Lecture 1:

- *Before programming*: choose a memory-safe language, reduce the attack surface, train developers.
- *During development*: use safer libraries and APIs, enable compiler warnings and hardening flags.
- *When testing*: code review, static analysis, fuzzing, sanitizers, even formal verification.
- *When executing*: the run-time defences of Slides 40-43 (NX, ASLR, canaries).

The three verbs are *prevent* (stop the bug being written or being reachable), *detect* (find it before or during execution), *mitigate* (limit the damage when it is exploited).

### Slide 45 · Prevention

> - Don't use C or C++
> - Better programmer awareness & training. Eg read - and make other people read -
>   - Building Secure Software, J. Viega & G. McGraw, 2002
>   - Writing Secure Code, M. Howard & D. LeBlanc, 2002
>   - 19 deadly sins of software security, M. Howard, D LeBlanc & J. Viega, 2005
>   - Secure programming for Linux and UNIX HOWTO, D. Wheeler
>   - Secure C coding, T. Sirainen
>   - The Secure Coding Cookbook for C and C++ by John Viega and Matt Messier
>   - Secure Coding: Principles and Practices by Robert Seacord, 2013

**Expansion.** The two prevention strategies:

- **Avoid C/C++ where possible**, i.e., use a memory-safe language (Java, C#, Go, Python, Rust). This removes the entire class by construction. The reading list is the classic secure-coding canon; Robert Seacord's work is tied to the **SEI CERT C Coding Standard**, the most authoritative set of rules for those who *must* write C.
- **Awareness and training**: since much code must still be written in C/C++, developers need to know the pitfalls, exactly what these "spot the defect" slides teach.

### Slide 46 · Dangerous C system calls

![Lecture 3, page 46](L03_p46.webp "50% 1400x796")

**Figure.** A risk-ranked table of C library functions:

| Risk | Functions |
| --- | --- |
| Extreme risk | \`gets\` |
| High risk | \`strcpy\`, \`strcat\`, \`sprintf\`, \`scanf\`, \`sscanf\`, \`fscanf\`, \`vfscanf\`, \`vsscanf\`, \`streadd\`, \`strecpy\`, \`strtrns\`, \`realpath\`, \`syslog\`, \`getenv\`, \`getopt\`, \`getopt_long\`, \`getpass\` |
| Moderate risk | \`getchar\`, \`fgetc\`, \`getc\`, \`read\`, \`bcopy\` |
| Low risk | \`fgets\`, \`memcpy\`, \`snprintf\`, \`strccpy\`, \`strcadd\`, \`strncpy\`, \`strncat\`, \`vsnprintf\` |

**Expansion.** The ranking reflects how easy each function is to misuse with untrusted input.

- **\`gets\` (extreme)**: no size argument at all, unusable safely, removed from C11.
- **High risk**: functions that write without a size limit (\`strcpy\`, \`strcat\`, \`sprintf\`), read into buffers without bounds (\`scanf\`/\`sscanf\`/\`fscanf\` with \`%s\`), or return attacker-influenced data of unbounded length (\`getenv\`, \`getpass\`, \`realpath\`). \`realpath\` historically assumed a \`PATH_MAX\` buffer; \`syslog\` is risky because of format strings.
- **Moderate**: read one or a few bytes (\`getc\`, \`fgetc\`, \`read\`, \`bcopy\`); misuse is possible but the blast radius is smaller.
- **Low risk**: the size-bounded functions (\`fgets\`, \`snprintf\`, \`strncpy\`, \`strncat\`, \`vsnprintf\`, \`memcpy\`). Note "low" is **not** "safe": as the earlier slides showed, \`strncpy\`/\`strncat\`/\`memcpy\` are all misusable (non-termination, wrong size argument, wrong unit). They are preferable *when used correctly*.

### Slides 47-49 · Prevention: use better libraries

> (47) there is a choice between using statically vs dynamically allocated buffers
>
> - static approach easy to get wrong, and chopping user input may still have unwanted effects
> - dynamic approach susceptible to out-of-memory errors, and need for failing safely
>
> (48) libsafe.h / libverify / strlcpy / strlcat ; (49) glib.h Gstring / Strsafe.h / C++ string class

**Expansion.** Better string-handling building blocks, with their trade-offs.

- **Static vs dynamic buffers (Slide 47).** *Static* (fixed-size) buffers are simple but easy to overflow, and silently *truncating* over-long input can itself cause bugs (a cut-off path or URL that then means something different). *Dynamic* buffers (grown as needed) avoid truncation but can fail to allocate, so the code must handle out-of-memory *safely* (not crash, not continue with a \`NULL\`).
- **libsafe / libverify (Slide 48).** \`libsafe\` intercepts the dangerous functions (\`strcpy\`, etc.) at run time and prevents them writing beyond the current stack frame; \`libverify\` additionally keeps copies of return addresses on the heap and checks them. Both are run-time wrappers, not fixes to the code.
- **\`strlcpy\` / \`strlcat\` (Slide 48).** BSD functions that take the **size of the destination** (not a count of characters to copy) and *always* NUL-terminate: \`strlcpy(dst, src, sizeof dst)\`. They are the clean answer to the \`strncpy\`/\`strncat\` traps of Slides 16-21 and are used consistently in OpenBSD.
- **glib \`GString\` (Slide 49).** A dynamically growing, always-terminated string type for C; the caveat is that an allocation failure aborts the program, which may be unacceptable for a server.
- **Microsoft \`Strsafe.h\` (Slide 49).** Functions (\`StringCchCopy\`, \`StringCchCat\`, ...) that always take the destination size and guarantee NUL-termination.
- **C++ \`std::string\` (Slide 49).** Manages its own memory and length, removing manual buffer handling, but \`.data()\`/\`.c_str()\` hand back a raw \`char*\` (historically \`.data()\` was not guaranteed NUL-terminated before C++11), so the moment you drop back to C APIs the old risks return.

### Slide 50 · Detection (before shipping)

> - Testing - Difficult! How to hit the right cases? Fuzz testing - test for crash on long, random inputs - can be successful in finding some weaknesses
> - Code reviews - Expensive & labour intensive
> - Code scanning tools (aka static analysis) Eg RATS (also for PHP, Python, Perl), Flawfinder, ITS4, Deputy, Splint, PREfix, PREfast by Microsoft plus other commercial tools

**Expansion.** Three detection techniques (expanded in Lectures 6 and 7):

- **Testing / fuzzing.** Ordinary testing rarely hits the exact over-long or malformed input that triggers an overflow. *Fuzzing* feeds huge numbers of long, random or malformed inputs and watches for crashes; combined with sanitizers (ASan) it is very effective at finding memory bugs, and is the (possible) course project.
- **Code review.** Humans reading the code find defects that tools miss (especially logic and design flaws), but it is slow and expensive.
- **Static analysis (code scanning).** Tools examine the source without running it, flagging dangerous patterns (\`gets\`, unchecked \`strcpy\`, tainted data reaching a copy). *RATS*, *Flawfinder* and *ITS4* are simple pattern matchers; *Splint* and *Deputy* do deeper analysis; *PREfix/PREfast* are Microsoft's. They scale and run on every build, at the cost of false positives and false negatives.

### Slide 51 · More prevention & detection: program verification

> The most extreme form of static analysis:
>
> - Program verification - Proving by mathematical means (eg hoare logic) that memory management of a program is safe - Extremely labour-intensive - E.g. hypervisor verification project by microsoft & verisoft.

**Expansion.** *Formal verification* proves mathematically, for **all** inputs, that the program satisfies a property (here, memory safety), rather than merely testing some inputs. **Hoare logic** reasons about code with preconditions and postconditions (\`{P} C {Q}\`). It gives the strongest assurance but is extremely labour-intensive and needs specialist skill, so it is reserved for small, critical components. The cited **VCC** project verified the Microsoft Hyper-V hypervisor; **Verisoft** was a German project to verify a whole system stack; other landmarks are the **seL4** verified microkernel and the **CompCert** verified C compiler (Lecture 2, Slide 25).

### Slide 52 · Reducing attack surface

> Not running or even installing certain software, or enabling all features by default, mitigates the threat

**Expansion.** The least code running is the least code to attack. *Attack-surface reduction* means: do not install software you do not need; do not run services you do not use; do not enable optional features by default; close ports; drop privileges. A buffer overflow in a component that is never installed or never reachable cannot be exploited. This is the design principle of *economy of mechanism* and *secure defaults* (Lecture 10), and it also recalls the Tandberg lesson of Lecture 1 (ship debug features disabled).

## Summary and generalisation (pages 53-55)

### Slide 53 · Summary

> - Buffer overflows are the top security vulnerability
> - Any C(++) code acting on untrusted input is at risk
> - Getting rid of buffer overflow weaknesses in C(++) code is hard (and may prove to be impossible)
>   - Ongoing arms race between countermeasures and ever more clever attacks.
>   - Attacks are not only getting cleverer, using them is getting easier

**Expansion.** The honest conclusion: in C/C++, buffer overflows cannot be fully eliminated by discipline alone, only made rarer and harder to exploit. Defences and attacks co-evolve (canaries → leaks, NX → ROP, ASLR → info leaks), and tooling makes advanced attacks usable by anyone. The only way to *remove* the class is to change language (Slide 55).

### Slide 54 · More general

> Buffer overflow is an instance of three more general problems:
>
> 1. Lack of *input validation*
> 2. Mixing *data & code* - Data and return address on the stack
> 3. Believing in & relying on an *abstraction* - In this case, the abstraction of procedure calls offered by C
>
> Attacks often exploit holes in abstractions that are not 100% enforced

**Expansion.** This slide generalises the whole lecture into three themes that recur throughout the course:

1. **Lack of input validation.** The overflow happens because the program trusts input it never checked for length or content (Lecture 5). Validate at the boundary.
2. **Mixing data and code.** On the stack, *data* (the buffer) and *control information* (the saved return address) live together, so writing data can overwrite control. The same confusion underlies format strings (data read as format directives), SQL injection (data read as SQL), and XSS (data read as HTML/JS). "Don't mix data and code" is a master principle.
3. **Relying on a leaky abstraction.** C offers the *abstraction* of structured procedure calls (call/return), but does not *enforce* it: the return mechanism is just a value on a writable stack. Attacks exploit the gap between the abstraction (functions always return to their caller) and the implementation (a return address that anyone can overwrite). Whenever an abstraction is not 100% enforced, attackers live in the gap.

### Slide 55 · Moral of the story

> - Don't use C(++), if you can avoid it - But use a language that provides memory safety, such as java or C#
> - If you do have to use c(++), become or hire an expert
> - Reading - A Comparison of Publicly Available Tools for Dynamic Buffer Overflow Prevention, by John Wilander and Mariam Kakkar

**Expansion.** The practical takeaways:

- **Prefer a memory-safe language.** Java, C#, Go, Python and especially **Rust** (memory-safe without a garbage collector, suitable for systems code) eliminate buffer overflows by design. This matches the industry's current direction (CISA and the US ONCD urging memory-safe languages; Rust in the Linux kernel, Android and Windows).
- **If you must use C/C++, use real expertise** plus every available aid: safe libraries, hardening flags, static analysis, fuzzing, sanitizers, code review. Casual C in security-sensitive contexts is dangerous.
- The cited Wilander & Kakkar paper empirically compares the run-time buffer-overflow defences (canaries, bounds checkers) and shows that none caught all attacks at the time, reinforcing the "no single defence is perfect" message of Slide 43.
`;export{e as default};
