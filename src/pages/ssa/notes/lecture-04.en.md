Lecture 4 covers format string vulnerabilities: why passing attacker-controlled data as a `printf` format argument lets an attacker read and write arbitrary memory, the `cfingerd` root-compromise case study, and then the broader topic of code injection and input sanitization (black list vs white list). The slide deck has 41 pages. The code examples here are exam-relevant.

## What is a format string vulnerability (pages 2-11)

### Slide 2 · Format String (outline)

> - What is a format string vulnerability
> - Fundamental "C" problem
> - Survey of unsafe functions and how to format strings safely with regular C functions
> - Case study: cfingerd 1.4.3 vulnerabilities
> - Preventing format string vulnerabilities without programming
> - Tools to find string format issues

### Slide 3 · What is a Format String?

> In "C", you can print using a format string:
>
> - `printf(const char *format, ...);`
> - `printf("Mary has %d cats", cats);`
>   - %d specifies a decimal number (from an int)
>   - %s would specify a string argument,
>   - %x would specify an unsigned uppercase hexadecimal (from an int)
>   - %f expects a double and converts it into decimal notation, rounding as specified by a precision argument
>   - ...

**Expansion.** `printf` is a **variadic** function: its first argument is a *format string* that both prints literal text and contains *conversion specifiers* (`%d`, `%s`, `%x`, `%f`, ...), each of which consumes one of the following arguments and controls how it is printed. The format string therefore *encodes how many further arguments there are and of what type*.

- **Precise meaning of the specifiers** (the slide slightly misstates `%x`): `%d` is a signed decimal `int`; `%u` unsigned decimal; `%x` an `unsigned int` in *lowercase* hexadecimal (`%X` uppercase; the slide's "uppercase" is imprecise); `%s` expects a `char*` and prints the string it points to; `%f` expects a `double`; `%p` prints a pointer; `%c` a character. Width and precision modifiers (`%10x`, `%.5f`, `%100d`) control field width and precision, and matter in exploits because they control how many characters are emitted.
- The crucial and dangerous one, introduced later, is **`%n`**, which does not print but *writes* the number of characters output so far to the address of its argument.

### Slide 4 · Fundamental «C» problem

> - No way to count arguments passed to a "C" function, so missing arguments are not detected
> - Format string is interpreted: it mixes code and data
> - What happens if the following code is run?
>
> ```c
> int main () {
>        printf("Mary has %d cats");
> }
> ```

**Code analysis.**

- *The root problem.* A variadic C function has **no way to know how many arguments it was actually passed**. `printf` trusts the format string: it sees `%d` and *assumes* an `int` argument is there, fetching it from the next slot defined by the calling convention (a register or a stack location), whether or not the caller supplied one. Nothing checks the count or the types.
- *The format string is interpreted*: it mixes **code** (the directives that tell `printf` what to do) and **data** (the literal text). When the directives come from an attacker, data has become code, the same master flaw as buffer overflows (Lecture 3, Slide 54).
- *This snippet* has a `%d` but passes **no** argument. `printf` reads whatever happens to be in the next argument slot (an uninitialised register or a value left on the stack) and prints it as a decimal integer.

### Slide 5 · Result

> ```
> % ./a.out
> Mary has -1073742416 cats
> ```
>
> - Program reads missing arguments off the stack!
>   - And gets garbage (or interesting stuff if you want to probe the stack)

**Expansion.** The large negative number is whatever value sat where the missing argument should have been, printed as a signed `int`. This is already an **information disclosure**: by supplying many specifiers, an attacker can read out successive words of the stack (saved registers, local variables, pointers, canaries, return addresses), which both leaks secrets and defeats ASLR by revealing live addresses. The value changes from run to run and machine to machine, since it is just leftover stack contents.

### Slide 6 · User-specified Format String

> What happens if the following code is run, assuming there is an argument input by a user?
>
> ```c
> int main(int argc, char *argv[])
> {
>     printf(argv[1]);
>     exit(0);
> }
> ```
>
> Try it and input "%s%s%s%s%s%s%s%s%s" How many "%s" arguments do you need to crash it?

**Code analysis.** This is *the* canonical format string bug: `printf(argv[1])` uses attacker-controlled input **as the format string itself**.

- Each `%s` makes `printf` take the next stack slot, treat it as a `char*` **pointer**, and print the string it points to. Since no arguments were passed, these "pointers" are arbitrary stack values. Most are not valid pointers, so dereferencing one accesses unmapped or protected memory and the program crashes.
- The experiment ("how many `%s` to crash it?") just asks how far up the stack you must walk before hitting a value that is not a readable address, usually only a handful.

### Slide 7 · Result

> ```
> % ./a.out "%s%s%s%s%s%s%s"
>   Bus error
> ```
>
> - Program was terminated by OS
>   - Segmentation fault, bus error, etc... because the program attempted to read where it was not supposed to
> - User input is interpreted as string format (e.g., %s, %d, etc...)
> - Anything can happen, depending on input!
> - How would you correct the program?

**Expansion.** A *segmentation fault* or *bus error* is the OS killing the process for touching memory it may not access, the visible symptom of `%s` dereferencing a bogus pointer. "Anything can happen" is literal: with `%x` the attacker reads the stack, with `%s` reads arbitrary memory, and with `%n` *writes* memory, up to arbitrary code execution. The fix is on the next slide.

### Slide 8 · Corrected Program

> ```c
> int main(int argc, char *argv[])
> {
>     printf("%s", argv[1]); exit(0);
> }
> ```
>
> ```
> % ./a.out "%s%s%s%s%s%s%s"
>   %s%s%s%s%s%s%s
> ```

**Code analysis.** The fix is to supply a **constant format string** and pass the user data as a plain argument: `printf("%s", argv[1])`. Now `argv[1]` is treated purely as *data* to be printed by the single `%s`; any `%` characters in it are printed literally, as the output shows. This single change neutralises the entire vulnerability. (A robustness note: the program should also check that `argc > 1` before reading `argv[1]`, or it dereferences `NULL`.)

### Slide 9 · Format String vulnerabilities

> - Limitation of "C" family languages
> - Versatile
>   - Can affect various memory locations
>   - Can be used to create buffer overflows
>   - Can be used to read the stack
> - Not straightforward to exploit, but examples of root compromise scripts available on the web
>   - "Modify and hack from example"

**Expansion.** Format string bugs are a limitation of the C family (C, C++, Objective-C) because of the unchecked variadic mechanism; safe languages either do not have printf-style variadics or type-check them. They are **versatile**: unlike a buffer overflow, which typically overwrites adjacent memory, a format string with `%n` can write to an *arbitrary* address of the attacker's choosing (write-what-where), and with `%x`/`%s` can read the stack and arbitrary memory. Though fiddly to exploit (the attacker must line up stack offsets), ready-made exploit scripts mean even low-skill attackers can adapt them ("modify and hack from example", the script-kiddie point of Lecture 3).

### Slide 10 · Definition of a Format String Vulnerability

> - A call to a function with a format string argument, where the format string is either:
>   - Possibly under the control of an attacker
>   - Not followed by appropriate number of arguments
> - Difficult to establish whether a data string could possibly be affected by an attacker; considered very bad practice to place a string to print as the format string argument.
>   - Sometimes the bad practice is confused with the actual presence of a format string vulnerability

**Expansion.** Two conditions each make a call vulnerable: (1) the format string is attacker-controllable, or (2) it has more specifiers than arguments supplied. Because it is hard to prove that a given string can *never* be influenced by an attacker (data flows are complex, and code is refactored), the safe rule is **never put a variable string in the format position** at all: always `printf("%s", s)`, never `printf(s)`. The final bullet notes a nuance: `printf(s)` where `s` is in fact always a trusted constant is *bad practice* but not necessarily an exploitable *vulnerability*; still, the practice is forbidden because the distinction is fragile.

### Slide 11 · How important are Format String vulnerabilities

> - Search National Vulnerability Database (NIST) for "format string": Over 890 records overall; 132 last 3 years (as of 2022)
> - Search Database a Mitre (cve.mitre.org) for "format string": 667 (11 from 2018, 15 from 2017) records of vulnerabilities
> - Various applications: Databases (Oracle); Unix services (syslog, ftp,...); Linux "super" (for managing setuid functions); cfingerd CAN 2001-0609
> - Arbitrary code execution is a frequent consequence

**Expansion.** Format string bugs are real and numerous (hundreds of CVEs), across databases, Unix services, and setuid helpers. **Arbitrary code execution** is a frequent consequence because of the `%n` write primitive. ("CAN-2001-0609" is an old MITRE *candidate* identifier, later promoted to the CVE `CVE-2001-0609`, the cfingerd bug studied below.) The numbers are lower than for buffer overflows, partly because the fix is trivial and compilers now warn (`-Wformat-security`), so new occurrences are rarer.

## Unsafe functions and the %n write primitive (pages 12-15)

### Slide 12 · Functions using Format Strings

> - printf - prints to "stdout" stream
> - fprintf - prints to stream
> - warn - standard error output
> - err - standard error output
> - setproctitle - sets the invoking process's title
> - sprintf(char \*str, const char \*format, ...); - sprintf prints to a buffer - What's the problem with that?

**Expansion.** The whole `printf` *family* takes a format string and is therefore vulnerable when the format is attacker-controlled: `printf`, `fprintf`, `sprintf`, `snprintf`, `vprintf` and friends, plus `scanf`-family input functions, the BSD `warn`/`err` error-reporting functions, `syslog` (very common in the CVEs), and `setproctitle`. **`sprintf` is doubly dangerous**: besides the format string issue, it writes the result into a caller-supplied buffer *with no size limit*, so it is also a classic buffer-overflow function (Lecture 3). Even with a constant format, `sprintf(buf, "%s", long_input)` overflows `buf`.

### Slide 13 · Better functions than sprintf

> Note: do not prevent format string vulnerabilities:
>
> - `snprintf(char *str, size_t size, const char *format, ...);` - sprintf with length check for "size" - Does not guarantee NUL-termination of str on some platforms (Microsoft, Sun) - MacOS X: NUL-termination guaranteed - Check with "man snprintf"
> - `asprintf(char **ret, const char *format, ...);` - sets \*ret to be a pointer to a buffer sufficiently large to hold the formatted string.

**Expansion.** The emphasis is that these functions fix the *buffer overflow* problem of `sprintf` but **not** the *format string* problem, the two are orthogonal.

- **`snprintf(str, size, fmt, ...)`** bounds the number of bytes written to `size`, preventing overflow of `str`, but if the format is attacker-controlled it is still a format string vulnerability. Portability trap: on some platforms (historically Microsoft's `_snprintf`, old Solaris) it does **not** NUL-terminate on truncation, so the terminator must be forced in. (This is the same ANSI/Unicode / truncation family as Lecture 3, Slide 28.)
- **`asprintf(&ret, fmt, ...)`** allocates a buffer of exactly the right size (via `malloc`) and points `*ret` at it, removing the size-guessing, but the caller must `free(ret)`, must check for allocation failure, and the format-string risk remains.
- The takeaway: pick a size-safe function *and* always use a constant format string.

### Slide 14 · Custom functions using format strings

> - It is possible to define custom functions taking arguments similar to printf.
> - wu-ftpd 2.6.1 proto.h - `void reply(int, char *fmt,...);` - `void lreply(int, char *fmt,...);` - etc...
> - Can produce the same kinds of vulnerabilities if an attacker can control the format string

**Expansion.** The danger is not limited to the standard library. Programs define their *own* variadic wrapper functions that forward a format string to `vprintf`/`vsnprintf` (here wu-ftpd's `reply`/`lreply`). If attacker data reaches the `fmt` parameter of such a function, it is just as exploitable. In fact the famous **wu-ftpd `SITE EXEC` format string bug (2000, CVE-2000-0573)** gave remote root on FTP servers worldwide. Defensive tip: annotate such functions with GCC's `__attribute__((format(printf, N, M)))` so the compiler type-checks calls and `-Wformat-security` flags a variable format.

### Slide 15 · Write anything anywhere: the %n command

> "%n" format command
>
> - Writes a number to the location specified by argument on the stack
>   - Argument treated as int pointer - Often either the buffer being written to, or the raw input, are somewhere on the stack - Attacker controls the pointer value!
>   - Writes the number of characters written so far - Input: «Count these characters!» - Even if the buffer given to snprintf is too small, snprintf will still report the bytes that would have been written up to a certain point in the %n variables
> - All the gory details you don't really need to know: Newsham T (2000) "Format String Attacks"; Format string attacks by scut/team teso.

**Expansion.** `%n` is what turns a format string bug from an information leak into a **write-what-where** primitive, i.e., arbitrary code execution.

- **What `%n` does.** Unlike every other specifier, `%n` does *not* print. It takes its argument as an **`int*`** and writes to *that pointer* the number of characters printed so far.
- **Why the attacker controls the target address.** With a format-string bug, the "argument" for `%n` is read from the stack, and the attacker's input is itself on the stack. So the attacker places the **target address** inside their format string (as raw bytes), then uses `%x` specifiers to step the argument pointer along the stack until it lines up with that embedded address; the `%n` then writes to it.
- **Controlling the written value.** The value written is the running character count, which the attacker tunes with width specifiers: `%100x` emits 100 characters, so the count reaches an arbitrary number. To write a full 32-bit address (a huge count would be impractical), the write is split into pieces using `%hn` (write a 16-bit `short`) or `%hhn` (one byte), building the target value two bytes or one byte at a time at successive addresses.
- **The `snprintf` subtlety.** Even when `snprintf` truncates its *output* to fit a small buffer, the count it reports for `%n` reflects the characters that *would* have been written, so the write primitive still works.
- **Modern mitigations.** Because `%n` is so dangerous and rarely needed, it is disabled by default on Windows CRT, restricted by glibc's `_FORTIFY_SOURCE` (which forbids `%n` in writable format strings), and compilers warn on variable formats. The cited references (Tim Newsham 2000; scut/team teso's "Exploiting Format String Vulnerabilities") are the classic write-ups.

## Case study: cfingerd 1.4.3 (pages 16-21)

### Slide 16 · Case study: cfingerd 1.4.3

> - Finger replacement (Configurable Finger Daemon)
>   - Runs as root
>   - Pscan output: (CAN 2001-0609)
>     - defines.h:22 SECURITY: printf call should have "%s" as argument 0
>     - main.c:245 SECURITY: syslog call should have "%s" as argument 1
>     - main.c:258 SECURITY: syslog call should have "%s" as argument 1
>     - standard.c:765 SECURITY: printf call should have "%s" as argument 0
>     - etc... (10 instances total)

**Expansion.** `cfingerd` is a configurable daemon for the *finger* protocol (which reports information about users). The two facts that make it a worthwhile target: it **runs as root**, so compromising it gives full control of the machine, and it processes **remote input** (the finger request and the ident response). `Pscan` is a static-analysis tool that flags `printf`/`syslog` calls lacking an explicit `%s` format, exactly the format string bad practice of this lecture. It found 10 such call sites; "should have `%s` as argument 0/1" means the format string should be the constant `"%s"` in that argument position. This is precisely how static analysis (Lecture 3, Slide 50) surfaces format string bugs.

### Slide 17 · Cfingerd analysis

> - Most of these issues are not exploitable, but one is, indirectly at that...
> - Algorithm (simplified):
>   - Receive an incoming connection - get the fingered username
>   - Perform an ident check (RFC 1413) to learn and log the identity of the remote user
>   - Copy the remote username into a buffer
>   - Copy that again into "username@remote\_address" - remote\_address would identify attack source
>   - Answer the finger request
>   - Log it

**Expansion.** An important lesson: most of the 10 flagged call sites are *not* exploitable, because their format string is in practice a trusted constant. Only one is, and only *indirectly*, in combination with a second bug. This matches Slide 10: bad practice is not automatically a vulnerability; exploitability must be traced through the actual data flow.

The relevant data flow: the daemon performs an **ident check** (RFC 1413, a protocol where the server asks the connecting host "who owns this connection?"). Crucially, the ident response, `ident_user`, comes from the **remote side and is attacker-controlled** (a malicious client runs its own ident server that returns any string). That attacker-controlled string then flows into a logging call, the vulnerable sink.

### Slide 18 · Cfingerd vulnerabilities

> - A format string vulnerability giving root access:
>   - Remote data (`ident_user`) is used to construct the format string:
>   - `snprintf(syslog_str, sizeof(syslog_str), "%s fingered from %s", username, ident_user);` `syslog(LOG_NOTICE, (char *) syslog_str);`
> - An off-by-one string manipulation (buffer overflow) vulnerability that
>   - prevents remote\_address from being logged (useful if attack is unsuccessful, or just to be anonymous)
>   - Allows ident\_user to be larger (and contain shell code)

**Code analysis.** The root compromise needs **two** bugs working together.

*Bug 1: the format string vulnerability.* The code builds a message with `snprintf` using a safe constant format (`"%s fingered from %s"`), which is correct. The flaw is the **next line**: `syslog(LOG_NOTICE, (char *) syslog_str)`. Here `syslog_str`, which now *contains the attacker's `ident_user`*, is passed as `syslog`'s **format string** argument (`syslog`'s signature is `syslog(int priority, const char *format, ...)`). So any `%n`/`%x` that the attacker put in `ident_user` is interpreted by `syslog`, giving the write-what-where primitive, and since cfingerd runs as root, root-level code execution.

- *The fix for bug 1* is the lecture's rule: `syslog(LOG_NOTICE, "%s", syslog_str);` - treat the built string as data, not as a format.

*Bug 2: the off-by-one buffer overflow* (detailed next slides). It serves the attacker in two ways: it prevents `remote_address` from being logged (so a failed attempt leaves no trace, keeping the attacker anonymous), and it lets `ident_user` effectively run longer, giving room to place the shellcode and the alignment bytes the `%n` exploit needs.

### Slide 19 · Cfingerd Buffer Overflow vulnerability

```c
memset(uname, 0, sizeof(uname));
for (xp=uname; *cp!='\0' && *cp!='\r' &&
  *cp!='\n' && strlen(uname) <
  sizeof(uname); cp++)
     *(xp++) = *cp;
```

> - Off-by-one string handling error
>   - uname is not NUL-terminated!
>   - because strlen doesn't count the NUL
> - It will stop copying when strlen goes reading off outside the buffer

**Code analysis.**

- *What it does.* It copies characters from the input `cp` into `uname` (via the write pointer `xp`), stopping at a NUL, CR or LF, or when `strlen(uname) < sizeof(uname)` becomes false.
- *The off-by-one.* The loop guard uses `strlen(uname) < sizeof(uname)`, i.e., it allows copying while the current length is below the full buffer size, so it can fill `uname` right up to its last byte, leaving **no room for the terminating `'\0'`**. `uname` is therefore **not NUL-terminated**: the classic off-by-one (the guard should be `< sizeof(uname) - 1`, reserving the last byte for the terminator). Note also that `strlen(uname)` only works while `uname` *is* terminated, and `memset` zeroed it initially, but as the buffer fills the length computation walks right up to and past the boundary.
- *Consequence.* Because `uname` is not terminated, subsequent string operations read past its end into whatever follows it in memory, which is the mechanism explained on the next slide.
- *Fix.* Reserve the last byte and always terminate:

```c
memset(uname, 0, sizeof(uname));
for (xp = uname;
     *cp != '\0' && *cp != '\r' && *cp != '\n'
     && (size_t)(xp - uname) < sizeof(uname) - 1;   // leave room for '\0'
     cp++)
    *xp++ = *cp;
*xp = '\0';                                         // guarantee termination
```

Using the pointer difference `xp - uname` as the bound is also more robust (and far cheaper) than recomputing `strlen(uname)` on every iteration.

### Slide 20 · Direct effect of off-by-one error

> `char buf[BUFLEN], uname[64];`
>
> - "uname" and "buf" are "joined" as one string!
> - So, even if only 64 characters from the input are copied into "uname", string manipulation functions will work with "uname+buf" as a single entity
> - "buf" was used to read the response from the ident server so it is the raw input

**Expansion.** The two buffers `uname` (64 bytes) and `buf` (BUFLEN bytes) are declared adjacently, so they sit next to each other in memory. Because `uname` is not NUL-terminated (Bug 2), a string function scanning `uname` does not stop at its end but continues straight into `buf`, so `uname` and `buf` behave as **one joined string** `uname+buf`.

- This matters because **`buf` holds the raw ident response, i.e., attacker-controlled data**. So even though only 64 bytes are copied into `uname`, the effective attacker-controlled string that reaches the vulnerable `syslog` is `uname` concatenated with the whole of `buf`, far more than 64 bytes, enough room for the exploit payload.

### Slide 21 · Consequences of Off-by-one Error

> 1. Remote address is not logged due to size restriction:
>    - `snprintf(bleah, BUFLEN, "%s@%s", uname, remote_addr);`
>    - Can keep trying various technical adjustments (alignments, etc...) until the attack works, anonymously
> 2. Not enough space for format strings, alignment characters and shell code in buf (\~60 bytes for shell code):
>    - Rooted (root compromise) when syslog call is made
>      - i.e., cracker gains root privileges on the computer (equivalent to LocalSystem account)

**Expansion.** How the two bugs combine into a root compromise:

1. **Anonymity.** The daemon builds `"username@remote_address"` with `snprintf(bleah, BUFLEN, "%s@%s", uname, remote_addr)`. Because the non-terminated `uname` already consumes the whole buffer (joined with `buf`), the `snprintf` length limit is hit before `remote_addr` is appended, so **the attacker's remote address is never logged**. The attacker can therefore retry different alignments until the exploit succeeds, leaving no trace of failed attempts.
2. **Room for the payload.** The joined `uname+buf` gives roughly enough space (the slide says \~60 bytes) for the shellcode plus the `%n` format directives and the alignment padding the exploit needs. When the vulnerable `syslog(LOG_NOTICE, syslog_str)` runs, the `%n` writes hijack control and, since cfingerd runs as root, the attacker is **"rooted"**, i.e., gains root (on Windows, the equivalent all-powerful `LocalSystem` account).

This case study is the course's full worked example that a format string bug plus an off-by-one, each perhaps "not that serious" alone, compose into remote root. Both root causes trace back to the lecture's themes: mixing data and code (the format string), and lack of input validation / careless string handling (the off-by-one).

## Preventing format string vulnerabilities (page 22)

### Slide 22 · Preventing Format String vulnerabilities

> 1. Always specify a format string - Most format string vulnerabilities are solved by specifying "%s" as format string and not using the data string as format string
> 2. If possible, make the format string a constant - Extract all the variable parts as other arguments to the call - Difficult to do with some internationalization libraries
> 3. If the above two practices are not possible, use run-time defenses such as FormatGuard - Rare at design time - Perhaps a way to keep using a legacy application and keep costs down - Increase trust that a third-party application will be safe

**Expansion.** Three layers of defence, in order of preference:

1. **Always specify the format string.** The number-one fix: write `printf("%s", data)`, never `printf(data)`. The user data becomes an argument, not code.
2. **Make the format a compile-time constant**, with all variable parts passed as arguments. A literal string can never be attacker-controlled. The difficulty is *internationalisation (i18n)*: libraries like `gettext` look up translated format strings at run time (`printf(gettext("Hello %s"), name)`), so the format is technically a variable; the mitigation is to treat translation catalogs as trusted and never let user input choose them, and compilers still check with `-Wformat-nonliteral`.
3. **Run-time defences** (e.g., *FormatGuard*, which wrapped `printf` to count the actual arguments and reject calls with too many specifiers) for cases where the source cannot be changed, such as a legacy or third-party binary. These are a last resort to keep using software that cannot be fixed, trading a little assurance for lower cost.

The modern baseline is simpler: compile with `-Wformat -Wformat-security -Werror=format-security`, which makes the compiler reject any non-constant format string at build time.

## Code injection and input sanitization (pages 23-41)

The lecture now generalises from format strings to **code injection**, of which format strings, command injection, SQL injection and XSS are all instances, and to the defence that unifies them: input validation (expanded in Lecture 5).

### Slides 23-24 · Code Injection

> (23) Goal: trick program into executing an attacker's code by clever input construction that mixes code and data. Mixed code and data channels have special characters that trigger a context change between data and code interpretation - The attacker wants to inject these meta-characters through some clever encoding or manipulation, so supplied data is interpreted as code
>
> (24) Defend against it by using input cleansing and validation; type casts may help if they are possible. Need to keep track of which data has been cleansed, or keep track of all sources of inputs and cleanse as the input is received

**Expansion.**

- **The essence of code injection.** Many channels carry *code and data mixed together*, separated only by **metacharacters** that switch the interpreter between "this is data" and "this is a command". Examples of such context-switching metacharacters: `%` in a `printf` format string, `;` and `` ` `` in a shell command, `'` and `--` in SQL, `<` and `>` in HTML. If the attacker can slip a metacharacter into a place that was meant to be pure data, the following bytes are reinterpreted as code. That is code injection, and format strings are one instance of it.
- **Encoding/obfuscation.** Attackers smuggle metacharacters in by encoding them (URL-encoding `%3B` for `;`, UTF-8 overlong forms, HTML entities), so a naive filter that looks for the literal character misses them.
- **The defence** is *input cleansing (sanitization) and validation*: check and clean untrusted input before it reaches an interpreter. Two bookkeeping strategies: either **track which data has been cleansed** (so you never use un-cleansed data in a sensitive sink, e.g., Perl's taint mode), or **cleanse every input at the point it is received**. Type casts help when the expected value is, say, an integer: converting to `int` discards any injected text.

### Slide 25 · How widespread?

> - Search National Vulnerability Database (NIST) for "code injection": Over 900 records overall; 360+ last 3 years (recent one Aug 2020)
> - Search Database Mitre (cve.mitre.org) for "code injection": 760 (80+ from 2018) records of vulnerabilities

**Expansion.** Code injection is one of the most common and most severe vulnerability classes; "Injection" has been at or near the top of the OWASP Top 10 for its entire history (number 1 in 2013 and 2017, folded into a broader category at number 3 in 2021). The numbers here count only those explicitly labelled "code injection"; SQL injection and XSS, which are injection too, add thousands more.

### Slides 26-27 · Basic Example by Command Separation

```sh
#!/bin/sh
A = $1
eval "ls $A"
```

> Permissions of "confidential" before exploit: `-rwxr-x--- 1 user user confidential`. Allow execution: `% chmod a+rx example`. Exploit: `%./example ".;chmod o+r *"`

**Result (Slide 27):** *"Inside the program, the eval statement becomes equivalent to:* `eval "ls .;chmod o+r *"`. *Permissions after exploit:* `-rwxr-xr-- 1 user user confidential`. *Any statement after the ";" would also get executed, because ";" is a command separator. The data argument for "ls" has become code!"*

**Code analysis.** The script runs `ls` on a directory given as argument `$1`, by building a command string and `eval`-ing it. (The shown `A = $1` has stray spaces; valid shell is `A=$1`.)

- *Vulnerability: command injection via the separator `;`.* The argument `$A` is dropped unquoted into a shell command and then `eval`-ed. The attacker passes `".;chmod o+r *"`. After substitution, `eval` sees `ls .;chmod o+r *`, which the shell reads as **two** commands: `ls .` and then `chmod o+r *`. The `;` is a command separator, so the attacker's `chmod` runs, making every file (including the previously unreadable `confidential`) world-readable. The *data* (the directory argument) has become *code*.
- *Fix.* The fundamental fix is to **not invoke a shell at all**: call the program directly with the argument as a single parameter (e.g., in C `execlp("ls", "ls", dir, NULL)`, or in a higher-level language an argument-vector API that never interprets metacharacters). If a shell is unavoidable, validate the argument against a strict allow-list (Slide 38) and quote it properly. `eval` on untrusted data should essentially never be used.

### Slides 28-29 · Other Command Injection (backticks)

> - (in PHP) Backtick `` ` `` : execution in a command line by command substitution.  `` `command` `` gets executed before the rest of the command line.
> - Imagine a malicious script called "script1": `mkdir oups` / `echo oups` / etc...
> - Imagine a program that calls a shell to run grep. What happens when this is run? `` eval "grep `./script1` afile" ``
>
> (29) Answer: Script1 is executed - first an "oups" directory is created. The rest of the intended command, "grep oups afile", is executed.

**Code analysis.** A second shell metacharacter: the **backtick** (`` ` ``), which performs *command substitution*, the shell runs the command inside the backticks first and substitutes its output.

- *Vulnerability.* In `` grep `./script1` afile ``, the shell first executes `./script1` (which creates the `oups` directory and prints `oups`), then substitutes its output so the command becomes `grep oups afile`. So merely having a backtick-quoted string in a command that reaches a shell runs an arbitrary program. In PHP the same danger exists both with the backtick operator and with `shell_exec`, `exec`, `system`, `passthru`, `popen`.
- *Fix.* Same as before: avoid passing untrusted data through a shell; use APIs that take an argument array (`pcntl_exec`, `proc_open` with an array, or language-native file operations) so backticks and `;` are never interpreted; otherwise strict allow-list validation plus `escapeshellarg()`.

### Slides 30-31 · A vulnerable program (C + system)

```c
int main(int argc, char *argv[], char **envp)
{
  char buf [100];
  buf[0] = '\0';
  snprintf(buf, sizeof(buf), "grep %s text", argv[1]);
  system(buf);
  exit(0);
}
```

> What happens when we run the following?
> `` % ./a.out \`./script\` ``
>
> (31) Answer: The program calls `` system("grep `./script` text"); `` (can be verified by adding `printf("%s", buf)`). So we could make a.out execute any program we want. Imagine that we provide the argument remotely. Anyone running a.out would run arbitrary code as the owner of a.out. What if a.out runs with root privileges?

**Code analysis.** Note that this code uses `snprintf` with a **constant** format, so it has *no* format string or buffer-overflow bug. The flaw is entirely in what it does with the safely-built string.

- *Vulnerability: command injection through `system`.* `system(buf)` hands `buf` to `/bin/sh -c`, so every shell metacharacter in `buf` is interpreted. Since `argv[1]` is copied verbatim into `buf`, the attacker's backtick expression `` `./script` `` is executed by the shell before `grep` runs. The attacker can run any program, and if the argument arrives remotely and `a.out` is setuid root, this is remote root. `snprintf` being safe does not help, because `system` re-interprets the result.
- *Fix.* Do not use `system` with any untrusted content. Use the `exec` family with an explicit argument vector, which passes `argv[1]` directly to `grep` as one argument with no shell in between:

```c
#include <unistd.h>
#include <sys/wait.h>
int main(int argc, char *argv[]) {
    if (argc < 2) return 1;
    pid_t pid = fork();
    if (pid == 0) {
        execlp("grep", "grep", "--", argv[1], "text", (char*)NULL);  // no shell involved
        _exit(127);
    }
    int status; waitpid(pid, &status, 0);
    return 0;
}
```

The `--` stops `grep` from treating an argument beginning with `-` as an option (a smaller injection of its own, *argument injection*).

### Slide 32 · Shell metacharacters

> - '\`' to execute something (command substitution)
> - ';' is a command ("pipeline") separator
> - '&' start process in the background
> - '|' is a pipe (connecting standard output to standard input)
> - '&&', '||' logical operators AND and OR
> - '<<' or '>>' prepend, append
> - # to comment out something
>
> Refer to the appropriate man page (man csh) for all characters
>
> How else can code be injected into a.out?

**Expansion.** This is the (non-exhaustive) catalog of shell metacharacters an attacker can abuse: command substitution (`` ` ``, `$()`), separators (`;`), background (`&`), pipe (`|`), logical operators (`&&`, `||`), redirection (`<`, `>`, `>>`, `<<`), comments (`#`), plus globbing (`*`, `?`, `[]`), variable expansion (`$`), quotes, newline, and whitespace. The rhetorical question "how else can code be injected?" underlines the central difficulty of **black-listing**: the set of dangerous characters is large, shell- and context-dependent, and easy to under-estimate, which is why allow-listing (Slide 38) is preferred.

### Slide 33 · Defending against code injection

> - Input cleansing and validation - Model the expected input (Discard what does not fit, e.g., metacharacters) - Keep track of which data has been cleansed (e.g., Perl's taint mode) - Keep track of all sources of inputs (Or cleanse as the input is received)
> - Type and range verification, type casts
> - Separating code from data - Transmit, receive and manipulate data using different channels than for code

**Expansion.** Three complementary defences:

- **Input cleansing and validation.** *Model the expected input* (what a valid value looks like) and reject anything that does not fit. *Track cleansed data* so untrusted, un-cleansed data never reaches a sink: **Perl's taint mode** (`-T`) marks all external input as "tainted" and refuses to use tainted data in dangerous operations (`system`, `open`, ...) until it has been laundered through a regex match, enforcing the discipline automatically.
- **Type and range verification, type casts.** If a number is expected, convert the input to a numeric type and check its range; the cast discards any injected text.
- **Separating code from data** is the strongest and most general fix: use a channel/mechanism that keeps data and code apart so data can never be parsed as code. In databases this is **prepared statements / parameterized queries** (Lecture 9); for commands it is the **argument-vector `exec`** APIs above; for `printf` it is the constant format string. This directly addresses the "don't mix data and code" principle (Lecture 3, Slide 54).

### Slide 34 · Input cleansing

> - Key to preventing code injection attacks
> - Common problem where code is generated dynamically from some data - SQL (database Simple Query Language) - System calls and equivalents in PHP, Windows CreateProcess, etc... - HTML may contain JavaScript (Cross-site scripting vulnerabilities)

**Expansion.** Wherever a program **builds code (a query, a command, a web page) dynamically from data**, injection is possible, and input cleansing is the key defence. The three canonical sinks: **SQL** (string-built queries → SQL injection, Lecture 9), **shell/process-creation calls** (`system`, PHP's `exec`, Windows `CreateProcess` → command injection), and **HTML containing JavaScript** (user data echoed into a page → cross-site scripting, XSS). (Aside: SQL stands for *Structured* Query Language; the slide's "Simple" is a slip.) The unifying pattern is identical, which is why one mindset - never let data become code - defends against all of them.

### Slide 35 · Intuitive approach (and why it fails)

> Block or escape all metacharacters - but what are they?
>
> Problems:
>
> - Character encodings - octal, hexadecimal, UTF-8, UTF-16, binary, Base-64, URL encoding, ...
> - Obfuscation - Escaped characters that can get interpreted later - Engineered strings such that by blocking a character, something else is generated

**Expansion.** The intuitive defence is **black-listing**: list all the "bad" metacharacters and block or escape them. It fails for two reasons:

- **Character encodings.** The same character can be written many ways: literal `;`, URL-encoded `%3B`, HTML entity `&#59;`, UTF-8 overlong encodings, octal/hex escapes, Base-64, etc. A filter checking for the literal byte misses the encoded forms, which are then decoded *after* the filter, by the next layer, back into the dangerous character. (Hence Slide 41: resolve encodings *first*.)
- **Obfuscation.** Escaped characters can be un-escaped later and reinterpreted; and filters can be defeated by "engineered" strings where removing one bad character *creates* another (the `adb` → `ab` example of Slide 41).

### Slide 36 · Wrong way to cleanse input (black list)

```c
int main(int argc, char *argv[], char **envp) {
  static char bad_chars[] = "/ ;[]<>&\t";
  char *user_data;
  char *cp;
  /* Get the data */
  user_data = getenv("QUERY_STRING");
  /* Remove bad characters. WRONG! */
  for (cp = user_data; *(cp += strcspn(cp,bad_chars)); /* */)
   *cp = '_';
  ...
```

**Code analysis.** This CGI code takes the `QUERY_STRING` and tries to neutralise injection by replacing a **blacklist** of bad characters (`/ ;[]<>&` and tab) with underscores. `strcspn(cp, bad_chars)` returns the length of the initial run of `cp` containing *no* bad character, so the loop jumps to each bad character and overwrites it with `_`.

- *Why it is WRONG (as the slide's own comment says).* The blacklist is **incomplete**. It omits many dangerous characters: the backtick `` ` ``, `$`, `|`, `(`, `)`, `{`, `}`, `*`, `?`, `~`, `!`, `\`, newline, and more. Any one of them left off defeats the whole filter. This is the general failure of black-listing (Slide 32: the set of metacharacters is large and context-dependent). The referenced CERT advisory on CGI metacharacters documents exactly this class of mistake.
- *Fix.* Switch to a **white list** (Slide 38): define the allowed characters and reject or replace everything else.

### Slide 37 · Real life example: phf CGI

```c
void escape_shell_cmd(char *cmd) {
    (...)
    if(ind("&;`'\"|*?~<>^()[]{}$\\", cmd[x]) != -1){
    (...)
}
```

> - Author forgot to list newlines in "if" statement...
> - Exploit: input "newline" and the commands you want executed...

**Code analysis.** This is the infamous real-world **phf** CGI bug (one of the first widely exploited web vulnerabilities, 1996). `escape_shell_cmd` tries to escape shell metacharacters by checking each character against a blacklist string.

- *Vulnerability.* The blacklist `` &;`'"|*?~<>^()[]{}$\ `` looks thorough but **omits the newline character (`\n`, 0x0A)**. In a shell command, a newline *also* separates commands, just like `;`. So an attacker sends a request containing a literal newline followed by a command (classically `/cgi-bin/phf?Qalias=x%0A/bin/cat%20/etc/passwd`, where `%0A` is the URL-encoded newline), and the server executes the injected command, leaking `/etc/passwd`. One forgotten character gave remote command execution on thousands of web servers.
- *Lesson.* This is the canonical proof that black-listing fails: comprehensive-looking lists still miss something, and one miss is total defeat. The newline is especially easy to forget because it is invisible.
- *Fix.* White-list the allowed characters (next slide), or, better, do not build shell commands from request data at all.

### Slide 38 · More robust cleansing (white list)

```c
{...}
static char ok_chars[] =
       "1234567890!@%-_=+:,./\
        abcdefghijklmnopqrstuvwxyz\
        ABCDEFGHIJKLMNOPQRSTUVWXYZ";
{...}
for (cp = user_data; *(cp += strspn(cp, ok_chars)); /* */ )
   *cp = '_';
```

> a.k.a. White List vs Black List design principle

**Code analysis.** This is the corrected version of Slide 36, now using a **white list** (allow list).

- *How it works.* `ok_chars` lists the characters that are *allowed*. `strspn(cp, ok_chars)` returns the length of the initial run consisting *only* of allowed characters, so the loop jumps to the first character **not** in the allow list and replaces it with `_`. Everything not explicitly permitted is neutralised.
- *Why it is robust.* The security no longer depends on remembering every bad character. If a new or exotic metacharacter appears, it is simply not in `ok_chars`, so it is rejected by default. This is **fail-safe / default-deny**: the safe behaviour is the default. (A line-continuation note: the backslashes at the ends of the string lines are C line-continuations joining one long literal; the leading whitespace on the continued lines actually becomes part of the allowed set, which is a minor imperfection, space/tab are "allowed" here, so a real allow-list should be written as one explicit string.)
- **White list vs black list** is the key design principle: enumerate what is *good* and reject the rest, never enumerate what is *bad* and allow the rest.

### Slide 39 · Defense: Input Sanitization

> - Do not attempt to list all forbidden characters - It is easy to forget and one missed character leads to defeat
> - Make a list of all allowed characters - Without metacharacters
> - Convert to a variable of numerical type, if a number is expected
> - Truncate input strings if the expected length is known

**Expansion.** The consolidated rules for input sanitization:

- **Never black-list** ("do not list all forbidden characters"), because one omission (the phf newline) is fatal.
- **Always white-list** the allowed characters, chosen so they contain no metacharacters for any downstream interpreter.
- **Convert to the expected type.** If the input should be a number, parse it into an integer/float and work with that; any injected text simply fails to convert. This is the strongest check when the type is known.
- **Truncate to the known maximum length.** If a field has a natural maximum length (a 5-digit zip code, a 16-digit card number), enforce it, which also helps against buffer overflows (Lecture 3) and some denial-of-service inputs.

### Slide 40 · Other Issues

> - Range of types - Short vs long integers - Unsigned vs signed
> - Integer overflows - Validate range (e.g., array indexes) - Attacks can make something negative to reach forbidden data - Attacks can reset a counter to zero (Data structure reference count vs garbage collection)
> - Strings in numerical inputs - e.g., PHP will accept both string and numerical values for a variable, which may allow unexpected attacks - Use typecasts

**Expansion.** Validation is not only about characters; the *numeric* properties of input matter too, tying this lecture back to the integer bugs of Lecture 3.

- **Type range.** Choose a wide enough, correctly-signed type, and remember signed/unsigned conversions (the negative-length bug of Lecture 3, Slides 22-23). Validate that a value fits the type you store it in.
- **Integer overflow and ranges.** Always range-check values used as sizes or **array indexes**. Attackers try to make an index negative (to reach memory before the array) or to wrap a counter to zero (e.g., to confuse a reference count so memory is freed while still in use, a use-after-free, or to defeat garbage-collection assumptions).
- **Strings in numeric inputs.** Weakly-typed languages blur the line: PHP will happily accept a string where a number is expected and coerce it with surprising rules (the `"0e123" == "0e456"` type-juggling of Lecture 1), enabling unexpected attacks. **Use explicit type casts / strict comparisons** (`(int)$x`, `===`) so the value really is the type you think it is.

### Slide 41 · Order for input validation

> 1. Resolve all character encoding issues first
> 2. Cleanse - If combinations of characters can produce metacharacters, you may need to do several passes. Example: "a" and "b" are legal if separated from each other, but "ab" is considered a metacharacter. The character "d" is not allowed. After you filter out "d" from "adb", you may be allowing "ab" through the filter!
> 3. Validate type, range, and format
> 4. Validate semantics (i.e., meaning of input)

**Expansion.** The **order** of validation steps matters, and getting it wrong reintroduces bugs:

1. **Canonicalise / decode first.** Resolve all encodings (URL, UTF-8, HTML entities, ...) to a single canonical form *before* checking anything. Otherwise an encoded metacharacter slips through the filter and is decoded later into the dangerous character (Slide 35). This is *canonicalization*, itself a classic vulnerability source when done wrong (e.g., `..%2f` path traversal, the Unicode/IIS directory-traversal worms).
2. **Cleanse, possibly in several passes.** The `adb` example shows why one pass is not enough: removing the forbidden `d` from `adb` leaves `ab`, which is itself a forbidden metacharacter that was not there before. If filtering can *create* new bad patterns, you must filter repeatedly until the string stops changing (reach a fixed point), or, better, reject rather than silently "fix" input. (This is exactly the "engineered strings" obfuscation of Slide 35.)
3. **Validate type, range, and format** (is it an integer in `[0, 100]`? does it match the expected pattern?).
4. **Validate semantics** last: even a well-formed, in-range value may be meaningless or malicious in context (a valid account number that is not *this* user's account, a valid but non-existent product ID). Syntactic validity is necessary but not sufficient; the value must also make sense for the operation.

These four steps are the bridge to Lecture 5 (Input Validation), which develops them in full.
