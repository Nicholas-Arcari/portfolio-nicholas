const e=`Lecture 7 opens the box of the static-analysis tools surveyed in Lecture 6: what program analysis is and what it is used for (bug finding, security, verification, optimisation), why a static analysis that answers questions about *all* executions must give something up (the question is undecidable), and how **abstract interpretation** builds analyses that are **sound by construction**: an abstract domain, abstraction and concretization functions, abstract transformers, and a fixed-point computation over the control-flow graph, all worked out on a sign analysis of a small loop. The slide deck has 105 pages. The deck is an adapted external presentation, **"A Gentle Introduction to Program Analysis" by Işıl Dillig (University of Texas at Austin)**, given at the Programming Languages Mentoring Workshop on 21 January 2014.

**Note on the page numbering.** The deck is built up incrementally: each frame (numbered "n / 24" in its footer) is spread over several consecutive PDF pages, each adding one bullet or one step of a picture. The 105 pages hold 22 frames (the footer counts 24, but the PDF stops at frame 22). The notes group the pages of a frame under one heading ("Slides 2-4", ...) and quote the text of the frame's final, complete page. Where a picture changes from page to page, every distinct state is shown; in particular all the steps of the fixed-point computation of pages 80-94.

## What program analysis is (pages 1-13)

### Slide 1 · Title slide

> **A Gentle Introduction to Program Analysis**
>
> Işıl Dillig · University of Texas, Austin
>
> January 21, 2014 · Programming Languages Mentoring Workshop

**Expansion.** The Programming Languages Mentoring Workshop (PLMW) is held alongside the main programming-languages conferences to introduce students to the field, which is why the talk is a self-contained tour that assumes no background. The course uses it as the theory behind the static analysers of Lecture 6: why they report false positives, why they miss bugs, and how a *sound* analyser is built.

### Slides 2-4 · What is Program Analysis?

> - Very broad topic, but generally speaking, **automated** analysis of program behavior
> - Program analysis is about developing algorithms and tools that can analyze **other programs**

![Lecture 7, page 4](L07_p04.webp "50% 1337x592")

**Figure (page 4).** A program file, **prog.c** (green arrow), and a **Query** speech bubble (orange arrow) both feed a green box, **Program Analysis Tool** (drawn with gears). A black arrow leads from the tool to a clipboard with a ticked checklist and a pencil: the report with the answer.

**Expansion.** Program analysis is "programs that reason about programs". The picture is the shape of every analysis tool in the course:

- **Input 1, the program**: source code (as here), bytecode or a binary (Lecture 6, Slide 8 compared source and executables).
- **Input 2, the query**: the property we care about, e.g., "can this \`strcpy\` overflow?", "can tainted input reach \`exec\`?" (Lecture 6, Slides 17-18), "is \`x\` always non-negative?" (the running example of this lecture, Slides 77-78).
- **Output**: a report, either "the property holds" (a proof) or a list of warnings, possibly with counterexamples.
- The key word is **automated**: the tool must work without human help on programs of realistic size. This is what makes the theoretical limit of Slides 14-20 (undecidability) bite.

### Slides 5-9 · Applications of Program Analysis

> - **Bug finding.** e.g., expose as many assertion failures as possible
> - **Security.** e.g., does an app leak private user data?
> - **Verification.** e.g., does the program always behave according to its specification?
> - **Compiler optimizations.** e.g., which variables should be kept in registers for fastest memory access?
> - **Automatic parallelization.** e.g., is it safe to execute different loop iterations in parallel?

**Expansion.** The same technology serves very different goals, with different tolerance for errors:

- **Bug finding** looks for concrete defects (assertion failures, null dereferences, buffer overflows). Missing some bugs is acceptable, but false alarms are costly, because developers stop reading noisy reports (Lecture 6, Slide 4).
- **Security** asks questions about information flow: can secret data (contacts, location, passwords) reach an untrusted sink such as the network, or can untrusted input reach a sensitive operation such as a query or a command? This is taint analysis (Lecture 6, Slides 17-18), used for example to vet mobile apps (FlowDroid for Android) and to find the injections of Lectures 4, 5 and 9.
- **Verification** proves that *every* execution meets the specification: the "most extreme form of static analysis" of Lecture 3, Slide 51. Here no bug may be missed.
- **Compiler optimizations** have been the first customer of program analysis since the 1970s: register allocation needs *liveness* analysis (which variables are still needed), constant propagation needs to know which values are constant, dead-code elimination needs reachability. An optimisation is applied only when the analysis *proves* that it cannot change the program's behaviour.
- **Automatic parallelization** needs *dependence* analysis: two loop iterations can run in parallel only if neither writes memory that the other reads or writes.

### Slides 10-13 · Dynamic vs. Static Program Analysis

> - Two flavors of program analysis:
>   - **Dynamic analysis:** Analyzes program while it is running
>   - **Static analysis:** Analyzes source code of the program

![Lecture 7, page 13](L07_p13.webp "50% 1400x496")

**Figure (page 13).** A pair of scales between the two approaches. On the left, **Static**: "+ reasons about all executions", "- less precise". On the right, **Dynamic**: "+ more precise", "- results limited to observed executions".

**Expansion.** This is the static/dynamic split of Lecture 6, Slide 3, with its trade-off made explicit:

- **Dynamic analysis** observes real executions: testing, fuzzing, sanitizers such as AddressSanitizer or Valgrind, run-time monitors. Every problem it reports really happened, so it is *precise* (essentially no false positives). But it sees only the executions that were actually run, and the input space is astronomically large (Lecture 6, Slide 22: 2^128 inputs just to add two 64-bit integers), so the absence of reported bugs proves nothing about the inputs that were not tried.
- **Static analysis** reasons about the code without running it, so it covers **all** executions at once, including the ones no test would ever trigger. The price is precision: to cover infinitely many executions in finite time it must approximate (the rest of the lecture), and approximation produces false alarms.
- The two are complementary: hybrid techniques such as concolic testing combine them (Lecture 6, Slides 30-31), and the secure development lifecycle applies both (Lecture 13).

## Static analysis and abstraction (pages 14-31)

### Slides 14-20 · Static Analysis

> - **Typical static analysis question:** "Given source code of program P and desired property Q, does P exhibit Q in **all possible executions**?"
> - But this question is **undecidable**!
> - This means static analyses are either:
>   - **Unsound:** May say program is safe even though it is unsafe
>   - **Sound, but incomplete:** May say program is unsafe even though it is safe
>   - **Non-terminating:** Always gives correct answer when it terminates, but may run forever
> - Many static analysis techniques are sound but incomplete.

**Expansion.** This slide is the theoretical heart of the lecture, and it explains the false positives and false negatives of every tool in Lecture 6.

- **Why the question is undecidable.** By **Rice's theorem** (1953), every non-trivial question about the *behaviour* of programs (as opposed to their text) is undecidable: no algorithm answers it correctly for every program. The proof reduces from the **halting problem**: if we could decide "can program P ever reach \`error()\`?", we could decide whether any program Q halts, by asking the question about "run Q, then call \`error()\`". So a perfect analyser, always terminating and always right, cannot exist.
- **The three escape routes.** An analyser cannot have *soundness* (never misses a real problem), *completeness* (never reports a false one) and *termination* all at once, so it gives one up:
  - *Unsound*: it may answer "safe" for an unsafe program, i.e., **false negatives**. Most practical bug finders, and the text scanners of Lecture 6, Slide 15, are deliberately unsound, to keep false alarms low.
  - *Sound but incomplete*: every "safe" answer is a guarantee, but it may raise **false positives**. Verifiers and abstract interpreters are of this kind; for example Astrée proved the absence of run-time errors in Airbus flight-control software.
  - *Non-terminating*: always right when it answers, but it may run forever, like an exhaustive exploration of an infinite state space.
- In the vocabulary of Lecture 6, Slide 4: soundness means no false negatives (TPR = 100%), completeness means no false positives. The rest of the lecture shows how to build the second kind, **sound but incomplete**, systematically.

### Slides 21-26 · How to design sound static analyses?

> **Key idea:** Overapproximate (i.e., abstract) program behavior
>
> - Bad states outside over-approximation ⇒ Program safe
> - Bad states inside over-approximation, but outside *P* ⇒ false alarm
>
> ⇒ **Goal:** Construct abstractions that are **precise** enough (i.e., few false alarms) and that **scale** to real programs

![Lecture 7, page 22](L07_p22.webp "19% 660x487") ![Lecture 7, page 23](L07_p23.webp "19% 660x487") ![Lecture 7, page 24](L07_p24.webp "19% 660x487") ![Lecture 7, page 25](L07_p25.webp "19% 660x487") ![Lecture 7, page 26](L07_p26.webp "19% 660x487")

**Figure (pages 22-26).** A picture built up step by step. Page 22: an irregular yellow blob labelled ***P***, the set of states the program can really reach (its exact behaviour). Page 23: a smooth green region drawn around *P* and containing it: the over-approximation computed by the analysis. Page 24: a red region of **bad states** (the states that violate the property) lying entirely outside the green region. Pages 25-26: the red region now overlaps the green over-approximation, but it still does not touch *P*.

**Expansion.** Over-approximation is how soundness is obtained:

- The exact set of reachable states *P* cannot be computed (Slides 14-20). The analysis computes instead a **superset** of it: a shape that is simpler to represent and to compute, but is guaranteed to contain every real behaviour.
- **Case 1 (page 24): no bad state in the over-approximation.** The real behaviours lie inside the green region, and the green region contains no bad state, so no real execution can be bad: the program is **proved safe**. This is soundness.
- **Case 2 (pages 25-26): bad states inside the over-approximation but outside *P*.** The analysis cannot tell whether those states are real (inside *P*) or artefacts of the approximation, so it must report a possible error: a **false alarm** (a false positive in the terms of Lecture 6). The program is actually safe, but the abstraction was too coarse to prove it.
- (In the third case, a bad state inside *P* itself, the bug is real, and a sound analysis always reports it.)
- **The engineering goal**: an abstraction **precise enough** to avoid most false alarms, but **simple enough to scale** to real programs of millions of lines. More precision costs more time and memory, so every analysis tool sits somewhere on this trade-off: the ROC trade-off of Lecture 6, Slide 5, seen from the tool builder's side.

### Slides 27-31 · Examples of Abstractions

> **There is no "one size fits all" abstraction**
>
> - **What information is useful depends on what you want to prove about the program!**

![Lecture 7, page 29](L07_p29.webp "50% 1400x302")

![Lecture 7, page 30](L07_p30.webp "50% 1400x302")

![Lecture 7, page 31](L07_p31.webp "50% 1400x302")

**Figure (pages 29-31).** A two-column table, filled in one row per page:

| Application | Useful abstraction |
| --- | --- |
| No division-by-zero errors | zero vs. non-zero |
| Data structure verification | list, tree, graph, ... |
| No out-of-bounds array accesses | ranges of integer variables |

**Expansion.** An *abstraction* keeps only the facts relevant to the question and forgets everything else, and which facts are relevant depends on the property:

- To prove **no division by zero**, it is enough to know, for each variable, whether it is zero or non-zero; its exact value does not matter.
- To verify **data-structure manipulations** (e.g., that a list reversal does not lose elements or create a cycle), the analysis needs the *shape* of the heap: is this pointer structure a list, a tree, a graph? This is *shape analysis*.
- To prove **no out-of-bounds array access**, which is exactly the absence of buffer overflows (Lectures 3 and 8), the analysis needs numeric **ranges** of the index variables, e.g., the *interval domain*: \`i ∈ [0, 9]\` for an array of 10 elements. Bounds checkers based on abstract interpretation (Astrée, Frama-C, Polyspace) use interval-like domains to prove that every \`buf[i]\` stays within bounds.
- A richer abstraction proves more but costs more; a tool picks the cheapest one that can still decide its query (the precision/scalability trade-off of Slides 21-26).

## Abstract interpretation (pages 32-67)

### Slides 32-36 · How to Create Sound Abstractions?

> - Useful theory for understanding how to design sound static analyses is **abstract interpretation**
>   - Seminal '77 paper by Patrick & Radhia Cousot
> - Not a specific analysis, but rather a framework for designing sound-by-construction static analyses
> - Let's look at an example: A static analysis that tracks the sign of each integer variable (e.g., positive, non-negative, zero etc.)

**Figure (pages 34-36).** Photographs of Patrick Cousot and Radhia Cousot.

**Expansion.** **Abstract interpretation** was introduced by Patrick and Radhia Cousot in *"Abstract interpretation: a unified lattice model for static analysis of programs by construction or approximation of fixpoints"* (POPL 1977). The idea: run the program not on concrete values but on *abstract* values (signs, intervals, heap shapes), with each operation replaced by an abstract counterpart, in such a way that the abstract result is *guaranteed* to over-approximate every concrete result. It is a **framework**: the analysis designer chooses an abstract domain, and the theory says exactly what must be proved (the conditions of Slides 42-65) for the resulting analysis to be sound *by construction*. Industrial analysers built on it include Astrée (absence of run-time errors in the flight-control software of the Airbus A340 and A380), Polyspace and Frama-C, and the same ideas underlie the data-flow analyses of every optimising compiler. The remaining slides build a complete example, the **sign analysis**, step by step.

### Slides 37-41 · First Step: Design An Abstract Domain

> - An **abstract domain** is just a set of **abstract values** we want to track in our analysis
> - For our example, let's fix the following abstract domain:
>   - pos: {x | x ∈ ℤ ∧ x > 0}
>   - zero: {0}
>   - neg: {x | x ∈ ℤ ∧ x < 0}
>   - non-neg: {x | x ∈ ℤ ∧ x ≥ 0}
> - In addition, every abstract domain contains:
>   - ⊤ (top): "Don't know", represents any value
>   - ⊥ (bottom): Represents empty-set

**Expansion.**

- Each abstract value **stands for a set of concrete values**: \`pos\` for all positive integers, \`zero\` for {0}, and so on. For every variable at every program point, the analysis tracks one abstract value instead of the (possibly infinite) set of values the variable can take.
- **⊤ (top)** is the least informative value, "could be anything" (all of ℤ). The analysis falls back to it when it cannot say anything better, e.g., after adding a positive and a negative number (Slides 64-65).
- **⊥ (bottom)** is the empty set of values, "no value at all", which in practice means "this program point has not been reached (yet)". It is the starting value of the fixed-point computation (Slides 71-76).
- The domain is tailored to the question to be answered: with \`non-neg\` available, the analysis can prove "x is never negative" (the question of Slides 77-78). It is also deliberately coarse: there is no "non-positive" or "non-zero" value, so a set such as {-3, 2} can only be described by ⊤ (Slides 42-50).

### Slides 42-50 · Second step: Abstraction and concretization functions

> - **Abstraction function (α)** maps sets of concrete elements to the most precise value in the abstract domain
>   - α({2, 10, 0}) = non-neg
>   - α({3, 99}) = pos
>   - α({-3, 2}) = ⊤
> - **Concretization function (γ)** maps each abstract value to sets of concrete elements
>   - γ(pos) = {x | x ∈ ℤ ∧ x > 0}

**Expansion.** α and γ connect the concrete and the abstract worlds:

- **α (abstraction)** goes from concrete to abstract: given a set of concrete values, it returns the *smallest* (most precise) abstract value whose meaning contains all of them. {2, 10, 0} contains 0 as well as positive numbers, so \`pos\` is too small and \`non-neg\` is the most precise fit; {3, 99} are all positive, so \`pos\`; {-3, 2} mixes signs, and the only value of the domain that contains both a negative and a positive number is ⊤.
- **γ (concretization)** goes from abstract to concrete: it gives the *meaning* of an abstract value, the set of concrete values it represents: \`γ(pos) = {x | x ∈ ℤ ∧ x > 0}\`, \`γ(⊤) = ℤ\`, \`γ(⊥) = ∅\`.
- α must always return a value that **contains** the concrete set, never one that loses a possible value: this is the over-approximation of Slides 21-26, applied to a single variable.

### Slides 51-54 · Lattices and Abstract Domains

> - Concretization function defines **partial order** on abstract values: **A₁ ≤ A₂ iff γ(A₁) ⊆ γ(A₂)**
> - Furthermore, in an abstract domain, every pair of elements has a lub and glb ⇒ **mathematical lattice**
> - Least upper bound of two elements is called their **join** - useful for reasoning about control flow in programs

![Lecture 7, page 54](L07_p54.webp "29% 518x507")

**Figure (pages 53-54).** The diagram of the sign lattice: **⊤** at the top; below it **non-neg** and **neg**; below **non-neg**, the values **pos** and **zero**; at the bottom **⊥**, connected to **pos**, **zero** and **neg**. A line from a lower to a higher element means "is below", i.e., is more precise than.

**Expansion.**

- **The order.** A₁ ≤ A₂ means that A₁ is *more precise* than A₂ (it describes fewer concrete values): \`pos ≤ non-neg\` because every positive number is non-negative, \`zero ≤ non-neg\`, every value is ≤ ⊤ and ≥ ⊥. \`pos\` and \`neg\` are *incomparable*: neither set contains the other, which is why the order is only *partial*.
- **lub and glb.** The *least upper bound* (lub, or **join**, written ⊔) of two values is the most precise value above both; the *greatest lower bound* (glb, or meet, written ⊓) is the least precise value below both. From the diagram: \`pos ⊔ zero = non-neg\`, \`pos ⊔ neg = ⊤\`, \`non-neg ⊔ neg = ⊤\`, \`pos ⊓ zero = ⊥\`, \`pos ⊓ non-neg = pos\`. A partial order in which every pair of elements has a lub and a glb is a **lattice**.
- **Why the join matters.** Where two control-flow paths meet (after an \`if\`/\`else\`, or at a loop head, where the first entry meets the back edge), the analysis does not know which path was taken, so it must keep both possibilities: the state at the merge point is the **join** of the incoming states. If one branch gives \`x = zero\` and the other \`x = pos\`, after the merge \`x = zero ⊔ pos = non-neg\`, exactly what happens at the loop head in the worked example (page 89).

### Slides 55-58 · Almost-Inverses

> - Important property of the abstraction and concretization function is that they are **almost inverses**:
> - This is called a **Galois insertion** and captures the soundness of the abstraction

![Lecture 7, page 56](L07_p56.webp "50% 1022x529")

![Lecture 7, page 58](L07_p58.webp "50% 1022x529")

**Figure (pages 56-58).** Two formulas, each with an arrow diagram. Top (page 56): **α(γ(A)) = A**, with an arrow γ from an abstract value *A* to a concrete set *C*, and an arrow α from *C* back to the same *A*. Bottom (page 57): **C ⊆ γ(α(C))**, with an arrow α from a concrete set *C* to *A*, and an arrow γ from *A* back to a larger set *C′* drawn around *C*.

**Expansion.**

- **α(γ(A)) = A**: take the meaning of an abstract value and abstract it again, and you get back exactly the same value, so no abstract value is redundant. Example: γ(pos) = {1, 2, 3, ...}, and α of that set is \`pos\` again.
- **C ⊆ γ(α(C))**: abstract a concrete set and take the meaning of the result, and you get a set that **contains** the original one, usually a strictly larger set. Information is lost, but never a possible value. Example: C = {2, 10, 0}, α(C) = non-neg, γ(non-neg) = {0, 1, 2, ...} ⊇ C. This inclusion is precisely the over-approximation that makes the analysis **sound**.
- So α and γ are not true inverses (the second round trip loses precision), hence "almost". Mathematically the pair forms a **Galois connection** (α(C) ≤ A if and only if C ⊆ γ(A)); when in addition α(γ(A)) = A it is called a **Galois insertion**. This is the formal condition under which whatever the analysis concludes about abstract values is true of all the concrete executions they represent.

### Slides 59-63 · Step 3: Abstract Semantics

> - Given abstract domain, α, γ, need to define **abstract transformers (i.e., semantics)** for each statement
>   - Describes how statements affect our abstraction
>   - Abstract counter-part of operational semantics rules

![Lecture 7, page 62](L07_p62.webp "50% 1400x460")

![Lecture 7, page 63](L07_p63.webp "50% 1400x460")

**Figure (pages 62-63).** Two side-by-side diagrams of the same statement box, **x = y op z**. Left, *Operational Semantics*: an incoming arrow labelled **S: Var → Concrete value** and an outgoing arrow labelled **S′: Var → Concrete value**. Right (page 63), *Abstract Semantics*: incoming **A: Var → Abstract value**, outgoing **A′: Var → Abstract value**.

**Expansion.**

- The **concrete (operational) semantics** of a statement maps a concrete state *S*, a function giving each variable its concrete value, to the state *S′* after the statement: if \`y = 3\` and \`z = 4\`, after \`x = y + z\` we have \`x = 7\`.
- The **abstract semantics**, or *abstract transformer*, does the same on abstract states: *A* gives each variable an abstract value, and the transformer computes *A′*: if \`y = pos\` and \`z = pos\`, after \`x = y + z\` we have \`x = pos\`. The analysis runs the program with these transformers instead of the real operations.
- There must be a transformer for every kind of statement (assignments with each operator, conditions, function calls, ...), and each must be **sound**: it must over-approximate the concrete semantics, as the next slide states.

### Slides 64-65 · Back to Our Example

> - For our sign analysis, we can define abstract transformer for x = y + z as follows:
> - To ensure soundness of static analysis, must prove that abstract semantics faithfully models concrete semantics

![Lecture 7, page 65](L07_p65.webp "50% 1376x619")

**Figure (pages 64-65).** The abstract addition table: the row gives the abstract value of \`y\`, the column the abstract value of \`z\`, and the cell the abstract value of \`x = y + z\`:

| y \\ z | pos | neg | zero | non-neg | ⊤ | ⊥ |
| --- | --- | --- | --- | --- | --- | --- |
| **pos** | pos | ⊤ | pos | pos | ⊤ | ⊥ |
| **neg** | ⊤ | neg | neg | ⊤ | ⊤ | ⊥ |
| **zero** | pos | neg | zero | non-neg | ⊤ | ⊥ |
| **non-neg** | pos | ⊤ | non-neg | non-neg | ⊤ | ⊥ |
| **⊤** | ⊤ | ⊤ | ⊤ | ⊤ | ⊤ | ⊥ |
| **⊥** | ⊥ | ⊥ | ⊥ | ⊥ | ⊥ | ⊥ |

**Expansion.** How to read and check the table:

- Each cell answers the question: "if \`y\` is any value in γ(row) and \`z\` is any value in γ(column), which abstract value is guaranteed to contain \`y + z\`?" pos + pos is always positive, so \`pos\`; zero + non-neg is non-negative, so \`non-neg\`; pos + neg can be positive, zero or negative, and the domain has nothing smaller than ⊤ that contains all three; anything + ⊤ is ⊤; anything + ⊥ is ⊥ (if one operand has no possible value, the program point is unreachable, so the result is empty too).
- **Soundness** of the transformer means: for every concrete \`y ∈ γ(Ay)\` and \`z ∈ γ(Az)\`, the concrete sum \`y + z\` belongs to γ(table[Ay][Az]). For example \`non-neg + pos = pos\` is sound because 0 + 1 = 1 > 0 and larger values only give larger sums. Proving this for every cell, and for every operator, is the "must prove" of the slide; once it is done, the whole analysis is sound by construction.
- The table is also as **precise** as the domain allows. A transformer answering ⊤ everywhere would be sound but useless, since every check would end in a false alarm.
- The table is symmetric because addition is commutative; note in particular that neg + non-neg is ⊤ (-5 + 7 > 0 but -5 + 0 < 0).

### Slides 66-67 · Putting It All Together

![Lecture 7, page 66](L07_p66.webp "50% 1400x496")

![Lecture 7, page 67](L07_p67.webp "50% 1400x496")

**Figure (pages 66-67).** The analysis designer (a cartoon person giving a thumbs-up) supplies two inputs to a box labelled **Fixed-point engine** (drawn with gears): the **Abstract domain α, γ** and the **Abstract semantics**. The program **P** (a file icon) enters the engine from above. The engine outputs a green region containing the yellow blob *P*: the over-approximation of the program's behaviour. On page 67 the engine box is highlighted in yellow, introducing the next topic.

**Expansion.** This is the architecture of an abstract interpreter:

- The **designer** provides, once and for all, the domain with α and γ (Slides 37-58) and a sound transformer for each statement (Slides 59-65).
- The **fixed-point engine** is generic: it takes any program and computes the abstract state at every program point by iterating the transformers until nothing changes (Slides 68-98).
- The **output** is a sound over-approximation of all executions, the green region of Slides 21-26, from which the answers are read off: if it contains no bad state, the property is proved.
- Separating the domain from the engine is what makes abstract interpretation a *framework*: changing the domain (signs, intervals, heap shapes) gives a different analysis with the same engine.

## Fixed-point computation (pages 68-98)

### Slides 68-70 · Fixed-point Computations

> - **Fixed-point computation:** Repeated symbolic execution of the program using abstract semantics until our approximation of the program reaches an equilibrium
> - **Least fixed-point:** Start with underapproximation and grow the approximation until it stops growing
> - **Assuming correctness of your abstract semantics, the least fixed point is an overapproximation of the program!**

![Lecture 7, page 70](L07_p70.webp "24% 440x354")

**Figure (pages 69-70).** The program's real behaviour *P* (yellow) inside the green over-approximation, with concentric red rings growing outward from the centre of *P* (an arrow points outward): the successive approximations, each larger than the previous one, until they stop growing.

**Expansion.**

- A program with loops can reach a program point infinitely many times, with different values each time. The analysis handles this by **iterating**: it runs the abstract transformers over the program again and again, each time merging (joining) the new information into the abstract state of each point, until a further round changes nothing. That stable state is a **fixed point**: applying one more round of analysis gives back the same state (F(X) = X).
- **Least fixed point.** Starting from the smallest possible state (⊥ everywhere, "nothing reached yet": an under-approximation) and only ever growing, the iteration stops at the *smallest* stable state, which is the most precise result that the domain and the transformers can give. (Starting from ⊤ everywhere would also be stable and sound, but useless.)
- **Why the result is sound.** Every real execution is a finite path through the program. The iteration follows every path step by step, the transformers over-approximate each step, and the joins keep the contribution of every path, so every reachable concrete state is covered: the least fixed point is an **over-approximation** of the program, provided each transformer is correct (Slides 64-65).

### Slides 71-76 · Performing Least Fixed Point Computation

> - Represent program as a **control-flow graph**
> - Want to compute abstract values at every program point
> - Initialize all abstract states to ⊥
> - Repeat until no abstract state changes at any program point:
>   - Compute abstract state on entry to a basic block B by taking the **join** of B's predecessors
>   - Symbolically execute each basic block using abstract semantics

![Lecture 7, page 71](L07_p71.webp "32% 644x988") ![Lecture 7, page 72](L07_p72.webp "32% 644x988") ![Lecture 7, page 76](L07_p76.webp "32% 644x988")

**Figure (pages 71-76).** The control-flow graph of the example program of Slides 77-78, drawn as boxes: an entry block \`x = 0; y = 1\`; a **loop head**; from it an **exit block** and, on the edge \`y <= n\`, a **branch** block; from the branch, the block \`x = x+1\` (edge \`z = 0\`) and the block \`x = x+y\` (edge \`z != 0\`); both lead to the **loop end** block \`y = y+1\`, whose back edge returns to the loop head. From page 72, small red arrows mark the **program points** where abstract states are kept (before and after each statement). Pages 75-76 add red dots with the join symbol ⊔ at the two merge points: the loop head (first entry and back edge) and the loop end (the two branches).

**Expansion.** The algorithm, step by step:

1. **Control-flow graph (CFG).** The nodes are *basic blocks* (straight-line code with one entry and one exit), the edges are the possible jumps (branches, loops). The program points are the positions before and after each statement.
2. **Initialisation.** Every program point starts at ⊥, "not reached yet".
3. **Join at merge points.** The state on entry to a block is the join (⊔, Slides 51-54) of the states at the end of all its predecessors. Here two places need it: the loop head (merging the first entry with the back edge from the loop end) and the loop end (merging the \`then\` and \`else\` branches).
4. **Transfer.** Inside a block, the abstract transformer of each statement (Slides 64-65) is applied in order.
5. **Repeat** until a whole round changes no state: that is the least fixed point (Slides 68-70). Real implementations use a *worklist* that only revisits the blocks whose input changed.

This is the same structure as the data-flow analyses inside every optimising compiler (reaching definitions, liveness, constant propagation), and it is how a static taint analysis propagates "tainted" through a program (Lecture 6, Slides 17-18).

### Slides 77-78 · An Example

![Lecture 7, page 78 (2)](L07_p78_2.webp "36% 644x986")

**Figure (pages 77-78).** On the left, the program (page 78 adds a speech bubble: ***"Is x always non-negative inside the loop?"***); on the right, its control-flow graph, the same as in Slides 71-76. The code on the slide:

\`\`\`c
x = 0;
y =0;

while(y <= n)
{
  if (z == 0) {
    x = x+1;
  }
  else {
    x = x + y;
  }
  y = y+1
}
\`\`\`

(On the slide the last statement has no semicolon, \`y = y+1;\`. Note also that the code initialises \`y = 0\`, while the control-flow graph, and the whole computation of the next slides, starts from \`y = 1\`; the answer to the question is the same in both cases, as shown below.)

**Code analysis.**

- *What the code does.* \`x\` and \`y\` start at 0 (\`y\` at 1 in the graph). The loop runs while \`y <= n\`, where \`n\` and \`z\` are inputs that are never assigned, so the analysis must consider every possible value of them. In each iteration \`x\` is incremented by 1 if \`z == 0\`, otherwise \`y\` is added to it; then \`y\` is incremented.
- *The question.* "Is \`x\` always non-negative inside the loop?" A test can only try some values of \`n\` and \`z\`; the sign analysis answers for **all** of them at once. Since \`y\` starts non-negative and only grows, and \`x\` only ever has non-negative amounts added to it, the answer is yes, and the next slides show the analysis proving it mechanically.
- *Why such questions matter for security.* Replace "\`x\` is non-negative" with "the index \`i\` stays in \`[0, len)\`" and this is exactly the reasoning a static analyser needs to prove that a \`buf[i]\` access cannot overflow (Lecture 3), or that a length passed to \`malloc\` or \`memcpy\` cannot be negative (the length bugs of Lecture 3, Slides 22-25, and the arithmetic issues of Lecture 8, Slides 30-33).

### Slides 79-94 · Fixed-Point Computation

**Figure (pages 79-94).** The control-flow graph of Slides 71-76, enlarged (page 79). From page 80, next to every program point (the red arrows) the current abstract state of \`x\` and \`y\` is written, with **Z** for zero, **P** for pos and **NN** for non-neg; on each page the values that have just been computed are highlighted in yellow. The entry block has three program points (before \`x = 0\`, between the two assignments, after \`y = 1\`); the loop head has two incoming states, from the entry (left) and from the back edge (right); the two branch blocks and the loop end each have a state before and after their statement. The pages show the computation one step at a time:

![Lecture 7, page 79](L07_p79.webp "50% 1277x1195")

*Page 79.* The control-flow graph alone, before any abstract state is written.

![Lecture 7, page 80](L07_p80.webp "50% 1277x1195")

*Page 80, initialisation.* Every program point holds \`x = ⊥, y = ⊥\`.

![Lecture 7, page 81](L07_p81.webp "50% 1277x1195")

*Page 81.* The statement \`x = 0\` is executed abstractly: after it, \`x = Z, y = ⊥\`.

![Lecture 7, page 82](L07_p82.webp "50% 1277x1195")

*Page 82.* The statement \`y = 1\`: after it, \`x = Z, y = P\`.

![Lecture 7, page 83](L07_p83.webp "50% 1277x1195")

*Page 83, first join at the loop head.* The state from the entry (\`x = Z, y = P\`) is joined (⊔) with the state on the back edge, still \`x = ⊥, y = ⊥\`: since ⊥ is the neutral element of the join, the loop head gets \`x = Z, y = P\`.

![Lecture 7, page 84](L07_p84.webp "50% 1277x1195")

*Page 84.* The loop-head state flows unchanged to the exit block, to the branch block, and to the entries of both branch statements: all get \`x = Z, y = P\`. (The conditions \`y <= n\` and \`z = 0\` / \`z != 0\` say nothing about signs, so they do not refine the state.)

![Lecture 7, page 85](L07_p85.webp "50% 1277x1195")

*Page 85.* \`x = x+1\` with \`x = Z\`: by the table of Slides 64-65, zero + pos = pos, so after it \`x = P, y = P\`.

![Lecture 7, page 86](L07_p86.webp "50% 1277x1195")

*Page 86.* \`x = x+y\` with \`x = Z, y = P\`: zero + pos = pos, so after it \`x = P, y = P\`.

![Lecture 7, page 87](L07_p87.webp "50% 1277x1195")

*Page 87, join at the loop end.* \`x = P, y = P\` ⊔ \`x = P, y = P\` = \`x = P, y = P\` on entry to the loop end.

![Lecture 7, page 88](L07_p88.webp "50% 1277x1195")

*Page 88.* \`y = y+1\` with \`y = P\`: pos + pos = pos, so after it \`x = P, y = P\`; this state travels along the back edge.

![Lecture 7, page 89](L07_p89.webp "50% 1277x1195")

*Page 89, second join at the loop head.* Entry state \`x = Z, y = P\` ⊔ back-edge state \`x = P, y = P\`: for \`x\`, zero ⊔ pos = non-neg, so the loop head now holds \`x = NN, y = P\`. The state has changed, so the iteration must go round again.

![Lecture 7, page 90](L07_p90.webp "50% 1277x1195")

*Page 90.* The new loop-head state \`x = NN, y = P\` is propagated to the exit block, the branch block and the entries of both branch statements.

![Lecture 7, page 91](L07_p91.webp "50% 1277x1195")

*Page 91.* \`x = x+1\` with \`x = NN\`: non-neg + pos = pos, so after it \`x = P, y = P\`, the same as before.

![Lecture 7, page 92](L07_p92.webp "50% 1277x1195")

*Page 92.* \`x = x+y\` with \`x = NN, y = P\`: non-neg + pos = pos, so after it \`x = P, y = P\`, the same as before.

![Lecture 7, page 93](L07_p93.webp "50% 1277x1195")

*Page 93.* At the loop end the join and \`y = y+1\` give again \`x = P, y = P\`.

![Lecture 7, page 94](L07_p94.webp "50% 1277x1195")

*Page 94.* At the loop head, \`x = Z, y = P\` ⊔ \`x = P, y = P\` = \`x = NN, y = P\`, exactly the value it already had. No state has changed in a whole round: a speech bubble announces ***"Fixed point!"***

**Expansion.** Reading the result:

- **The answer to the question.** Inside the loop \`x\` is \`NN\` (at the loop head, the branch and the entries of the two assignments) or \`P\` (after the assignments and at the loop end), never ⊤ or \`neg\`. Since the analysis is sound, this is a proof, for **every** value of \`n\` and \`z\`, that \`x\` is always non-negative inside the loop.
- **Two rounds and a check.** The first round reached the loop head with \`x = Z\`; the back edge brought \`x = P\`, and the join generalised it to \`NN\`. The second round, run with \`NN\`, produced the same back-edge state, so the third visit of the loop head changed nothing: the least fixed point was reached.
- **Precision lost on the way.** The analysis knows \`y\` is positive, but not that \`y ≥ 1\` grows by one each time, nor anything about \`n\`; it also merged the two branches at the loop end. None of this mattered for this question, but a question such as "is \`x <= 10\`?" would need a richer domain (intervals or relations between variables) and could produce false alarms with signs.
- **With the code's \`y = 0\`.** Starting from \`y = Z\`, the loop head would get \`y = Z ⊔ P = NN\` and \`x = x+y\` would give non-neg + non-neg = non-neg; the fixed point would still have \`x\` in {NN, P} inside the loop, so the answer does not change.

### Slides 95-98 · Termination of Fixed Point Computation

> - In this example, we quickly reached least fixed point - but does this computation always terminate?
>   - Yes, assuming abstract domain forms **complete lattice**
>   - This means every subset of elements (including infinite subsets) has a LUB
> - Unfortunately, many interesting domains do not have this property, so we need **widening** operators for convergence.

**Expansion.**

- **Why the sign analysis terminates.** The state of each program point can only grow, because the iteration only ever joins new information in, and in the sign lattice a value can grow at most a few times (⊥ → zero → non-neg → ⊤ is the longest chain). With finitely many program points and variables, the iteration must stop after a bounded number of rounds.
- **The precise condition.** Completeness (every subset has a lub) guarantees that the least fixed point *exists* (the Knaster-Tarski theorem); what guarantees that the iteration *reaches* it in finitely many steps is that the lattice has **no infinite strictly ascending chains** (for example, finite height). The slide merges the two conditions; a finite lattice such as the sign domain has both.
- **Infinite domains need widening.** The **interval domain**, the one needed for array bounds (Slides 27-31), has infinite ascending chains: for \`i = 0; while (...) i++;\` the iteration would produce [0, 0], [0, 1], [0, 2], ... forever. A **widening operator** (∇, also introduced by the Cousots) forces convergence by extrapolating: once a bound keeps growing it jumps straight to infinity, giving [0, +∞) after a couple of rounds. Widening loses precision (which a later *narrowing* pass can partly recover), but the result is still a sound over-approximation, now reached in finite time.

## Lessons (pages 99-105)

### Slides 99-105 · Lessons To Take Away

> - Considered only one static analysis approach, but illustrates two key ideas underlying program analysis:
>   - **Abstraction:** Only reason about certain properties of interest
>   - **Fixed-point computation:** Allows us to obtain sound overapproximation of the program
> - But many static analyses also differ in several ways:
>   - **Flow (in)sensitivity:** Some analyses only compute facts for the whole program, not for every program point
>   - **Path sensitivity:** More precise analyses compute different facts for different program paths
>   - **Analysis direction:** Forwards vs. backwards

**Expansion.**

- **The two key ideas.** *Abstraction* makes the problem finite by forgetting irrelevant detail; *fixed-point computation* handles loops and recursion by iterating to stability. Together they give analyses that are sound by construction, and therefore incomplete (Slides 14-20).
- **Flow sensitivity.** The sign analysis was *flow-sensitive*: it kept a separate state at every program point (\`x\` is Z before the loop, NN at the loop head). A *flow-insensitive* analysis keeps one fact per variable for the whole program (as many pointer analyses do: "\`p\` may point to \`a\` or \`b\`"); it is far cheaper and scales to millions of lines, but it is less precise.
- **Path sensitivity.** The sign analysis joined the two branches at the loop end, forgetting which path was taken. A *path-sensitive* analysis keeps separate facts per path (or per branch condition), which avoids false alarms such as "\`p\` may be NULL here" when the NULL case was excluded by an earlier check on the same path, at a cost that can grow exponentially with the number of branches. Symbolic execution and concolic testing (Lecture 6, Slides 30-31) are path-sensitive by nature.
- **Direction.** *Forward* analyses propagate facts from the entry along the execution (signs, taint, reaching definitions); *backward* analyses propagate them from the exit against the flow (liveness: "is this variable used later?"; or "which inputs can reach this dangerous call?").
- **Back to security.** These choices distinguish the scanners of Lecture 6: a grep-like text scanner is the extreme of imprecision (no semantics at all); a taint analysis is a forward flow analysis over a "tainted / untainted" domain; a sound bounds checker is an abstract interpreter over intervals. The theory explains both their false positives (over-approximation, Slides 21-26) and their false negatives (deliberately unsound shortcuts, Slides 14-20).
`;export{e as default};
