const e=`Lecture 6 surveys the tools and techniques for finding security defects: the three families (static, dynamic, hybrid analysis) plus operational tooling, the measurement vocabulary used to judge a tool (true/false positives and negatives, precision, recall, ROC), the main static-analysis approaches (text scanners, taint propagation, type checkers), dynamic analysis (fuzzing), hybrid methods (concolic testing, pen testing), and the organisational lesson that a tool is useless without trained people ("fool with a tool"). The slide deck has 39 pages (adapted from David A. Wheeler, CC BY-SA 3.0). Some slides carry a second internal page number from the original deck; the sequential slide number is used here.

## Types of analysis and measurement (pages 2-6)

### Slide 2 · Outline

> - Types of analysis (static/dynamic/hybrid) - Some measurement terminology
> - Static analysis
> - Dynamic analysis (fuzz testing)
> - Hybrid analysis
> - Operational
> - Fool with a tool
> - SWAMP
> - Adopting tools

**Expansion.** The lecture's path. ("SWAMP" is the *Software Assurance Marketplace*, a free, open online platform, funded by the US DHS, that lets developers run many static-analysis tools against their code in one place; it appears in the outline but has no dedicated slide in this deck.)

### Slide 3 · Types of analysis

> - Static analysis: Approach for verifying software (including finding defects) without executing software - Source code vulnerability scanning tools, code inspections, etc.
> - Dynamic analysis: Approach for verifying software (including finding defects) by executing software on specific inputs and checking results ("oracle") - Functional testing, fuzz testing, etc.
> - Hybrid analysis: Combine above approaches
> - Operational: Tools in operational setting - Minimize risks, report information back, etc. - may be static, dynamic, hybrid; often dynamic

**Expansion.** The fundamental division:

- **Static analysis** examines the program *without running it* (the source, bytecode or binary): compilers, type checkers, code review, and security scanners. It can reason about *all* paths in principle, but must approximate, so it produces false alarms.
- **Dynamic analysis** *runs* the program on chosen inputs and checks the results. The component that decides whether a given run is correct or buggy is called the **oracle**. It sees only the paths actually executed, so it can prove the *presence* of a bug (an observed crash) but never its *absence* (Lecture 1, Slide 32).
- **Hybrid analysis** combines both (e.g., concolic testing, Slide 30).
- **Operational** tools run on the *deployed* system (logging, intrusion detection, sandboxing); usually dynamic.

### Slide 4 · Basic measurement terminology

![Lecture 6, page 4](L06_p04.webp "50% 1400x543")

**Figure.** A confusion-matrix table of tool outcomes:

| Tool report | Report correct | Report incorrect |
| --- | --- | --- |
| Reported a defect | **True positive (TP)**: correctly reported a defect | **False positive (FP)**: reported a "defect" that is not one ("Type I error") |
| Did not report a defect (there) | **True negative (TN)**: correctly did not report a (given) defect | **False negative (FN)**: failed to report a defect that exists ("Type II error") |

> - False positive rate, FPR = #FP/(#TN+#FP) - "Probability alert is false"
> - True positive rate, TPR = #TP/(#TP + #FN) - "% vulnerabilities found" (sensitivity)
> - Developers worry about large false positive rate (FPR) - "Tool report wasted my time"
> - Auditors worry about small or <100% TPR for a given category - "Tool missed something important"

**Expansion.** This vocabulary is essential for judging any security tool (and any classifier):

- **TP**: real bug, correctly flagged. **FP**: false alarm (flags something harmless). **TN**: correctly stays silent on non-bugs. **FN**: a *missed* real bug, the most dangerous outcome in security, because it gives false confidence.
- **FPR** (false positive rate) measures how much noise the tool produces; **TPR** (true positive rate, aka *sensitivity* or *recall*) measures what fraction of real bugs it catches.
- The tension between the two stakeholders is central: **developers** hate false positives (wasted time triaging non-bugs, leading them to ignore the tool), while **auditors/security** hate false negatives (a missed vulnerability). A tool that is too noisy gets switched off; a tool that is too quiet gives a false sense of security. Every tool must balance these.

### Slide 5 · Receiver Operating Characteristic (ROC) curve

![Lecture 6, page 5](L06_p05.webp "44% 792x905")

**Figure.** A sample ROC curve (from Wikipedia): true positive rate (y-axis) against false positive rate (x-axis), with several classifier curves bowing above the diagonal.

> - Binary classifiers must generally trade off between FP rates and TP rates - To get more reports (larger TP rate), must accept larger FP rate - What's more important to you, low FP rate or high TP rate?
> - ROC curve (from WW II) graphically illustrates this
> - Don't normally know the true values for given tools, but effect is still pronounced - Tool developer focus - Tool users can configure tool to affect trade-off

**Expansion.** A tool is a **binary classifier** (bug / no bug), and there is an unavoidable **trade-off**: making it report more (catching more real bugs, higher TPR) inevitably also makes it raise more false alarms (higher FPR). The **ROC curve** (Receiver Operating Characteristic, originally from WWII radar operators deciding "is that blip a plane?") plots TPR against FPR as the tool's sensitivity threshold is varied. A curve bowing toward the top-left corner is a better classifier; the diagonal is random guessing. The practical point: you usually cannot know a tool's exact ROC, but you *can* configure most tools to move along this trade-off (report more and tolerate noise, or report less and risk misses), choosing the operating point that fits whether false positives or false negatives hurt you more.

### Slide 6 · Measurement roll-ups

![Lecture 6, page 6](L06_p06.webp "29% 514x1143")

**Figure.** A precision/recall Venn diagram (retrieved vs relevant elements), from Wikipedia.

> - Precision (positive predictive value) = #TP/(#TP+#FP) - can be seen as a measure of quality
> - Recall (sensitivity, soundness, find rate) = #TP/(#TP+#FN) - measure of quantity, % vulnerabilities found
> - F-score (harmonic mean) = 2 x (Precision x Recall) / (Precision + Recall)
> - Discrimination rate = #Discriminations / #Test\\_Pairs - Given a pair of tests (one with defect, one without), Discrimination occurs if tool correctly reports flaw (TP) in test with flaw AND does not when there is no flaw (TN)
> - All these values 0..1, where higher is better

**Expansion.** Summary metrics that combine the four counts:

- **Precision** = TP/(TP+FP): of everything the tool *reported*, what fraction were real bugs. High precision = little noise (a quality measure). An auditor reading reports cares about this.
- **Recall** = TP/(TP+FN): of all *real* bugs, what fraction the tool found (same as TPR/sensitivity; also called *soundness* or find rate). High recall = few misses (a quantity measure).
- There is tension: pushing recall up (flag more) usually pushes precision down (more false alarms).
- **F-score** = the harmonic mean of precision and recall, a single number balancing the two (the harmonic mean punishes a tool that is good at one but poor at the other).
- **Discrimination rate**: a fairer benchmark metric. Give the tool a *pair* of near-identical test programs, one with a planted flaw, one without; the tool "discriminates" only if it flags the flawed one (TP) **and** stays silent on the clean one (TN). This rewards tools that actually understand the defect rather than ones that flag the pattern everywhere. (From the NIST CAS Static Analysis Tool Study, 2011.)

## Static analysis (pages 8-20)

Page 7 is the section divider "Static Analysis".

### Slide 8 · Source vs. Executables

> - Source code pros: Provides much more context; executable-only tools can miss important information - Can examine variable names and comments (can be very helpful!) - Can fix problems found (hard with just executable) - Difficult to decompile code
> - Source code cons: Can mislead tools - executable runs, not source (if there's a difference) - Often cannot get source for proprietary off-the-shelf programs (Can get for open source software; Often can get for custom)
> - Bytecode is somewhere between

**Expansion.** What the tool analyses matters.

- **Analysing source** gives rich *context*: variable names and comments (hints to intent), structure, and the ability to actually *fix* the bug (you cannot easily patch a binary). Decompiling a binary back to readable source is hard and lossy.
- **Cons of source**: the compiler may transform the source so that the *executable* behaves differently from what the source suggests (optimisations removing a check, Lecture 2, Slide 13), so source analysis can miss binary-level bugs; and you often simply cannot get the source for third-party/proprietary software (whereas open-source and in-house code are available).
- **Bytecode** (Java \`.class\`, .NET IL) sits in between: more structured and analysable than raw machine code, but closer to what actually runs than source.

### Slide 9 · (Some) Static analysis approaches

> - Human analysis (including peer reviews)
> - Type checkers
> - Compiler warnings
> - Style checkers / defect finders / quality scanners
> - Security analysis: Security weakness analysis - text scanners; Security weakness analysis - beyond text scanners
> - Property checkers
> - Knowledge extraction
> - formal methods (separately)

**Expansion.** Static analysis is a spectrum from cheap-and-shallow to expensive-and-deep: **human review** (best at context, poor at scale), **type checkers** and **compiler warnings** (built in, cheap), **style/quality scanners** (PMD, FindBugs), **security scanners** (simple text scanners like Flawfinder, and deeper data-flow tools), **property checkers** (verify specific properties), **knowledge extraction** (understand large code bases), and **formal methods** (prove correctness, Lecture 7). The following slides walk down this list.

### Slide 10 · Human (manual) analysis

> - Humans are great at discerning context and intent
> - Get bored and overwhelmed
> - Expensive - Especially if analyzing executables
> - Can be one person, e.g., "desk-checking"
> - Peer reviews - Inspections: Special way to use group, defined roles including "reader"; see IEEE standard 1028
> - Can focus on specific issues - e.g., "Is everything that's supposed be authenticated covered by authentication processes?"

**Expansion.** Humans **understand context and intent** that no tool does, catching design and logic flaws tools miss. But people get **bored and overwhelmed** on large code, and review is **expensive** (worse on binaries). Forms range from one person *desk-checking* their own code, to structured **peer review** and formal **inspections** (defined roles, including a *reader* who paraphrases the code, per IEEE 1028). Review is most effective when **focused** on a specific question ("is every sensitive operation actually behind authentication?"), rather than open-ended.

### Slide 11 · Automated tool limitations

> - Tools typically don't "understand": System architecture; System mission/goal; Technical environment; Human environment
> - Except for formal methods… Most have significant FP and/or FN rates
> - Best when part of a process to develop secure software, not as the only mechanism

**Expansion.** Automated tools lack *understanding*: they do not know the system's architecture, its mission (what matters), or its technical and human environment, so they cannot judge whether a flagged issue actually matters, or spot a design flaw that violates the mission. Except for formal methods (which prove properties but are costly), tools have significant false-positive and/or false-negative rates. Hence the recurring course message: a tool is **one part of a secure-development process, not the whole of it** (Lecture 1, Slide 44).

### Slide 12 · Automated tool limitations (architecture of a tool)

![Lecture 6, page 12](L06_p12.webp "50% 1400x881")

**Figure.** A data-flow diagram of a typical static-analysis tool. Inputs on the left, **Source code**, **Build instructions**, **Byte code**, **Executable**, plus **Modeling rules** (compiler version, environment, what is trusted) and **Library/framework config**, feed a **Parser/Extractor**. It produces an **Intermediate Representation (IR)** stored in a **database**. **Analyzers** (plural) run **queries** against the IR, driven by **built-in query rules** and **user rules**, and feed a **Results Viewer**. A note says the IR may be specific to a tool, a compiler (LLVM, gcc), a language (ASIS), or a standard (KDM).

**Expansion.** This is the standard **architecture** of a serious static-analysis tool, worth knowing conceptually: (1) a **parser/extractor** front-end ingests the code (source, bytecode or binary) plus configuration (which compiler, what is trusted) and builds an **intermediate representation (IR)**, a normalised model of the program stored in a database; (2) one or more **analyzers** run **queries/rules** over the IR, some built in, some written by the user to encode project-specific policies; (3) a **results viewer** presents findings for triage. The IR is key: it lets the analysis be reused across languages and lets users add custom rules. The quality of the *modeling rules* (what the tool assumes about the environment and trust) largely determines the false-positive/negative rates.

### Slide 13 · Type checkers

> - Many languages have static type checking built in - Some more rigorous than others - C/C++ not very strong (and must often work around) - Java/C# stronger (interfaces, etc., ease use)
> - Can detect some defects before fielding - Including some security defects - Also really useful in documenting intent
> - Work with type system - be as narrow as you can - Beware diminishing returns

**Expansion.** A **type checker** is static analysis you already have for free: it proves, at compile time, that operations are applied to compatible types. Stronger type systems catch more: **C/C++** has a weak type system (implicit conversions, \`void*\`, casts, no bounds in the type), often requiring unsafe work-arounds; **Java/C#** are stronger (no arbitrary pointer casts, interfaces, generics), which catches more defects, including some security-relevant ones, and *documents intent* (a parameter typed \`PositiveInt\` or \`SanitizedString\` encodes a contract). The advice "be as narrow as you can" means: use the most specific type that fits (distinct types for distinct concepts), so the compiler rejects more misuse, but beware diminishing returns (over-engineering the type system costs effort). Modern languages push this further with types that encode taint or units.

### Slide 14 · PMD vs. FindBugs

> - Both PMD and FindBugs: Focus on "quality" issues, not security; Open source, no cost; Operate on Java
> - PMD: Works on (Java) source code; Examples: Violation of naming conventions, lack of curly braces, misplaced null check, unnecessary constructor, missing break in switch; Also provides Cyclomatic complexity
> - FindBugs: Works on (JVM) bytecode; Examples: equals() method fails on subtypes, clone method may return null, reference comparison of Boolean values, impossible cast, 32bit int shifted by an amount not in the range of 0-31, a collection which contains itself, equals method always returns true
> - Neither good at finding security issues - not their purpose

**Expansion.** Two well-known Java static analysers, used as examples of *quality* (not security) scanners:

- **PMD** works on **source code** and flags style and maintainability issues (naming, missing braces, misplaced null checks, a missing \`break\` in a \`switch\`, a Lecture-3 class of bug) and computes *cyclomatic complexity* (a measure of how many independent paths a method has, a proxy for how hard it is to test).
- **FindBugs** (now continued as **SpotBugs**) works on **JVM bytecode** and finds likely-wrong code patterns (\`equals()\` broken for subtypes, a cast that can never succeed, a 32-bit int shifted by an out-of-range amount, a collection containing itself).

The teaching point: these are excellent at code quality but **not designed for security**, so they must not be mistaken for security tools. Finding security bugs needs tools built for it (next slides). Note that some bugs they find (an int shift out of range) have security relevance, but coverage of vulnerabilities is incidental.

### Slide 15 · Security defect text scanners

> - Scan source code using simple grep-like lexer - Typically "know" about comments and strings - Look for function calls likely to be problematic
> - Examples: RATS (Rough Auditing Tool for Security); ITS4; Flawfinder (D.A.Wheeler)
> - Pros: Fast and cheap; Can process partial code (including un-compilable code)
> - Cons: Lack of context leads to large FN & FP rates; Useful primarily for warning of "dangerous" functions

**Expansion.** The simplest security static analysers are **text (lexical) scanners**: essentially a smart \`grep\` that tokenises the source (so it can skip comments and string literals) and flags calls to *known-dangerous functions* (\`gets\`, \`strcpy\`, \`sprintf\`, \`system\`, the Lecture-3 list). Examples: **RATS**, **ITS4**, **Flawfinder** (by David Wheeler, the author of these slides).

- **Pros**: very fast and cheap, and they work on *partial or non-compilable* code (they do not need to build it), which makes them easy to run early and often.
- **Cons**: because they have **no understanding of context or data flow**, they produce many false positives (flagging a safe \`strcpy\` of a constant) and false negatives (missing a dangerous call made through a function pointer). They are best understood as a *reminder* to review uses of dangerous functions, not as a verdict. (The "fool with a tool" slides use Flawfinder exactly to make this point.)

### Slide 16 · Analysis approach: Examining structure / Method calls

> Warn about calls to \`gets()\`:
>
> \`FunctionCall: function is [name == "gets"]\`

**Expansion.** This shows the simplest kind of analysis *rule*: a structural pattern over the program. The rule says "match any \`FunctionCall\` node whose called function has the name \`gets\`, and warn". This is how a scanner encodes "warn on dangerous functions": a query against the parsed structure (the IR of Slide 12). It catches *that* the function is called but knows nothing about *whether* the call is actually unsafe in context, hence the false positives of the previous slide. Richer rules (next slide) track data flow, not just names.

### Slide 17 · Analysis approach: Taint propagation

> - Many tools (static and dynamic) perform "taint propagation" - Input from untrusted users ("sources") considered "tainted" - Warn/forbid sending tainted data to certain methods and constructs ("sinks") - Some operations (e.g., checking) may "untaint" data
> - Static analysis: Follow data flow from sources through program; Determine if tainted data can get to vulnerable "sink"
> - Dynamic analysis (e.g., Perl, Ruby): Variables have "taint" value set when input from some sources; Certain operations (sinks) forbid direct use of tainted data - Counters accidental use of untrusted and unchecked data - esp. useful on injection (SQL, command) and buffer overflow

**Expansion.** **Taint propagation (taint analysis)** is the key technique for finding injection bugs, and it directly formalises the whole message of Lectures 4-5. Three ingredients:

- **Sources**: places where untrusted data enters (network reads, form fields, \`getenv\`, \`argv\`). Data from a source is marked **tainted**.
- **Propagation**: taint flows through the program, if tainted data is copied, concatenated or derived, the result is tainted too.
- **Sinks**: dangerous operations (a SQL query, \`system\`, \`exec\`, a buffer copy). Using tainted data in a sink is flagged or forbidden.
- **Sanitizers (untainting)**: validated/escaped data becomes untainted, so it may safely reach a sink.

This can be done **statically** (data-flow analysis traces whether any source can reach any sink without passing a sanitizer, Lecture 7) or **dynamically** (the value carries a taint bit at run time; Perl's taint mode and Ruby's \`$SAFE\` refuse tainted data at sinks, Lecture 5, Slide 28). It is "especially useful on injection (SQL, command) and buffer overflow", exactly the vulnerabilities of this course, because all of them are "untrusted data reaches a dangerous sink unchecked".

### Slide 18 · Taint propagation example

\`\`\`c
buffer = getUntrustedInputFromNetwork(); // Source
copyBuffer(newBuffer, buffer); // Pass-through
exec(newBuffer); // Sink
\`\`\`

> - Source rule: Function: getUntrustedInputFromNetwork(); Postcondition: return value is tainted
> - Pass-through rule: Function: copyBuffer(); Postcondition: If arg2 tainted, then arg1 tainted
> - Sink rule: Function: exec(); Precondition: arg1 must not be tainted

**Code analysis.** A worked taint-analysis example showing the three rule types that drive the engine:

- *Source rule*: \`getUntrustedInputFromNetwork()\` returns tainted data, so \`buffer\` is tainted.
- *Pass-through (propagation) rule*: \`copyBuffer(dst, src)\` copies taint from its second argument to its first, so \`newBuffer\` becomes tainted because \`buffer\` is.
- *Sink rule*: \`exec()\` requires its argument to be **untainted**. Since \`newBuffer\` is tainted and nothing sanitized it, the tool reports a vulnerability (tainted data reaching a command-execution sink, a command injection).

This is exactly the Lecture-5 command-injection pattern expressed as rules. The fix (adding a validation step that untaints the data, or using a safe API) would break the source-to-sink path and silence the warning, correctly. Writing good source/propagation/sink/sanitizer rules is what makes a taint-based tool accurate; missing a propagation path causes false negatives, missing a sanitizer causes false positives.

### Slide 19 · Knowledge Extraction / Program Understanding

> - Create view of software automatically for analysis - Especially useful for large code bases - Visualizes architecture - Enables queries, translation to another language
> - Examples: Hatha Systems' Knowledge Refinery; IBM Rational Asset Analyzer (RAA) \\[up-to-date knowledge of application assets from the code, web interface, inventory of mainframe/distributed assets, change-impact analysis, reuse\\]; Relativity MicroFocus (COBOL-focused)

**Expansion.** **Knowledge extraction (program understanding)** tools do not hunt for specific bugs; they automatically build a *high-level view* of a large, often legacy, code base, its architecture, call graphs, data flows, and asset inventory, so that humans can understand it, query it, assess the impact of a proposed change, or migrate it to another language. This matters for security because you cannot secure what you do not understand, and much vulnerable code lives in huge old systems (the examples here target mainframe and COBOL estates). It supports the human-analysis and architectural-risk activities rather than replacing them.

### Slide 20 · Source/Byte/Binary code security scanners/analyzers

> - https://www.nist.gov/itl/ssd/software-quality-group/samate/samate-tool-survey - Click on "Source Code Security Analyzers", "Byte Code Scanners", and "Binary Code Scanners"
> - http://www.dwheeler.com/flawfinder

**Expansion.** Pointers to catalogs of available tools: NIST's **SAMATE** (Software Assurance Metrics And Tool Evaluation) tool survey lists security analysers by the artifact they operate on, source, bytecode, or binary, and Flawfinder's homepage. The practical message: many tools exist for each category, and resources like SAMATE help choose among them for a given language and context (Slide 11's "know your stack").

## Dynamic analysis / fuzzing (pages 22-28)

Page 21 is the section divider "Dynamic Analysis".

### Slide 22 · Dynamic analysis' fundamental issue: cannot test all inputs

> - Given trivial program "add two 64-bit integers" - Input space = (2^64)(2^64) = 2^128 possibilities
> - Checking "all inputs" not realistic even in this case - Given 4GHz processor & 5 cycles/input (too fast): time = 2^128 inputs \\* (5 cycles/input) \\* (1 second/(4GHz cycles)) = 1.35 x 10^22 years (13.5 zettayears aka sextillion years)
> - Using 1 million 8-core processors doesn't help: time = 1.7 x 10^15 years (petayears aka quadrillion years)
> - Real programs have far more complex inputs - Even a 1% sample impossible in human lifetimes

**Expansion.** This slide quantifies *why testing can never be exhaustive* (Lecture 1, Slide 32). Even the most trivial program, adding two 64-bit integers, has 2^128 possible inputs. Checking them all, at a wildly optimistic 5 cycles per input on a 4 GHz CPU, takes about 1.35 × 10^22 years (vastly longer than the age of the universe, \\~1.4 × 10^10 years); even a million 8-core machines only brings it to \\~10^15 years. Real programs have astronomically larger input spaces, so even sampling 1% is impossible. **Consequence:** dynamic analysis can only ever test a tiny fraction of inputs, so it can find bugs but never prove their absence; the whole art of dynamic testing is *choosing which inputs* to try (the ones most likely to break things), which motivates fuzzing.

### Slide 23 · Functional testing for security

> - Use normal testing approaches, but add tests for security requirements - Test both "should happen" and "should not happen" - Often people forget to test what "should not happen" ("Can I read/write without being authorized to do so?"; "Can I access the system with an invalid certificate?")
> - Branch/statement coverage tools may warn you of untested paths
> - As always, automate and rerun

**Expansion.** Security testing extends ordinary functional testing with **negative tests**. Functional tests normally check that features *do what they should* (positive requirements); security requires also testing that the system *does not do what it must not* (Lecture 1, Slide 32): can an unauthorised user read or write data? does an invalid TLS certificate get rejected? People routinely forget these negative tests, which is exactly where vulnerabilities hide. **Coverage tools** (statement/branch coverage) reveal code paths that no test exercises, candidates for hidden bugs. And as always, tests should be **automated** and re-run on every change (regression testing, continuous integration), so a fix does not silently break later.

### Slide 24 · Web application scanners

> - Attempt to go through the various web forms and links
> - Send in attack-like and random data - Key issues: Input vector (Query string? HTTP body? JSON? XML?), scan barrier, crawl / input vector extraction, which vulnerabilities it detects (and how well) - Often build on "fuzzing" techniques
> - Shay Chen reviews many in "The Web Application Vulnerability Scanners Benchmark" \\[OWASP Top Ten; WAVSEP 2014 discussion; OWASP recommended tools\\]

**Expansion.** **Web application scanners** (DAST, dynamic application security testing) are automated dynamic tools specialised for web apps: they **crawl** the application to discover its forms, links and parameters (the *input vectors*: query string, POST body, JSON, XML, headers, cookies), then send **attack-like and random inputs** (SQL-injection strings, XSS payloads, traversal sequences) and observe the responses for signs of vulnerability. Key quality factors are how well they crawl (find all input vectors, get past login *scan barriers*), which vulnerability classes they detect, and their false-positive/negative rates. They build on **fuzzing** (next slides). Examples include OWASP ZAP and Burp Suite; benchmarks like WAVSEP (Shay Chen) compare them, and the OWASP Top 10 lists what they should look for.

### Slide 25 · Fuzz testing ("fuzzing")

> - Testing technique that: Provides (many!) invalid/random values as inputs; Monitors program for crashes and other signs of trouble (failing code assertions, appearance of memory leaks)… not if the final answer is "correct" (this process is the "oracle")
> - Simplifies "oracle" so can create massive data set
> - Do not need source, might not even need executable - Useful for pen-testers
> - Often quickly finds a number of real defects - Attackers use it; do not have easy-to-find vulnerabilities
> - Can be very useful for security, often finds problems
> - Typically diminishing rate of return

**Expansion.** **Fuzzing** is the most important dynamic security technique and the likely course project. The idea: feed the program *huge numbers* of invalid, malformed or random inputs and watch for **signs of trouble**, crashes, hangs, failed assertions, memory-leak or sanitizer reports, rather than checking whether the output is *correct*. The clever move is this **simplified oracle**: deciding "did it crash?" is trivial and automatable, so you can run millions of inputs unattended (the oracle problem, Slide 22, is sidestepped). Fuzzing needs no source and sometimes not even an executable's internals, so it is ideal for penetration testers and attackers alike, which is exactly why *you* should fuzz first: whatever a fuzzer finds easily, an attacker will too. It typically finds real bugs fast, then yields diminishing returns once the shallow ones are fixed (Slide 28).

### Slide 26 · Fuzz testing variations: Input

> - Fuzz testing concept from Barton Miller's 1988 class project Univ. of Wisconsin - Project created "fuzzer" to test reliability of command-line Unix programs - Repeatedly generated random data for them until crash/hang - Later expanded for GUIs, network protocols, etc.
> - Approach quickly found a number of defects
> - Many tools and approach variations created since

**Expansion.** The history: **fuzzing was invented by Barton Miller** (University of Wisconsin) in a 1988 class project, inspired, the story goes, by line noise on a modem feeding random characters to Unix programs and crashing them. His fuzzer fed random bytes to command-line Unix utilities until they crashed or hung, and found bugs in a surprising fraction of them. It was later extended to GUIs, file formats, network protocols and APIs. Input-generation strategies vary:

- **Mutation-based** (dumb) fuzzing: take valid sample inputs and randomly mutate them.
- **Generation-based** (smart) fuzzing: generate inputs from a model/grammar of the expected format, so they are structurally valid enough to reach deep code.
- **Coverage-guided** fuzzing (the modern standard, AFL/AFL++, libFuzzer, honggfuzz): instrument the program, keep and further mutate the inputs that reach *new* code paths, evolving toward deeper coverage (this is the "evolutionary" idea of Slide 30).

### Slide 27 · Fuzz testing variations: oracle

> - Originally, just "did it crash / hang"?
> - Adding program assertions (enabled!) can reveal more
> - Test other "should not happen": Ensure files/directories unchanged if shouldn't be; Memory leak (e.g., valgrind); Invalid memory access, e.g., using AddressSanitizer (aka ASan) for C/C++/Objective-C to detect buffer overflows and double-frees; More intermediate (external) state checking; Final state "valid" (!= "correct")

**Expansion.** How to make fuzzing find *more* than just crashes, by strengthening the oracle:

- The original oracle was only "crash or hang". But many bugs corrupt memory *without* crashing immediately, so you add detectors.
- **Assertions** left enabled turn silent invariant violations into detectable failures (so ship debug assertions into the fuzzing build).
- **Memory tools**: *Valgrind* detects memory leaks and invalid accesses; **AddressSanitizer (ASan)**, a compiler instrumentation for C/C++/Objective-C, catches buffer overflows, use-after-free and double-free *at the moment they happen*, turning a silent heap corruption into a loud, pinpointed report. Combining fuzzing with ASan is the single most effective way to find the memory bugs of Lecture 3.
- Also check that the program did not change files it should not have, and that its **final state is valid** (consistent). Note the careful distinction (Slide 25): a valid final state is *not* the same as a *correct* answer, the fuzzing oracle checks for *badness*, not full correctness.

### Slide 28 · Fuzz testing: Problems

> - Fully random often does not test much - e.g., if input has a checksum, fuzz testing ends up primarily checking the checksum algorithm
> - Fuzz testing only finds "shallow" problems - Special cases ("if (a == 2) …") rare in input space - Sequence of rare-probability events by "random" input will typically not be covered - Can modify generators to increase probability… but you have to know very specific defect pattern before you find defect - In general, only a small amount of program gets covered
> - Once defects found by fuzz testing fixed, fuzz testing has a quickly diminishing rate of return - Fuzz testing is still a good idea… but not by itself

**Expansion.** The limits of (naive) fuzzing:

- **Random input fails structural gates.** If the input format has a **checksum** or magic header, random mutations fail it immediately, so the fuzzer only ever exercises the checksum-validation code and never reaches the real logic. (Solutions: let the fuzzer fix up the checksum, or disable the check in the fuzzing build, or use a grammar-aware fuzzer.)
- **Only shallow bugs.** Random input rarely hits narrow conditions (\`if (a == 2)\`) or the specific *sequences* of rare events needed to reach deep code, so coverage stays low. You can bias the generator toward a pattern, but then you must already suspect the bug, which defeats the purpose.
- **Diminishing returns.** Once the easy crashes are found and fixed, continued random fuzzing finds little more.
- **Conclusion:** fuzzing is valuable but **not sufficient alone**; it complements static analysis and review. Modern coverage-guided fuzzing (Slide 26) greatly mitigates the shallow-coverage problem by steering toward new paths.

## Hybrid analysis (pages 30-32)

Page 29 is the section divider "Hybrid Analysis".

### Slide 30 · More hybrid approaches

> - Concolic testing ("Concolic" = concrete + symbolic) - Hybrid software verification technique that interleaves concrete execution (testing on particular inputs) with symbolic execution - Can be combined with fuzz testing for better test coverage to detect vulnerabilities
> - Sparks, Embleton, Cunningham, Zou 2007 "Automated Vulnerability Analysis: Leveraging Control Flow for Evolutionary Input Crafting" - Extends black box fuzz testing with genetic algorithm - Uses "dynamic program instrumentation to gather runtime information about each input's progress on the control flow graph ... Inputs which make more runtime progress ... or explore new ... regions receive a higher fitness value. Eventually, the inputs achieving the highest fitness are 'mated' ... to produce a new generation of inputs... does not require that source code be available"
> - Hybrid approaches are an active research area

**Expansion.** Hybrid methods combine static (symbolic) reasoning with dynamic (concrete) execution to beat fuzzing's shallow-coverage problem:

- **Concolic testing** (CONCrete + symbOLIC) runs the program on a concrete input while simultaneously tracking the path *symbolically* (as constraints on the input). At each branch not yet explored, it asks a **constraint solver (SMT solver)** for an input that would take the *other* branch, and runs again. This systematically drives execution down new paths, exactly reaching the narrow conditions (\`if (a == 2)\`) that random fuzzing cannot. Tools: SAGE (Microsoft), KLEE, DART/CUTE. Combined with fuzzing ("hybrid fuzzing", e.g., Driller) it gets deep coverage.
- The cited 2007 Sparks et al. work uses an **evolutionary/genetic algorithm**: it instruments the program, scores each input by how far it progresses along the control-flow graph (fitness = new/deeper code reached), and "mates" the fittest inputs to breed better ones, all without source. This is the conceptual ancestor of coverage-guided fuzzers (AFL).
- The field is active research; the lesson is that combining techniques covers each one's blind spots.

### Slide 31 · More hybrid approaches (2)

> - Dao and Shibayama 2011, "Security sensitive data flow coverage criterion for automatic security testing of web applications" (ACM) - proposes new coverage measure, "security sensitive data flow coverage": "This criterion aims to show how well test cases cover security sensitive data flows... security sensitive data flow coverage helps reduce test cost while keeping the effectiveness of vulnerability detection high."

**Expansion.** A refinement of what "coverage" should mean for *security* testing. Ordinary coverage (statement/branch) treats all code equally, but for security what matters is whether the tests exercise the **flows from untrusted sources to sensitive sinks** (the taint paths of Slide 17). This work proposes measuring **security-sensitive data-flow coverage**, how well the test suite covers those source-to-sink flows, so that testing effort is concentrated where vulnerabilities actually live, finding more bugs for less testing. It ties the dynamic-testing idea back to the taint-analysis view of injection.

### Slide 32 · Penetration testing (pen testing)

> - Pretend to be adversary, try to break in
> - Depends on the skills of the pen testers
> - Need to set rules-of-engagement (RoE) - Problem: RoE often unrealistic
> - Really a combination of static and dynamic approaches

**Expansion.** **Penetration testing** is authorised, goal-directed attacking: skilled testers *pretend to be the adversary* and try to break into the system, combining static reasoning (reading code/architecture) and dynamic attacks (fuzzing, exploitation, scanners). Key points:

- Its value **depends heavily on the testers' skill** (unlike automated tools) and their creativity in thinking like an attacker.
- **Rules of engagement (RoE)** must be agreed up front, what is in scope, what techniques are allowed, when, to avoid damage and legal problems. The practical snag: RoE are often *unrealistic* (real attackers obey no rules, have unlimited time, and may hit out-of-scope targets), so a passed pen test does not guarantee security.
- It is a *late* activity (the system must exist to be attacked) and samples the vulnerabilities rather than enumerating them (Lecture 1, Slide 44), so it complements, not replaces, earlier secure-development practices.

## Operational tooling and adoption (pages 34-39)

Page 33 is the section divider "Operational".

### Slide 34 · What about when it's fielded?

> - Hook into logging systems - Make sure your logging system is flexible and can hook into common logging systems
> - Support host-based countermeasures - e.g., address randomization, etc. - Make sure your implementation works on them - Microsoft EMET (provide info for it)
> - Host-based sandboxing/wrappers - SELinux (provide starter policy) - Document inputs and outputs (files, ports)
> - Network-based measures - Firewalls, intrusion detection/prevention systems, NATs - Don't assume client IP address you see == IP address client sees
> - When designing & implementing, prepare for security-related tools in the operational (fielded) setting

![Lecture 6, page 34](L06_p34.webp "50% 1400x131")

**Expansion.** Security tooling continues after deployment, and software must be *designed to cooperate with it*:

- **Logging**: emit security-relevant events in a form that plugs into common log/SIEM systems, so operations can detect and investigate attacks (the auditing/detection of Lecture 1, Slide 55).
- **Host-based countermeasures**: make sure your program actually *works with* OS hardening like ASLR (Lecture 3, Slide 40) and exploit mitigations (the slide names Microsoft's now-retired EMET), e.g., compile as position-independent so ASLR applies; provide the info these tools need.
- **Sandboxing/wrappers**: support confinement such as **SELinux**; to do that you must *document the program's inputs and outputs* (which files, which ports) so a tight policy (least privilege) can be written, ideally shipping a starter policy.
- **Network measures**: firewalls, IDS/IPS, NAT. A concrete warning: **do not trust the client IP you observe**, NAT, proxies and spoofing mean the address the server sees may differ from the client's real address, so do not base security decisions on it.
- The overarching point: **design for operability**, anticipate the fielded security tools during development, not after.

### Slide 35 · NIST SAMATE Tool Categories (partial)

> Assurance Case Tools; **Safer Languages**; Design/Modeling Verification Tools; **Source Code Security Analyzers, Byte Code Scanners, Binary Code Scanners**; **Web Application Vulnerability Scanners**; Intrusion Detectors; Network Scanners; Requirements Verification Tools; Architecture Design Tools; **Dynamic Analysis Tools**; Web Services Network Scanners; Database Scanning Tools; Anti-Spyware Tools; Tool Integration Frameworks

**Expansion.** NIST's **SAMATE** project classifies software-assurance tools into these categories (the bold ones were emphasised on the slide: safer languages, the source/byte/binary code analysers, web app scanners, dynamic analysis tools). The breadth of the list reinforces that no single tool covers everything, security assurance needs a *portfolio* spanning the whole life cycle: from choosing safer languages (Lecture 3) and verifying designs, through code scanning and dynamic testing, to intrusion detection in operation.

### Slide 36 · NAVSEA "Software Security Assessment Tools Review" (2009)

> Static analysis code scanning; Source code fault injection; Dynamic analysis; Architectural analysis; Pedigree analysis; Binary code analysis; Disassembler analysis; Binary fault injection; Fuzzing; Malicious code detector; Byte code analysis

**Expansion.** Another authoritative taxonomy (US Navy, NAVSEA) of assessment tool types. New categories worth noting beyond those already covered: **fault injection** (deliberately injecting faults/errors, at source, byte or binary level, to test error handling and robustness), **architectural analysis** (evaluating the design for flaws), **pedigree analysis** (tracking the provenance of components, where did this code/library come from, and is it trustworthy, the supply-chain concern of Lecture 2, Slide 8), **disassembler analysis** and **binary code analysis** (reverse-engineering compiled code), and **malicious code detectors** (finding planted backdoors/malware). Together with SAMATE it shows the full landscape of code-analysis tooling.

### Slides 37-38 · Fool with a tool is still a fool

> (37) RealNetworks' RealPlayer/Helix Player vulnerabilities:
>
> - CVE-2005-0455 / iDEFENSE Advisory 03.01.05: \`char tmp[256]; /* Flawfinder: ignore */\` \`strcpy(tmp, pScreenSize); /* Flawfinder: ignore */\`
> - CVE-2005-1766 / iDefense Advisory 06.23.05: \`sprintf(pTmp, /* Flawfinder: ignore */\`
> - CVE-2007-3410 / iDefense Advisory 06.26.07: \`strncpy(buf, pos, len); /* Flawfinder: ignore */\`
> - Kudos to RealNetworks for revealing what happened!!
> - Flawfinder: trivial static analysis tool - Lexical scanner for C code, reports vulnerability patterns - Comment "Flawfinder: ignore" disables next hit report
>
> (38) - Flawfinder correctly found the vulnerability!! - Someone then modified code, claiming not vulnerable - Yet these are obvious - not complex - vulnerabilities - Likely told "change code until no problems reported"
>
> - Tools are useless unless you understand major types of vulnerabilities and how to fix them - Training on tool not the issue (this tool trivial to run) - Training on developing secure programs is critical (Must understand tools' purpose and what to do with results; e.g., must know what it means and what to do if tool says "potential SQL injection vulnerability at line X")

**Code analysis.** A memorable cautionary tale. Flawfinder flagged dangerous calls (\`strcpy\`, \`sprintf\`, \`strncpy\`) in RealNetworks' RealPlayer; these became real CVEs. But in the shipped source, each flagged line carries the comment **\`/* Flawfinder: ignore */\`**, the special marker that tells Flawfinder to *suppress* the warning for the next hit.

- *What happened.* The tool **correctly found the vulnerabilities**, but a developer, instead of *fixing* them, simply **silenced the tool** by adding "ignore" comments, apparently believing (or being told to make) the warnings "go away". The bugs then shipped and were exploited. These were not subtle, context-dependent false positives; they were genuine, obvious buffer-overflow bugs (\`strcpy(tmp, pScreenSize)\` into a 256-byte buffer with no length check, the exact Lecture-3 pattern).
- *The lesson ("a fool with a tool is still a fool").* A tool only helps someone who **understands the vulnerabilities and how to fix them**. Running the tool is trivial; knowing what to *do* with "potential SQL injection at line X" is the hard, essential skill. If developers are measured on "no warnings" rather than "no vulnerabilities", they will suppress warnings, making the code *less* safe while appearing clean. The *fix* for these specific lines is the Lecture-3 remedy: bounds-checked copies (\`snprintf\`, \`strlcpy\`, validate \`len\`), not an "ignore" comment.
- *Credit*: the slide praises RealNetworks for transparently revealing what went wrong, so others can learn from it.

### Slide 39 · Adopting tool(s)

> - Culture change required - More than just another tool - Tool will not solve anything in isolation
> - Define objectives
> - Train before use - Esp. software security - types of vulnerabilities, how to fix them
> - Start with pilot - small and friendly group
> - Start by focusing on relevant, easily-understood - Disable detection of most problems at beginning
> - Appoint "champion" to advocate
> - Later, build on success

**Expansion.** The organisational advice for actually getting value from security tools (from Chess, West, Chou, Ritchey):

- **It is a culture change, not just a tool.** Dropping a scanner into a team that is not ready produces ignored reports or suppressed warnings (the previous slide). Success requires process and buy-in.
- **Define objectives** (what do you want the tool to achieve?) and **train first**, crucially, train in *software security itself* (what the vulnerabilities are and how to fix them), not just in clicking the tool, because the "fool with a tool" failure is a knowledge gap, not a tooling gap.
- **Start small**: a pilot with a friendly team, and initially **tune the tool to report only a few, high-value, easily-understood issue types** (disable the rest), so the team is not overwhelmed by false positives and learns to trust and act on the reports. This directly manages the FPR problem of Slide 4.
- **Appoint a champion** to advocate and support adoption, then **build on early success**, gradually enabling more checks. Rolling out everything at once is how tools get abandoned.
`;export{e as default};
