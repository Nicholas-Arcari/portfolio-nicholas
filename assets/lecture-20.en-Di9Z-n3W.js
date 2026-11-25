const e=`Lecture 20 is about **information flow**: security requirements that are not about who may *access* data, as in access control, but about where data may *go* once it has been accessed. It introduces confidentiality and integrity as flow properties with the classic \`hi\`/\`lo\` examples, the difference between **explicit** flows (assignments, output) and **implicit** flows (through conditionals), the **covert channels** (termination, timing, exceptions), a **type system** for information flow based on a lattice of security levels (Volpano-Smith style typing rules for expressions and commands, with subtyping), the semantic definition of security as **non-interference** (termination-insensitive and termination-sensitive, possibilistic and probabilistic), the comparison with Bell-LaPadula, the need for **declassification**, and how information flow is enforced in practice (Jif, taint analysis, Perl's taint mode). The slide deck has 36 pages.

## Information flow properties (pages 1-10)

### Slide 1 · Title slide

> **Security in Software Applications**
>
> Information flow

### Slide 2 · Motivating example

> - Imagine using your mobile phone to
>   1. locate nearest hotel using google
>   2. book a room with your credit card
> - Sensitive information
>   - location information
>   - credit card no
> - (Un)wanted information flow
>   - location may be leaked to google *only*
>   - credit card info may be leaked to hotel *only*

**Expansion.** The example shows why access control is not enough. To find a hotel the app must send your location to Google, and to book it must send your card number to the hotel: both pieces of sensitive information are *legitimately* accessed by the app. The security requirement is about **where each piece of information may flow**: the location to Google only, the card number to the hotel only. An app that sends the location to an advertising network, or the card number to Google, violates the policy even though it never accessed anything it was not allowed to read. This is exactly the problem of mobile apps that leak data through third-party libraries, which taint-tracking tools such as TaintDroid (2010) were built to detect.

### Slide 3 · Information Flow

> - An interesting category of security requirements is about information flow
>   - no confidential information should leak over network
>   - no untrusted input from network should leak into database
> - Information flow properties can be about confidentiality or integrity
> - Note the difference with access control:
>   - access control is about *access only*
>   - information flow is *also* about *what you do with data once you accessed it*

**Expansion.** Information flow requirements come in two dual kinds:

- **Confidentiality**: secret data must not flow to public outputs ("no confidential information should leak over the network").
- **Integrity**: untrusted data must not flow into trusted places ("no untrusted input from the network should flow into the database" without validation). This is exactly the structure of the injection attacks of Lectures 4, 5 and 9, where untrusted input flows into a query or a command.

Access control decides *whether* a program may read a file; information flow control also restricts *what the program does* with the data afterwards. A program allowed to read your contacts and to use the network satisfies access control even if it uploads the contacts; information flow control would forbid the flow from contacts to network.

### Slide 4 · Example Information Flow - Confidentiality

> \`String hi; // security label secret\`
>
> \`String lo; // security label public\`
>
> Which program fragments (may) cause problems if **hi** has to be kept confidential?
>
> \`1. hi = lo;\` · \`2. lo = hi;\` · \`3. lo = "1234";\` · \`4. hi = "1234";\`
>
> \`5. println(lo);\` · \`6. println(hi);\` · \`7. readln(lo);\` · \`8. readln(hi);\`

### Slide 5 · Example Information Flow - Confidentiality

> \`String hi; // security label secret\`
>
> \`String lo; // security label public\`
>
> Which program fragments (may) cause problems if **hi** has to be kept confidential?
>
> ✓ \`1. hi = lo;\` · ✗ \`2. lo = hi;\` · ✓ \`3. lo = "1234";\` · ? \`4. hi = "1234";\`
>
> ✓ \`5. println(lo)\` · ✗ \`6. println(hi);\` · ✓ \`7. readln(lo);\` · ? \`8. readln(hi);\`

**Expansion.** Slide 4 asks the question and Slide 5 gives the answers: ✓ (green) means no problem, ✗ (red) means a leak, ? means "it depends". \`hi\` holds a secret and \`lo\` is public, which means that its value may be observed by an attacker.

- **2. \`lo = hi;\`** ✗: the secret is copied into a public variable, an **explicit flow** from high to low.
- **6. \`println(hi);\`** ✗: the secret is printed to an output that is public.
- 1, 3, 5, 7 ✓: copying public data into the secret variable, assigning constants to public variables, printing or reading public data reveal nothing about \`hi\`.
- **4. \`hi = "1234";\`** and **8. \`readln(hi);\`** ?: they do not leak \`hi\`, but they *overwrite* it with a constant or with input. For confidentiality this is fine; whether it is acceptable depends on the integrity of \`hi\` (next slides) and on whether the outside world can tell that \`hi\` was overwritten.

### Slide 6 · Example Information Flow - Integrity

> \`String hi;\` **\`// high integrity (trusted) data\`**
>
> \`String lo;\` **\`// low integrity (untrusted) data\`**
>
> Which program fragments (may) cause problems if integrity of hi is important ?
>
> \`1. hi = lo;\` · \`2. lo = hi;\` · \`3. lo = "1234";\` · \`4. hi = "1234";\`
>
> \`5. println(lo);\` · \`6. println(hi);\` · \`7. readln(lo);\` · \`8. readln(hi);\`

### Slide 7 · Example Information Flow - Integrity

> \`String hi;\` **\`// high integrity (trusted) data\`**
>
> \`String lo;\` **\`// low integrity (untrusted) data\`**
>
> Which program fragments (may) cause problems if integrity of hi is important ?
>
> ✗ \`1. hi = lo;\` · ✓ \`2. lo = hi;\` · ✓ \`3. lo = "1234";\` · ✓ \`4. hi = "1234";\`
>
> ✓ \`5. println(lo);\` · ✓ \`6. println(hi);\` · ✓ \`7. readln(lo);\` · ✗ \`8. readln(hi);\`

**Expansion.** The same eight fragments, now with \`hi\` as **trusted** (high-integrity) data and \`lo\` as untrusted data. The answers flip with respect to confidentiality:

- **1. \`hi = lo;\`** ✗: untrusted data flows into a trusted variable, for example user input stored without validation in a field that the program later trusts. This is the integrity violation behind every injection attack.
- **8. \`readln(hi);\`** ✗: input from the outside world, untrusted by definition, is written directly into trusted data.
- All the others ✓: reading trusted data into an untrusted variable (2), printing (5, 6) or assigning constants (3, 4, a constant chosen by the programmer is trusted) do not damage the integrity of \`hi\`.

Confidentiality forbids flows from high to low; integrity forbids flows from low (untrusted) to high (trusted). The two are dual (next slide).

### Slide 8 · Some points to note

> - Beware: \`readln(confidential)\` and \`println(high_integrity)\` are *not* a problem
> - Integrity and confidentiality are similarly modelled
>   - Traditionally, most work on information flow looks at confidentiality; if we "flip" everything, we get a corresponding result for integrity
> - Information flow properties are about ruling out unwanted influences/dependencies/interference/observations
> - Note the difference between data flow properties and visibility modifiers (eg public, private) or, more generally, access control
>   - it is not (just) about accessing data, but also about what you do with it

**Expansion.** Points to remember:

- Reading input *into* a confidential variable does not leak it, and printing a high-integrity value does not corrupt it; the dangerous directions are confidential → output and input → trusted.
- The theory is developed for confidentiality and transferred to integrity by **duality**: swap "high" and "low" (secret ↔ trusted) and the same rules give integrity (the formal basis of this duality is Biba's integrity model, the mirror image of Bell-LaPadula, Slide 30).
- The general notion is **non-interference**: the secret inputs must not influence the public outputs (Slides 26-28).
- Visibility modifiers (\`private\`) are access control within the program: a \`private\` field can still be returned by a \`public\` getter and printed. Information flow is a property of what the whole program does with the data.

### Slide 9 · Questions

> - how can we specify information flow policies?
> - how can we enforce or check them?
>   - dynamically or statically
> - what is the semantics of information flow?
>   - i.e. when can we say there is information flow? how can we characterize it?

**Expansion.** The three questions the rest of the lecture answers: **specification** (security labels on variables and a lattice of levels, Slides 18-19), **enforcement**, either dynamic (monitoring or tainting at run time, Slide 35) or static (a type system, Slides 18-23), and **semantics**, a precise definition of what "no information flows" means, so that the enforcement can be proved sound (non-interference, Slides 26-32).

### Slide 10 · Type-based information flow

> - Type systems have been proposed as way to restrict information flow.
> - Practical problem: often very (too) restrictive, because of trickier examples (next slides).
> - The most mature realisation of a type system for information flow is probably in the Jflow/Jif system for Java by Andrew Myers & co.

**Expansion.** The idea, due to Denning and Denning (1977) and formalised as a type system by Volpano, Smith and Irvine (1996), is to give every variable a security **level** as part of its type, and to let the type checker reject programs in which information flows from a higher level to a lower one. It is static, so it costs nothing at run time and catches leaks before the program runs, but it is **conservative**: to rule out implicit flows (next slides) it must reject many harmless programs. **Jif** (Java + Information Flow, originally JFlow, by Andrew Myers at Cornell, 1999) is the most developed implementation: Java extended with labels that specify, for each value, its owners and the readers they allow (the decentralized label model), plus controlled declassification (Slide 34).

## Implicit flows and covert channels (pages 11-17)

### Slide 11 · Trickier examples for confidentiality

> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> Which program fragments (may) cause problems for confidentiality?
>
> 1. \`if (hi > 0) { lo = 99; }\`
> 2. \`if (lo > 0) { hi = 66; }\`
> 3. \`if (hi > 0) { print(lo);}\`
> 4. \`if (lo > 0) { print(hi);}\`

### Slide 12 · Trickier examples for confidentiality

> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> Which program fragments (may) cause problems for confidentiality?
>
> ✗ \`1. if (hi > 0) { lo = 99; }\`
>
> ✓ \`2. if (lo > 0) { hi = 66; }\`
>
> ✗ \`3. if (hi > 0) { print(lo);}\`
>
> ✗ \`4. if (lo > 0) { print(hi);}\`
>
> implicit aka indirect flows

**Expansion.** No secret value is copied in 1 or 3, yet both leak:

- **1.** After \`if (hi > 0) { lo = 99; }\`, if \`lo\` is 99 the attacker knows that \`hi > 0\`; if it kept its old value, that \`hi <= 0\`. One bit about \`hi\` has flowed into \`lo\` through the **control flow**: an **implicit** (or indirect) flow.
- **3.** Whether something is printed reveals whether \`hi > 0\`, even though only the public \`lo\` is printed.
- **4.** An explicit flow: the secret is printed (only when \`lo > 0\`, but that does not matter).
- **2.** ✓ The condition depends only on public data, and the assignment writes a secret variable: nothing secret reaches a public place.

One bit may seem harmless, but in a loop the same pattern leaks a whole secret bit by bit (for example a loop that tests each bit of \`hi\` and sets the corresponding bit of \`lo\`). Ruling out implicit flows is what makes information-flow type systems restrictive (Slide 21: the rule for \`if\`).

### Slide 13 · indirect vs direct flows

> - Direct a.k.a. explicit flows happen by a "direct" assignment/leaking, e.g. as in **\`lo=hi;\`** or **\`println(hi);\`**
>
> More subtle forms of information flows:
>
> 1) indirect/implicit flows, e.g. by **\`if (hi > 0} { lo = 99; }\`**
>
> 2) information flow via (non)termination or exceptions, or other hidden or covert channels

**Expansion.** The classification: **explicit** flows copy the secret (assignments, output); **implicit** flows go through the control structure (branching on a secret and then writing or printing); and **covert channels** use effects that are not part of the program's normal outputs: whether the program terminates, how long it takes, whether it throws an exception (Slides 14-16). (The example on the slide has a mismatched brace, \`(hi > 0}\`, for \`(hi > 0)\`.) Explicit flows are easy to detect, implicit flows require tracking the program counter's level, and covert channels are the hardest, because they depend on what the attacker can observe.

### Slide 14 · Trickier examples for confidentiality

> Example
>
> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> Which program fragments (may) cause problems for confidentiality?
>
> - \`while (hi>99) do {....};\`
> - \`while (lo>99) do {....};\`
> - \`a[hi] = 23; // where a is high/secret\`
> - \`a[hi] = 23; // where a is low/public\`
> - \`a[lo] = 23; // where a is high/secret\`
> - \`a[lo] = 23; // where a is low/public\`

### Slide 15 · Trickier examples for confidentiality

> \`int hi; // security label secret\`
>
> \`int lo; // security label public\`
>
> ✗ \`1. while (hi>99) do {....};\`
> \`// timing or termination may reveal if hi > 99\`
>
> ✓ \`2. while (lo>99) do {....};\` // no problem
>
> ✗ \`3. a[hi] = 23; // where a is high/secret\`
> \`// exception may reveal if hi is negative\`
>
> ✗ \`4. a[hi] = 23; // where a is low/public\`
> \`// contents of a may reveal value of hi and, again,\`
> \`// exception may reveal if hi is negative\`
>
> ✗ \`5. a[lo] = 23; // where a is high/secret\`
> \`// exception may reveal the length of a, which may be secret\`
>
> ✓ \`6. a[lo] = 23; // where a is low/public\`

**Expansion.** The answers (Slide 15) introduce the covert channels:

1. **\`while (hi>99)\`**: whether the loop runs, and for how long, depends on \`hi\`. An attacker who sees the program hang, or measures how long it takes, learns whether \`hi > 99\`: a **termination** or **timing** channel.
2. A loop on public data reveals nothing secret.
3. Writing a public constant into a secret array at a secret index leaks no data into \`a\`, but if \`hi\` is negative or out of bounds the program throws an **exception**, which reveals something about \`hi\`.
4. Writing at a secret index into a **public** array is an explicit leak (which element changed tells the value of \`hi\`), plus the same exception channel.
5. A public index into a secret array: the data stays secret, but an out-of-bounds exception reveals the **length** of \`a\`, which may itself be secret.
6. Public index, public array: no secret involved.

### Slide 16 · Hidden channels

> More subtle forms of indirect information flows can arise via hidden or covert channels, eg
>
> - (non)termination
>
>   eg **\`while (hi>99) do {....};\`**
>
>   or **\`if (hi=99) then {"loop"} else {"terminate"}\`**
> - execution time
>
>   eg **\`for (i=0; i<hi; i++) {...};\`**
>
>   or **\`if (hi=1234) then {...} else {...}\`**
> - exceptions
>
>   eg **\`a[i] = 23\`** may reveal length of a (if i is known), or leak info about **\`i\`** (if length of a is known), or reveal if a is null..

**Expansion.** **Covert channels** carry information through properties of the execution that the program does not mean to output:

- **Termination**: a program that loops forever when a secret has a certain value tells the attacker the value by not terminating.
- **Execution time**: a loop that runs \`hi\` times, or two branches of different length, make the running time depend on the secret. Timing channels are very real: password comparisons that stop at the first wrong character, and cryptographic code whose timing depends on the key bits (Kocher's timing attacks, 1996; the cache attacks behind Spectre), have leaked secrets in practice. The standard defence is **constant-time** code for secret-dependent operations.
- **Exceptions**: whether an exception occurs reveals properties of the index, the array or the reference involved.

Other channels: power consumption, memory and cache usage, network traffic size. A type system can control only the channels it models; Slides 28-29 show how termination is handled.

### Slide 17 · Questions

> - how can we specify information flow policies?
> - how can we enforce or check them?
>   - dynamically or statically
>     - a type system for information flow
> - what do these policies really mean?
>   - and is our enforcement sound?

**Expansion.** The questions of Slide 9, now with the approach chosen: policies are specified with security levels, enforced statically with a type system (Slides 18-23), and given a meaning with non-interference, against which the type system is proved sound (Slides 24-29).

## A type system for information flow (pages 18-25)

### Slide 18 · Types for information flow (confidentiality)

> - We consider a lattice of different security levels
> - For simplicity, just two levels
>   - H(igh) or confidential, secret or
>   - L(ow) public
> - Typing judgements *γ ⊢ e : t* meaning e has type *t* in context *γ*
> - Context *γ = x₁ : t₁, … xₙ : tn* gives levels of program variables

![Lecture 20, page 18](L20_p18.webp "4% 71x399")

**Figure.** The two-level lattice: **H** above **L**, joined by a vertical line.

**Expansion.** Security levels form a **lattice**: a partial order (≤, "may flow to") in which every two levels have a least upper bound (the level of data that combines both). The simplest lattice has two levels, **L** (low, public) ≤ **H** (high, secret): information may flow from L to H but not from H to L. Programs are typed with **judgements**: *γ ⊢ e : t* says that, in the **context** γ, which assigns a level to each variable (\`hi : H\`, \`lo : L\`), the expression *e* has level *t*, which means it contains information of level *t* or lower (Slide 20).

### Slide 19 · More complex lattices

![Lecture 20, page 19](L20_p19.webp "50% 1400x778")

**Figure.** Two lattices. On the left, a chain: **Top Secret** - **Secret** - **Classified** - **Unclassified**. On the right, a lattice with levels and compartments: **Top Secret** at the top is connected to "**Top Secret Syria**", "**Top Secret Lybia**" and "**Secret**"; "Top Secret Syria" is connected below to "**Secret Syria**", and "Top Secret Lybia" to "**Secret Lybia**"; "Secret" is connected below to both "Secret Syria" and "Secret Lybia"; these two are connected to **Unclassified** at the bottom.

**Expansion.** Real policies use richer lattices. The **military** one is a chain of classification levels (Unclassified < Classified < Secret < Top Secret). With **compartments** (need-to-know categories, here per country) the order becomes partial: "Secret Syria" and "Secret Lybia" are incomparable, so data from one compartment may not flow to the other, while both may flow to a higher level that is cleared for both. Combining two pieces of data gives their least upper bound, the lowest level that may see both. The same lattice structure is used for integrity (trusted/untrusted) and in the decentralized labels of Jif (Slide 10).

### Slide 20 · Rules for expressions

> *γ ⊢ e : t* meaning e contains information of level t or lower
>
> - variable: *γ ⊢ x : t* if *γ(x) = t*
> - operations, for binary operation +, similar for n-ary:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ e' : t
> ───────────────────────
>    γ ⊢ e + e' : t
> \`\`\`
>
> - subtyping:
>
> \`\`\`text
> γ ⊢ e : t    t ≤ t'
> ───────────────────
>     γ ⊢ e : t'
> \`\`\`
>
> where *L ≤ H*

**Expansion.** The typing rules for expressions, read top-down ("if the premises above the line hold, the conclusion below holds"):

- **Variable**: a variable has the level given by the context.
- **Operations**: if both operands have level *t*, the result has level *t*: combining data does not lower its level. To combine a low and a high value, the low one is first raised with subtyping, so \`lo + hi\` gets level H.
- **Subtyping** (subsumption): an expression of level *t* can also be considered of any higher level *t'*, because a value containing information of level *t* or lower certainly contains information of level *t'* or lower. In particular every L expression is also an H expression (low data may be used where high data is allowed), but not vice versa.

### Slide 21 · Rules for commands

> *γ ⊢ s : cmd t* meaning s only writes to level t or higher
>
> - assignment:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ x : t
> ──────────────────────
>  γ ⊢ x := e  : cmd t
> \`\`\`
>
> - if-then-else:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ c1 : cmd t    γ ⊢ c2 : cmd t
> ─────────────────────────────────────────────
>     γ ⊢ if e then c1 else c2 : cmd t
> \`\`\`
>
> - subtyping:
>
> \`\`\`text
> γ ⊢ c : cmd t    cmd t ≤ cmd t'
> ───────────────────────────────
>        γ ⊢ c : cmd t'
> \`\`\`
>
> where *cmd t ≤ cmd t'* iff *t ≥ t'* (anti-monotonicity)

On the slide, the conclusion of the subtyping rule reads "γ ⊢ c : c: cmd t'", and the left-hand side "cmd t ≤ cmd t'" of the last line appears struck through.

**Expansion.** For commands, the type records **where the command writes**: *cmd t* means that the command assigns only to variables of level *t* or higher.

- **Assignment** \`x := e\`: the expression and the variable must have the same level *t* (with subtyping, the expression may be lower). So \`hi := lo\` is allowed (L data raised to H), while \`lo := hi\` is rejected: there is no way to type \`hi\` as L. This rules out **explicit** flows.
- **If-then-else**: the branches must write only to level *t* or higher, where *t* is the level of the **condition**. If the condition is H, both branches may only write H variables, so \`if (hi > 0) { lo = 99; }\` is rejected. This rules out **implicit** flows: anything written under a secret condition reveals the condition, so it must be secret too.
- **Subtyping for commands** is **anti-monotonic**: a command that writes only at level H or above also writes only at L or above, so *cmd H ≤ cmd L*. The "reversed" direction compared with expressions is the point of the next slide.

### Slide 22 · Rules for commands

> **Note: commands subtyping backwards from expression subtyping rule!**
>
> - In expressions, can replace H with L without causing an insecure read up
> - In commands, can replace cmd L with cmd H without causing an insecure write down

The note appears in a red box over the content of Slide 21.

**Expansion.** Why the two subtyping rules go in opposite directions. An **expression** type is an upper bound on what the expression *reads*: claiming that a low expression is high is always safe (it is like over-classifying public data). A **command** type is a lower bound on what the command *writes*: claiming that a command which writes only high variables writes "low or higher" is safe, because the claim is weaker. Getting either direction wrong would allow a high value to be treated as low (an insecure read) or a command that writes low variables to be used where only high writes are allowed (an insecure write down).

### Slide 23 · Rules for commands

> *γ ⊢ s : cmd t* meaning s only writes to level t or higher
>
> - composition:
>
> \`\`\`text
> γ ⊢ c1 : cmd t    γ ⊢ c2 : cmd t
> ────────────────────────────────
>       γ ⊢ c1; c2 : cmd t
> \`\`\`
>
> - while:
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ c : cmd t
> ──────────────────────────
>  γ ⊢ while e do c : cmd t
> \`\`\`

**Expansion.** The remaining rules. **Composition**: if both commands write only at level *t* or higher, so does their sequence. **While**: like \`if\`, the body may only write to variables at least as high as the guard, so a loop on a secret condition can only modify secret variables, which rules out implicit flows through loops. As Slide 29 shows, this rule still allows the termination channel: \`while (hi > 99) do {...}\` is typable if its body writes only high variables, yet whether it terminates depends on \`hi\`.

### Slide 24 · Soundness and Completeness

> - *Soundness* of the type system: programs that are well-typed do not leak
> - *Completeness* of the type system: programs that do not leak can be typed
>
> *Is the type system on preceding slides*
>
> - *sound?*
> - *complete?*
>
> *How can we determine this?*

**Expansion.** The two properties that relate a type system to the security property it enforces. **Soundness** is the essential one: if the type checker accepts a program, the program really does not leak; an unsound checker gives false assurance. **Completeness** would mean that every non-leaking program is accepted; no practical type system is complete, because whether a program leaks is undecidable in general (the same limit as for the static analyses of Lecture 7). The type system of the previous slides is sound (with the caveats on termination, Slide 28) but not complete (next slide). To prove soundness, "does not leak" must first be defined precisely: that is non-interference (Slides 26-27).

### Slide 25 · Counterexamples for completeness

> It is easy to give examples that are not typable but do not leak, eg
>
> - **\`if (false) then { lo = hi; }\`**
> - **\`lo = hi + 1 - hi;\`**
> - **\`lo = hi; lo = 12;\`**

**Expansion.** Three harmless programs that the type system rejects:

- \`if (false) then { lo = hi; }\`: the assignment is never executed, but the type checker does not evaluate conditions, it only sees an assignment from H to L.
- \`lo = hi + 1 - hi;\`: the result is always 1, independent of \`hi\`, but the expression contains \`hi\`, so it has level H.
- \`lo = hi; lo = 12;\`: the leaked value is immediately overwritten, so the final \`lo\` is always 12; but the first assignment is rejected (and an attacker who can observe *intermediate* values of \`lo\`, for example in a concurrent setting, would in fact see \`hi\`).

The type system reasons syntactically and conservatively: it rejects these programs to be sure of rejecting all leaking ones.

## Non-interference (pages 26-32)

### Slide 26 · Counterexamples for completeness

> - Is this type system sound?
>   - i.e. does it prevent the information flows that we want to prevent
> - How do we define what we want to prevent?
> - This is commonly done by *non-interference* properties, which try to capture the notion of what can be observed
>
> In other words, non-interference gives a precise semantics for what "information flow" means

**Expansion.** To prove soundness we need a definition of "no leak" that does not refer to the type system itself. **Non-interference** (Goguen and Meseguer, 1982) is that definition: the high inputs must not *interfere* with the low outputs, that is, an observer who sees only the low part of the state cannot learn anything about the high part, because the low outputs are the same whatever the high inputs are.

### Slide 27 · Soundness wrt non-interference

> Definition For memories (or program states) **μ** and **ν**, we write **μ ~L ν** iff **μ** and **ν** agree on low variables.
>
> Definition (Non-interference)
>
> A program C does not leak information if, for all **μ ~L ν**:
>
> if executing C in **μ** terminates and results in **μ'**,
>
> and executing C in **ν** terminates and results in **ν'**,
>
> then **μ' ~L ν'**
>
> Theorem (Soundness)
>
> if *γ ⊢ C : cmd t* then C does not leak information

**Expansion.** Two memories are **low-equivalent** (μ ~L ν) when they have the same values in all low variables, so an attacker who sees only low variables cannot tell them apart. **Non-interference** says: run the program on any two low-equivalent memories, which may differ in their *secret* values; if both runs terminate, the final memories are still low-equivalent. In other words, changing the secrets never changes what the attacker sees. \`lo = hi\` violates it (two memories differing only in \`hi\` give different final \`lo\`), and so does \`if (hi > 0) { lo = 99; }\`. The **soundness theorem** states that every program accepted by the type system satisfies non-interference; its proof is by induction on the typing rules, the same technique as the type-safety theorem of Lecture 19 part 2.

### Slide 28 · Termination as covert channel?

> Definition (Non-interference) **termination-*in*sensitive**
>
> A program C does not leak information if, for all **μ ~L ν**:
>
> if executing C in **μ** terminates and results in **μ'**, and executing C in **ν** terminates and results in **ν'**, then **μ' ~L ν'**
>
> Does this rule out (non) termination as hidden channel (as observation to distinguish two runs)?
>
> Definition (Termination-sensitive non-interference)
>
> A program C does not leak information if, for all **μ ~L ν**:
>
> if executing C in **μ** terminates in **μ'**, then executing C in **ν** also terminates, and results in some **ν'** with **μ' ~L ν'**
>
> It means that
>
> - **either both terminate or both diverge**, and
> - if they terminate, the low parts match

**Expansion.** The definition of Slide 27 says nothing when one of the runs does not terminate, so it is **termination-insensitive**: \`while (hi > 99) do {}\` satisfies it (whenever both runs terminate, they leave \`lo\` unchanged), although an attacker who sees whether the program hangs learns whether \`hi > 99\`. The **termination-sensitive** version adds the requirement that termination itself must not depend on secrets: on low-equivalent memories either both runs terminate (with low-equivalent results) or both diverge. Termination-insensitive non-interference is the common choice in practice because it is much less restrictive; the price is that a program can leak through termination, which over a single run is about one bit but, if the attacker can run the program many times with different public inputs, can reveal the whole secret.

### Slide 29 · While-rule for termination-sensitive non- interference

> The while-rule
>
> \`\`\`text
> γ ⊢ e : t    γ ⊢ c : cmd t
> ──────────────────────────
>  γ ⊢ while e do c : cmd t
> \`\`\`
>
> does *not* rule out non-termination as covert channel
>
> A more restrictive rule
>
> \`\`\`text
> γ ⊢ e : L    γ ⊢ c : cmd L
> ──────────────────────────
>  γ ⊢ while e do c : cmd L
> \`\`\`
>
> does rule this out.
>
> *(How? NB this is very restrictive!)*
>
> - A similar change needed for if-then-else rule.

**Expansion.** To enforce termination-sensitive non-interference, loops must not depend on secrets: the restrictive rule requires the **guard to be low** (the \`L\` is in red on the slide). Then whether and when the loop terminates depends only on public data, so the termination channel disappears. It is **very restrictive**: no loop may ever test a secret value, which forbids even simple algorithms such as iterating over the characters of a password. A similar change is needed for \`if\`, because a branch on a secret could contain a loop (or, more generally, the two branches could differ in whether they terminate).

### Slide 30 · Bell-LaPadula

> - The type system is similar to classic Bell-LaPadula system which combines
>   - Mandatory Access control (MAC)
>   - Multi-Level Security (MLS)
>
>   and protects information flow between files by rules
>   - no read up
>   - no write down
>     - *nb similarity with our typing rules*
> - But for program accessing variables, instead of a process accessing files
> - Moreover: type system checks program statically, whereas Bell-LaPadula monitors process at runtime

**Expansion.** **Bell-LaPadula** (1973) is the classic model of military multi-level security: subjects and objects have levels, access is **mandatory** (set by the system, not by the owner, unlike discretionary access control), and two rules protect confidentiality: **no read up** (a subject cannot read objects above its level) and **no write down** (a subject cannot write objects below its level, so it cannot copy secret data into a public file). These are exactly the two directions of the typing rules: expressions may not be read at a lower level than their content, commands may not write below their level. The differences: Bell-LaPadula controls **processes accessing files** and is enforced by a **run-time** monitor, while the type system controls **statements accessing variables** and checks the program **statically**, which also covers implicit flows inside the program, which Bell-LaPadula cannot see.

### Slide 31 · Other notions of secure information flow

> Other definitions of what it means to be secure (in the sense of non-leaking) are needed if
>
> - if programs can throw exceptions
>   - exceptions are another covert channel, just like non-termination
> - if programs are multi-threaded or non-deterministic
>   - because execution of a program can then result in several outcomes
>     - multi-threaded programs are non-deterministic, because results can depend on scheduling

**Expansion.** The definition of non-interference assumes a deterministic program without exceptions. With **exceptions**, the observation "the program stopped with an exception" must be included, like termination. With **non-determinism** (for example multi-threading, where results depend on the scheduler) a program has several possible outcomes for the same input, and "the final low state is the same" must be replaced by a comparison of the *sets* (or the probability distributions) of possible outcomes (next slide).

### Slide 32 · Information flow for non-deterministic programs

> Definition (Possibilistic NI)
>
> A non-deterministic program **C** does not leak information if for all μ ~L ν
>
> if executing C in μ terminates in μ', then executing C in ν *can* terminate in some ν' with μ' ~L ν'
>
> This still ignores *probabilistic* information flows, for which one would take the chance that C does terminate in some ν' with μ' ~L ν' into account
>
> - Running the program multiple times, you might be able to observe something, for example:
>
> **\`If hi == 0: low = 0 w.p. 0.9 and 1 w.p 0.1\`**
>
> **\`If hi == 1: low = 1 w.p. 0.1 and 1 w.p 0.9\`**
>
> - Observation of low does not leak information in a single execution since 0 and 1 are both possible outputs of low
> - In multiple executions the adversary can inspect the distribution of low

**Expansion.** **Possibilistic** non-interference requires that every low outcome possible for one secret is also *possible* for the other: the set of possible observations does not depend on the secret. It is too weak against an attacker who can repeat the experiment. In the example (w.p. = with probability; the intended second line is presumably "low = 0 w.p. 0.1 and 1 w.p. 0.9"), both values 0 and 1 are possible whatever \`hi\` is, so possibilistic non-interference holds, but the **distribution** of \`low\` depends on \`hi\`: after many runs, an attacker who sees \`low = 0\` most of the time knows that \`hi == 0\`. **Probabilistic** non-interference requires the probability distribution of the low outputs to be independent of the secrets, which is the relevant notion for concurrent programs and for randomised algorithms.

## Declassification and practice (pages 33-36)

### Slide 33 · The problem with secure information flow

> - *Practical* problem with secure information flow: the extreme restrictions it imposes, esp. when it come to ruling out implicit flows
>   - eg no while loop with a high guard
>   - note that login program leaks information about the password
> - More generally, some way of allowing forms of declassification is needed in practice

**Expansion.** Strict non-interference is too strong for real programs. The login example makes it clear: a login program compares the input with the secret password and tells the user whether they match, so it necessarily **leaks** information about the password (whether the guess is right, one bit per attempt). By non-interference it is insecure; in practice it is the intended behavior. Real systems therefore need **declassification**: controlled, explicit ways to release some information about secrets, and policies that limit how much (for example, a limited number of login attempts).

### Slide 34 · Declassification

> More *permissive* forms of information flow can allow de-classification, eg
>
> - for *confidentiality*:
>   - output of encryption operation is labelled as public, even though it depends on secret data.
> - for *integrity*:
>   - output of input validation routine may be trusted, even though it depends on untrusted data
>   - output of routine that checks digital signature may be trusted, even though it depends on untrusted data

**Expansion.** Typical declassification points:

- **Confidentiality**: the output of an encryption function depends on the plaintext and the key, both secret, yet the ciphertext is sent over a public network. The encryption function is a trusted point where secret data is declassified to public.
- **Integrity** (where the dual operation is called **endorsement**): the output of an **input validation** routine (Lecture 5) is considered trusted although it derives from untrusted input, and so is data whose **digital signature** has been verified.

Declassification is where security now depends on the correctness of a few trusted functions, so information-flow systems such as Jif make it explicit in the code (a \`declassify\` operation that only the owner of the data may perform), where it can be audited.

### Slide 35 · Information Flow in "practice"

> - Static enforcement
>   - JFlow/Jif is a type system for expressing & enforcing information flow properties for Java
>     - using it requires serious effort
>   - Many code analysis tools perform some data flow analysis
>     - Eg to spot SQL injection problems
>     - Recall PREfast did this, but only intra-procedural
>     - NB typically for integrity, not confidentiality
>     - Often unsound/incomplete, as concession to practicality
> - Dynamic enforcement
>   - Perl has an *runtime monitoring* of information flow properties (again for integrity properties) using tainting
>
>   Pragmatic approaches typically worry less - if at all - about implicit flows.
>   - Indeed, are implicit flows an issue for integrity?

**Expansion.** How information flow is used in practice:

- **Static enforcement**: full type systems such as Jif exist but require labelling the whole program, so they are used mainly in research and high-assurance systems. Much more common are **taint analyses** in static analysis tools (Lecture 6, Slides 17-18): they track flows from untrusted sources (request parameters) to sensitive sinks (SQL queries, shell commands) to find injections (Lectures 4, 5, 9), an **integrity** property. PREfast, Microsoft's static analyser for C/C++, analysed one function at a time (intra-procedural), which limits how far it can follow a flow. These tools usually trade soundness for practicality, accepting some false negatives and false positives.
- **Dynamic enforcement**: **taint tracking** at run time. Perl's **taint mode** (\`perl -T\`) marks all external input as tainted, propagates the mark through computations, and stops the program if tainted data reaches a dangerous operation (a shell command, a file open) without first being validated with a regular expression, which is Perl's way of untainting (declassification for integrity).

The last remark: practical tools usually track only explicit flows. For integrity this is a reasonable compromise, because an attacker who can only influence *which* branch is taken controls far less than one who injects data directly; for confidentiality, ignoring implicit flows leaves real leaks undetected.

### Slide 36 · Summary

> - What is information flow?
>   - explicit flows
>   - implicit flows
>   - covert channels
> - How can we *syntactically* control information flow, using type systems? (at compile time, ie. statically)
> - How can we *semantically* define information flow?
>   - non-interference
> - Termination sensitive vs termination insensitive

**Expansion.** The lecture in four points: information can flow **explicitly** (copying), **implicitly** (through control flow) and through **covert channels** (termination, time, exceptions); a **type system** with security levels controls flows statically, rejecting explicit and implicit flows from high to low; **non-interference** defines semantically what "no flow" means, and the type system is sound with respect to it; and the termination channel is excluded only by the stronger, **termination-sensitive** definition, at the price of very restrictive typing rules.
`;export{e as default};
