Lecture 12 formalises secure design: what "design" means (ISO/IEC 12207), the eight classic **Saltzer & Schroeder (1975) design principles** (the authoritative source behind Lecture 10's list), the NIST SP 800-160 principle catalog, and **threat modelling / attack modelling** (attacker-centric, design-centric, asset-centric; Microsoft STRIDE; CERT attack trees). The slide deck has 14 pages.

## What design is (pages 2-3)

### Slide 2 · What is design?

> ISO/IEC 12207:2008:
>
> - "Software architectural design. For each software item …the implementer shall transform the requirements for the software item into an architecture that describes its top-level structure and identifies the software components. It shall be ensured that all the requirements for the software item are allocated to its software components and further refined to facilitate detailed design."
> - "Software detailed design process is to provide a design for the software that implements and can be verified against the requirements…"
>
> In short:
>
> - Determine components (e.g., classes, programming languages, frameworks, database systems, etc.) that you'll use, and how you'll use them (interconnections/APIs), to solve the problem

![Lecture 12, page 2](L12_p02.webp "27% 488x304")

**Figure.** A small data-flow-diagram icon (two rounded nodes and a box on one side of a vertical line, an external entity on the other) suggesting a system decomposed into components across a boundary.

**Expansion.** **Design** is the phase between requirements and implementation where the system's structure is decided. ISO/IEC 12207 (the software life-cycle standard) splits it into **architectural design** (top-level structure: what the major components are, and ensuring every requirement is allocated to some component) and **detailed design** (refining each component enough to implement and *verify* it against requirements). In plain terms (the slide's "in short"): **choose the components** (classes, languages, frameworks, databases) and **how they interconnect** (APIs, data flows) to solve the problem. Design matters for security because **design flaws are about half of all vulnerabilities** (Lecture 1, Slide 38) and are far cheaper to fix here than after release (shift left, Lecture 1, Slide 43), so security must be built into the architecture, not bolted on later.

### Slide 3 · Developing secure software is not new or unknown

> - Saltzer & Schroeder principles, and many specifics, publicly known since at least 1970s
> - Problem is that most software developers do not know how to do it - Attackers, of course, know this
> - Knowing various principles and rules-of-thumb ahead-of-time can avoid many problems later

**Expansion.** An important reframing: secure design is **not a new or secret art**. The foundational principles were published by **Jerome Saltzer and Michael Schroeder in 1975** ("The Protection of Information in Computer Systems"), and the specific vulnerability patterns have been documented for decades. The real problem is a **knowledge gap**: most developers were never taught these principles (Lecture 1's "lack of awareness and knowledge"), while **attackers know them well**, an asymmetry the attacker exploits. The remedy is exactly this course: learning the principles and rules of thumb *before* writing code avoids a large fraction of vulnerabilities, which is far cheaper than finding and patching them later.

## Saltzer & Schroeder design principles (pages 4-7)

### Slide 4 · Saltzer and Schroeder design principles (1)

> - **Least privilege** - Each user and program should operate using fewest privileges possible - Limits the damage from an accident, error, or attack - Reduces number of potential interactions among privileged programs (Unintentional, unwanted, or improper uses of privilege less likely) - Extend to the internals of a program: only smallest portion of program which needs those privileges should have them
> - **Economy of mechanism/Simplicity** - Protection system's design should be simple and small as possible - "techniques such as line-by-line inspection of software and physical examination of hardware that implements protection mechanisms are necessary. For such techniques to be successful, a small and simple design is essential." - Aka "KISS" principle ("keep it simple, stupid")

**Expansion.** The first two of the eight principles (all previewed in Lecture 10):

- **Least privilege**: every user and program runs with the **fewest privileges needed**, which limits the damage from any error or attack and reduces dangerous interactions between privileged programs. Crucially, it extends **inside** a program: only the smallest part that truly needs a privilege should hold it (privilege separation; Lecture 10, Slides 15-19).
- **Economy of mechanism / simplicity (KISS)**: the protection mechanism must be **as small and simple as possible**, because security can only be *verified* (by line-by-line review, by inspection) if it is simple enough to understand fully. **Complexity is the enemy of security**, every extra feature is more code to get wrong and more attack surface. This underlies "minimise the TCB" (Lecture 10, Slide 51) and the KISS vs least-privilege tension (Lecture 10, Slide 21).

### Slide 5 · Saltzer and Schroeder design principles (2): Open design

> - **Open design** - The protection mechanism must not depend on attacker ignorance - Instead, the mechanism should be public (Depend on secrecy of relatively few (and easily changeable) items like passwords or private keys) - An open design makes extensive public scrutiny possible - Makes it possible for users to convince themselves system is adequate - Not realistic to maintain secrecy for distributed system (Decompilers/subverted hardware quickly expose implementation "secrets"; Even if you pretend that source code is necessary to find exploits (it isn't), source code has often been stolen and redistributed; This is one of the oldest and strongly supported principles, based on many years in cryptography)
>   - Kerckhoffs's Law: "A cryptosystem should be designed to be secure if everything is known about it except the key information"
>   - Claude Shannon restated Kerckhoff's Law as: "\[Assume\] the enemy knows the system"

**Expansion.** **Open design**: security must **not depend on the secrecy of the design** (no security by obscurity, Lecture 10, Slide 44). The mechanism should be **public**, with secrecy confined to a **few, easily changeable items**, the keys and passwords. The advantages of openness: it enables **public scrutiny** (many reviewers find flaws, "many eyes"), and it lets users *verify* the system is adequate rather than trusting a black box. The justifications: you cannot keep a distributed system's internals secret anyway (decompilers, reverse engineering, stolen source), and, decisively, **source code is not needed to find exploits** (binary analysis and fuzzing suffice). This is the oldest, strongest principle, grounded in a century of cryptography:

- **Kerckhoffs's Law (1883)**: a cryptosystem must stay secure even if everything about it is known *except the key*.
- **Claude Shannon's restatement**: *"the enemy knows the system."* Design as if the attacker has your full design and source, and rely only on the secret key.

This is why real cryptographic standards (AES, TLS) are fully public and have withstood decades of open attack, the opposite of a secret proprietary cipher.

### Slide 6 · Saltzer and Schroeder design principles (3): mediation, defaults, separation

> - **Complete mediation ("non-bypassable")** - Every access attempt must be checked; position the mechanism so it cannot be subverted. For example, in a client-server model, generally the server must do all access checking because users can build or modify their own clients
> - **Fail-safe defaults (e.g., permission-based approach)** - The default should be denial of service, and the protection scheme should then identify conditions under which access is permitted - More generally, installation should be secure by default
> - **Separation of privilege** - Ideally, access to objects should depend on more than one condition, so that defeating one protection system won't enable complete access

**Expansion.** Three more principles:

- **Complete mediation (non-bypassable)**: **every** access to every object must be checked, with **no way around** the check, and the check must be positioned where it cannot be subverted. The slide's key example: in a **client-server** system, **all access control must be enforced on the server**, because the attacker **controls the client** (they can modify or rewrite it, Lecture 10 "don't trust the client"). Never rely on a client-side check (the JavaScript-password failure of Lecture 10, Slide 44). This is implemented by a *reference monitor* that is always invoked, tamper-proof and small enough to verify (Lecture 1, Slide 54).
- **Fail-safe defaults**: **default to deny** (no access), then explicitly list the conditions that grant access, a **white-list / permission-based** scheme. More broadly, ship **secure by default** (Lecture 10, Slides 31, 40). This also means failing closed on error (Lecture 10, Slide 32).
- **Separation of privilege**: require **more than one condition** to grant access (two keys, multi-factor authentication, two-person control), so that compromising a *single* protection does not give complete access. This is defence in depth for authorisation; MFA is its everyday form.

### Slide 7 · Saltzer and Schroeder design principles (3 cont.): least common mechanism, psychological acceptability

> - **Least common mechanism** - Minimize the amount and use of shared mechanisms (e.g. use of the /tmp or /var/tmp directories) - Shared objects provide potentially dangerous channels for information flow and unintended interactions
> - **Psychological acceptability / Easy to use** - The human interface must be designed for ease of use so users will routinely and automatically use the protection mechanisms correctly - Mistakes will be reduced if the security mechanisms closely match the user's mental image of his or her protection goals

**Expansion.** The last two principles:

- **Least common mechanism**: **minimise shared mechanisms and shared state** between users/components. Anything shared (a `/tmp` directory, a global variable, a shared library instance, a common cache) is a potential **channel** for unintended information flow or interference between users, exactly the race-condition and `/tmp` symlink problems of Lecture 11, Slides 18, 24, and a source of **covert channels** and side channels. Prefer per-user/per-component resources (this is the design rationale for compartmentalization, Lecture 10, Slide 20).
- **Psychological acceptability** (ease of use): the security mechanism must be **usable**, so that users apply it **correctly and automatically**, and it should **match the user's mental model** of what they are protecting. If security is hard or confusing, users make mistakes or bypass it (Lecture 10, Slide 47). Usability *is* security.

### Slide 8 · Design principles... (applicability)

> - Any design must also consider other requirements and specific circumstances
> - Not all details apply to all systems - Web apps ≠ Local apps ≠ GUI ≠ setuid programs - But better to know the larger set of issues

**Expansion.** A caveat on applying the principles: they are **general heuristics, not a mechanical checklist**, and must be **weighed against other requirements** (performance, cost, usability) and the **specific context**. Different kinds of system face different threats, a **web app** (remote, untrusted network input), a **local app**, a **GUI**, a **setuid program** (local privilege boundary, the mkdir/race issues of Lecture 11) each emphasise different principles. But, the slide stresses, it is **better to know the whole set** and consciously decide which apply, than to be unaware of a class of issue. (This is the "know your stack / know the threats for your kind of application" point of Lectures 5-6.)

### Slide 9 · NIST SP 800-160 volume 1 Appendix F (design principles)

![Lecture 12, page 9](L12_p09.webp "50% 1400x931")

**Figure.** A three-part table listing NIST's catalog of security design principles:

- **Security Architecture and Design**: Clear Abstractions, Least Common Mechanism, Modularity and Layering, Partially Ordered Dependencies, Efficiently Mediated Access, Minimized Sharing, Reduced Complexity, Secure Evolvability, Trusted Components, Hierarchical Trust, Inverse Modification Threshold, Hierarchical Protection, Minimized Security Elements, Least Privilege, Predicate Permission, Self-Reliant Trustworthiness, Secure Distributed Composition, Trusted Communication Channels.
- **Security Capability and Intrinsic Behaviors**: Continuous Protection, Secure Metadata Management, Self-Analysis, Accountability and Traceability, Secure Defaults, Secure Failure and Recovery, Economic Security, Performance Security, Human Factored Security, Acceptable Security.
- **Life Cycle Security**: Repeatable and Documented Procedures, Procedural Rigor, Secure System Modification, Sufficient Documentation.

**Expansion.** **NIST SP 800-160** ("Systems Security Engineering") Appendix F expands Saltzer & Schroeder's eight principles into a modern, comprehensive catalog of about 30, organised into three groups: *architecture and design* (how to structure the system, note the Saltzer-Schroeder principles reappear here, least privilege, least common mechanism, reduced complexity = economy of mechanism, etc.), *capability and intrinsic behaviors* (properties the system should exhibit, continuous protection, secure defaults, secure failure and recovery = fail securely, human-factored = psychological acceptability), and *life-cycle security* (process: documented, rigorous, well-documented procedures). The point for students: the classic eight principles are the core, and standards like NIST SP 800-160 and the companion OWASP/ISO guidance refine and extend them into an engineering checklist for building secure systems.

## Threat and attack modelling (pages 10-14)

### Slide 10 · Analysis approaches

> - **Attacker-centric** - Starts with an attacker - Evaluates their goals and how they might achieve them (e.g., via entry points) - Used in CERT attack modeling approach
> - **Design-centric** - Starts with the design of the system: steps through system model, looking for types of attacks against each element - Used in threat modeling in Microsoft's Security Development Lifecycle
> - **Asset-centric** - Starts from key assets entrusted to a system

**Expansion.** **Threat modelling** is the structured activity of finding, during design, how a system could be attacked, so the attacks can be mitigated *before* an attacker tries them. There are three complementary **starting points**:

- **Attacker-centric**: start from the **attacker**, their goals, capabilities and entry points, and reason how they would achieve those goals (used in CERT attack trees, Slide 12). It mirrors "think like an attacker" (Lecture 1, Slide 32).
- **Design-centric**: start from the **system's design/architecture**, walk through each component and data flow, and ask what attacks apply to each (used in Microsoft's SDL with STRIDE, Slide 11).
- **Asset-centric**: start from the **valuable assets** the system protects (data, functionality) and reason about threats to each (the "inventory of assets" of Lecture 1, Slide 49).

In practice the three are combined: identify assets, model the design, and enumerate attacks. All answer the question "what can go wrong?" systematically rather than ad hoc.

### Slide 11 · Microsoft STRIDE Approach

> - Decompose system into relevant (design) components - Uses simple data flow diagrams, identify trust boundary
> - Analyze each component for susceptibility to threats
> - Mitigate the threats
> - Now part of the Microsoft SDL with the Threat Modeling Tool

![Lecture 12, page 11](L12_p11.webp "50% 1101x623")

**Figure.** The STRIDE table mapping each threat category to the security property it violates:

| "STRIDE" Threat | Security Property (violated) |
| --- | --- |
| **S**poofing | Authentication |
| **T**ampering | Integrity |
| **R**epudiation | Non-repudiation |
| **I**nformation disclosure | Confidentiality |
| **D**enial of service | Availability |
| **E**levation of privilege | Authorization |

**Expansion.** **STRIDE** is Microsoft's **design-centric** threat-modelling method (part of the SDL, with a free Threat Modeling Tool), already introduced in Lecture 1 (Slide 56). The process:

1. **Decompose** the system into components using a **data-flow diagram** (processes, data stores, data flows, external entities), and mark the **trust boundaries**, the lines where data crosses from a less-trusted zone to a more-trusted one (e.g., network → server, user → application). Trust boundaries are where threats concentrate, because that is where untrusted input enters.
2. **Analyse each element** against the six STRIDE threat categories, asking for each: can it be **S**poofed, **T**ampered with, **R**epudiated, suffer **I**nformation disclosure, **D**enial of service, or **E**levation of privilege?
3. **Mitigate** each identified threat with the countermeasure for the violated property (authentication against spoofing, integrity checks against tampering, logging/signatures against repudiation, encryption/access-control against disclosure, redundancy/rate-limiting against DoS, authorisation against elevation).

The elegance is the **one-to-one mapping**: each STRIDE threat is the violation of exactly one CIA-plus property (the table), so naming the threat immediately suggests the defence. STRIDE makes threat enumeration systematic and complete rather than relying on the analyst to think of everything.

### Slide 12 · CERT Attack Modeling (attack trees)

> - Create simple design overview
> - Develop "attack trees" - top is attacker's objective, decompose down into conditions that achieve that (with AND or OR)
> - Devise methods to counterattack (build on attack patterns)
> - E.G., Buffer Overflow Attack Pattern:
>   - Goal: Exploit buffer overflow vulnerability to perform malicious function on target system
>   - Precondition: Attacker can execute certain programs on target system
>   - Attack: AND: 1. Identify executable program on target system susceptible to buffer overflow vulnerability; 2. Identify code that will perform malicious function when it executes with program's privilege; 3. Construct input value that will force code to be in program's address space; 4. Execute program in a way that makes it jump to address at which code resides
>   - Postcondition: Target system performs malicious function

**Expansion.** **Attack trees** are the **attacker-centric** technique (CERT). An attack tree is a tree whose **root is the attacker's goal**, decomposed downward into the sub-conditions needed to achieve it, combined with **AND** nodes (all children required) and **OR** nodes (any child suffices). Leaves are concrete attacker actions. The tree systematically enumerates the ways to reach the goal, so defenders can **devise countermeasures** for each path, ideally by cutting an **AND** branch (break one required step and the whole path fails) or covering every **OR** alternative. Reusable sub-trees are captured as **attack patterns**.

The slide's worked **buffer-overflow attack pattern** formalises the Lecture-3 exploit as a pattern with a *precondition* (the attacker can run programs on the target), an **AND** of four required steps (find a vulnerable program; prepare malicious code to run with that program's privilege; get that code into the program's address space via a crafted input; make the program jump to it), and a *postcondition* (the target performs the malicious function). Because the four steps are ANDed, breaking **any one** defeats the attack, which is exactly what the Lecture-3/8 defences do: NX stops step 3-4 (injected code cannot execute), ASLR breaks step 4 (the address is unknown), stack canaries detect the overflow that enables step 3-4, and fixing the bug removes the vulnerable program of step 1. Attack trees make visible *where* to place each defence.

### Slide 13 · CERT Attack Modeling (an example attack tree)

![Lecture 12, page 13](L12_p13.webp "50% 1400x538")

**Figure.** An example attack tree with the attacker's goal at the top and AND/OR decomposition below:

- **Root (attacker's goal):** *Read confidential data* - combined with **OR**, so either subtree below suffices.
  - **Access data using an account** - combined with **AND** (both children required):
    - *Obtain a valid password* - combined with **OR**: *Successful phishing* OR *Use a previously compromised password*.
    - *Pass the MFA check*.
  - **Read an exposed backup** - combined with **AND** (both children required):
    - *Locate a backup accessible without login*.
    - *Have the backup in unencrypted form*.

**Expansion.** This diagram shows how an attack tree reads. The goal *"read confidential data"* can be reached **two ways (OR)**: through a user account, or through an exposed backup. The account path is an **AND**, requiring *both* a valid password *and* passing MFA, and obtaining the password is itself an **OR** (phishing or a reused/leaked password). The backup path is an **AND** needing a backup that is both reachable without login *and* unencrypted.

The defensive reading is the point: to block a path, **break one node of each AND**. The account path collapses if MFA cannot be bypassed (so MFA is a high-value control, it covers the whole left subtree); it is also weakened by anti-phishing training and blocking breached passwords (covering the OR leaves). The backup path collapses if backups are **encrypted** *or* if they are **not reachable without authentication** (breaking either AND child suffices). So the tree directly tells the designer the cheapest effective mitigations: encrypt backups and restrict their access; enforce MFA and good password hygiene. This is exactly the "think like an attacker, then counter each path" method, applied concretely.

### Slide 14 · Conclusions

> - There are various key design principles - E.G., Saltzer and Schroeder
> - Need to design program to counterattack, e.g.: - Minimize privileges - Counter TOCTOU issues
> - Use attack/threat modeling to look for potentially-successful attacks - Before the attacker tries them
> - Many design approaches for self-protection
> - Consider principles and rules-of-thumb in design

**Expansion.** The lecture's takeaways: (1) there is a well-established body of **design principles** (Saltzer & Schroeder, NIST SP 800-160) to apply; (2) the program must be **designed to defend itself**, concretely minimising privileges (least privilege) and countering **TOCTOU/race** issues (Lecture 11), among others; (3) **threat/attack modelling** (STRIDE, attack trees) should be used proactively to find viable attacks **before the attacker does**, during design, when fixes are cheapest; (4) there are many design patterns for self-protection; and (5) the overarching message, **consciously consider the principles and rules of thumb while designing**, rather than discovering the need for them after a breach. Secure design is the "shift left" culmination of the course: prevent whole classes of the vulnerabilities studied earlier by building security into the architecture from the start.
