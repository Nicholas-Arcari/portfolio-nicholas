const e=`Lecture 15 presents Gary McGraw's approach to software security, from his book *Software Security: Building Security In* (2006), whose title the lecture borrows: why software is at the root of most security problems (the CERT/CC numbers and the "trinity of trouble": connectivity, extensibility, complexity), the difference between bugs and flaws, and the **three pillars** of software security: **applied risk management** (the five-stage **Risk Management Framework**), the seven **software security touchpoints** (code review, architectural risk analysis, penetration testing, risk-based security testing, abuse cases, security requirements, security operations) and **knowledge**. The second half details the main touchpoints: code review with static analysis tools and the taxonomy of coding errors, architectural risk analysis (attack resistance, ambiguity and weakness analysis), penetration testing, risk-based security testing and abuse cases. The slide deck has 44 pages.

## Software security and its problems (pages 1-6)

### Slide 1 · Title slide

> **Security in Software Applications**
>
> Building Security IN

### Slide 2 · Software Security

> - Renewed interest
>   - "idea of engineering software so that it continues to function correctly under malicious attack"
>   - Existing software is riddled with design flaws and implementation bugs
>   - "any program, no matter how innocuous it seems, can harbor security holes"

**Expansion.** The two quotations are Gary McGraw's (the first is the working definition already met in Lecture 1, Slide 5): **software security** means engineering software that keeps working correctly *while under attack*, which is more than working correctly in normal use. The "renewed interest" came in the early 2000s, when worms and mass exploitation (Code Red, Slammer, Blaster; Lecture 1) showed that network defences cannot make up for vulnerable software. The other two bullets explain why the problem is everywhere: existing software contains both **design flaws** and **implementation bugs** (the distinction of Slide 6), and *any* program, even an apparently harmless one, can contain a hole that an attacker can use, for example as a stepping stone towards more valuable targets.

### Slide 3 · Software Problem

> \\# vulnerabilities Reported by CERT/CC
>
> - More than half of the vulnerabilities are due to buffer overruns
> - Others such as race conditions, design flaws are equally prevalent

![Lecture 15, page 3](L15_p03.webp "50% 974x623")

**Figure.** A bar chart, "**Software Vulnerabilities**", with the number of vulnerabilities reported to CERT/CC per year (vertical axis from 0 to 4500), from **1995** to **2004**: under 500 a year until 1999, then a steep rise to about 1,100 in 2000 and about 2,400 in 2001, a peak of about 4,100 in 2002, and about 3,800 in both 2003 and 2004. The red caption next to the chart reads "# vulnerabilities Reported by CERT/CC".

**Expansion.** **CERT/CC** (the CERT Coordination Center at Carnegie Mellon University, created after the Morris worm of 1988) collected vulnerability reports from vendors and researchers. The chart shows the number of reported software vulnerabilities growing about tenfold in a few years, as more software was networked and more people looked for flaws; today the CVE system publishes tens of thousands of vulnerabilities every year. The bullets give the composition at the time: **buffer overruns** were the largest single class (Lectures 3 and 8), and other classes, such as race conditions (Lecture 11) and design flaws, were just as widespread. The lesson is not the exact percentage but that a few recurring classes of mistakes produce most vulnerabilities, so learning them pays off.

### Slide 4 · Software Security

> - It is about
>   - Understanding software-induced security risks and how to manage them
>   - Leveraging software engineering practice,
>   - thinking security early in the software lifecycle
>   - Knowing and understanding common problems
>   - Designing for security
>   - Subjecting all software artifacts to thorough objective risk analyses and testing
> - It is a knowledge intensive field

**Expansion.** What software security involves, in McGraw's terms: (1) understanding the **risks** that software introduces and **managing** them (Pillar I, Slides 16-22); (2) using ordinary **software engineering practice** and thinking about security **early** in the life cycle, not at the end (the shift left of Lecture 1, Slide 43, and of Lecture 13); (3) **knowing the common problems** (buffer overflows, injections, races: most of this course; Pillar III, Slide 14); (4) **designing for security** (Lectures 10 and 12); and (5) submitting **every artifact**, not just the code but also requirements, designs and test plans, to objective **risk analysis and testing** (the touchpoints, Slides 9-11). The last bullet sums it up: it is a **knowledge-intensive** field, in which what you know about attacks and defences matters more than any single tool.

### Slide 5 · Trinity of trouble

> - Three trends
>   - Connectivity
>     - Inter networked
>     - Include SCADA (supervisory control and data acquisition systems)
>     - Automated attacks, botnets
>   - Extensibility
>     - Mobile code - functionality evolves incrementally
>     - Web/OS Extensibility
>   - Complexity
>     - XP is at least 40 M lines of code
>     - Add to that use of unsafe languages (C/C++)
>
> Bigger problem today .. And growing

![Lecture 15, page 5](L15_p05.webp "49% 875x640")

**Figure.** A line chart, "**Windows Complexity**", with the size of successive Windows versions in **millions of lines** of code: about 3 for Win 3.1 (1990), about 4 for Win NT (1996), about 15 for Win 95 (1997), about 16 for NT 4.0 (1998), about 18 for Win 98 (1999), about 20 for NT 5.0/2K beta (2000), about 35 for Win 2K (2001) and about 40 for XP (2001).

**Expansion.** McGraw's **trinity of trouble**, the three trends that make software security harder every year:

- **Connectivity**: almost every system is networked, so a flaw can be reached remotely and exploited by automated attacks on a large scale (worms, **botnets**). This now includes **SCADA** systems, the industrial control systems of power grids, water plants and factories, designed for isolated networks and now reachable from the Internet (Stuxnet, Lecture 1).
- **Extensibility**: systems are designed to be extended after deployment, with plug-ins, browser extensions, scripts, updates and **mobile code** (code downloaded and run on the fly, such as JavaScript or the Java applets of the time), so the functionality, and with it the attack surface, keeps changing in ways the original designers never analysed.
- **Complexity**: more code means more bugs. The chart shows Windows growing from about 3 to about 40 million lines in a decade; with a roughly constant number of defects per thousand lines, the number of vulnerabilities grows with size, and **unsafe languages** like C and C++ (no bounds checking, manual memory management; Lectures 3 and 8) make many of these defects exploitable.

"Bigger problem today .. And growing": the three trends have only accelerated since (cloud, IoT, software supply chains with thousands of dependencies).

### Slide 6 · Security problems in software

> - **Defect**
>   - implementation and design vulnerabilities
>   - Can remain dormant
> - **Bug**
>   - An implementation level software problem
> - **Flaw**
>   - A problem at a deeper level
> - **Bugs + Flaws**
>   - leads to Risk

![Lecture 15, page 6](L15_p06_1.webp "50% 913x544")

![Lecture 15, page 6 (2)](L15_p06_2.webp "50% 1024x535")

**Figure.** Two pictures on the right of the slide. Above, a bar chart, "**Security Problems (CERT)**", from **1988** to **1999**, with dark bars for **CERT alerts** and light bars for **Buffer overflows**: the alerts go from 1-7 a year in 1988-1990 to between about 11 and 28 a year afterwards (peaks of about 27-28 in 1996-1997), and the buffer overflows grow to about half of the alerts in 1997-1999 (about 15 of 28 in 1997). Below, a two-column table of examples:

- **Bug**: Buffer overflow: stack smashing; Buffer overflow: one-stage attacks; Buffer overflow: string format attacks; Race conditions: TOCTOU; Unsafe environment variables; Unsafe system calls (\`fork()\`, \`exec()\`, \`system()\`); Incorrect input validation (black list vs. white list).
- **Flaw**: Method over-riding problems (subclass issues); Compartmentalization problems in design; Privileged block protection failure (\`DoPrivilege()\`); Error-handling problems (fails open); Type safety confusion error; Insecure audit log design; Broken or illogical access control (role-based access control [RBAC] over tiers); Signing too much code.

**Expansion.** The vocabulary of the lecture (McGraw's, consistent with Lecture 1, Slides 37-38):

- A **defect** is any problem in the software, at the implementation or at the design level; it may stay **dormant** for years, until someone finds a way to trigger and exploit it.
- A **bug** is an **implementation-level** defect: a mistake in a few lines of code, such as a missing bounds check (buffer overflow), user input used as a format string, a TOCTOU race. Bugs are relatively easy to find with code review and static analysis tools (Slides 25-31).
- A **flaw** is a defect **at a deeper level**, in the design: it is there even if every line is coded perfectly, for example missing compartmentalisation, access control enforced on the wrong tier, error handling that fails open (Lecture 10, Slide 32), an audit log that an attacker can tamper with. Flaws cannot be found by looking at code; they need architectural risk analysis (Slides 32-37).
- **Bugs and flaws together** produce **risk**, which is what has to be managed (Slides 16-22).

The table gives typical examples of each class; McGraw estimates that bugs and flaws are roughly **50/50** (Lecture 1, Slide 38; Lecture 2, Slide 19). The chart repeats the message of Slide 3: in the CERT alerts of the late 1990s, buffer overflows alone accounted for about half.

## The three pillars of software security (pages 7-15)

### Slide 7 · Three pillars in Software Security

> Pillar I: Applied Risk management
>
> Pillar II: Software Security Touchpoints
>
> Pillar III: Knowledge

**Expansion.** McGraw's framework rests on three **pillars**, which must all be present:

1. **Applied risk management** (Slides 8 and 16-22): security work is driven by the risks that matter to the business, identified and tracked throughout the project.
2. **Software security touchpoints** (Slides 9-13 and 23-44): a small set of best practices applied to the artifacts that every development process produces.
3. **Knowledge** (Slides 14-15): the catalogued experience (principles, rules, vulnerabilities, attack patterns, ...) that the people applying the touchpoints need.

Risk management decides *where* to spend the effort, the touchpoints are *what* to do, and knowledge is what makes the people doing it effective.

### Slide 8 · Three pillars in Software Security

> Pillar I: Applied Risk management
>
> - Architectural risk analysis
>   - Sometimes called threat modeling or security design analysis
>   - Is a best practice and is a touchpoint
> - Risk management framework
>   - Considers risk analysis and mitigation as a full life cycle activity

**Expansion.** Risk management works at two scales. **Architectural risk analysis** is a single activity applied to the design (the threat modelling of Lecture 12, Slides 10-13), and it is also one of the touchpoints (Slides 32-37). The **Risk Management Framework (RMF)** is the overall process in which every risk analysis takes place: risks are identified, ranked, mitigated and tracked **for the whole life cycle**, not analysed once and forgotten (Slides 16-22).

### Slide 9 · Three pillars in Software Security

> Pillar II: Software Security Touchpoints
>
> - "Software security is not security software"
>   - Software security
>     - is system-wide issues (security mechanisms and design security)
>     - Emergent property
> - *Touchpoints* in order of effectiveness (based on experience)
>   - Code review (bugs)
>   - Architectural Risk Analysis (flaws)
>     - first two can be swapped
>   - Penetration testing
>   - Risk-based security tests
>   - Abuse cases
>   - Security requirements
>   - Security operations

**Expansion.** Two ideas:

- **"Software security is not security software"**: adding security features (cryptography, authentication, a firewall) does not make a program secure (Lecture 2, Slide 24). Security is a **system-wide** issue, involving both the security *mechanisms* and the *design* of everything else, and an **emergent property**: like reliability, it is a property of the whole system, which results from how all its parts are built and interact, and it cannot be bolted onto one component. A program full of security features can still be broken through a buffer overflow in its logging code.
- **The touchpoints**, in McGraw's order of effectiveness: **code review** (finds bugs) and **architectural risk analysis** (finds flaws) come first, and since bugs and flaws are about equally common, either of the two can come first; then **penetration testing**, **risk-based security tests**, **abuse cases**, **security requirements** and **security operations**. Each is detailed in the rest of the lecture; they were introduced in Lecture 1, Slide 45.

### Slide 10 · Three pillars in Software Security

> Pillar II: (contd.)
>
> - Many organization
>   - Penetration first
>     - a reactive approach
> - CR and ARA can be switched; skipping one solves only half of the problem
> - Big organization may adopt these touchpoints simultaneously

**Expansion.** Many organisations start from **penetration testing**, because it is easy to buy and gives quick, concrete results; but it is **reactive**: it finds problems at the end, when they are expensive to fix (Slide 24), and only a sample of them (Slide 38). **Code review (CR)** and **architectural risk analysis (ARA)** are the core: since bugs and flaws are each about half of the problems, doing only one of them **leaves half of the problem untouched**. Large organisations with enough people can adopt all the touchpoints at once; smaller ones should introduce them in order of effectiveness.

### Slide 11 · Three pillars in Software Security

> Software security best practices applied to various software artifacts

![Lecture 15, page 11](L15_p11.webp "50% 1340x760")

**Figure.** The touchpoint diagram (the same as in Lecture 1, Slide 45, and on Slide 23 below, without the numbers). Six 3-D boxes in a row are the software artifacts: **REQUIREMENTS AND USE CASES**, **ARCHITECTURE AND DESIGN**, **TEST PLANS**, **CODE**, **TESTS AND TEST RESULTS**, **FEEDBACK FROM THE FIELD**. Black arrows from the labels above apply the best practices to them: **ABUSE CASES** and **SECURITY REQUIREMENTS** to the requirements and use cases; **RISK ANALYSIS** (two arrows) to the requirements and to the architecture and design, with **EXTERNAL REVIEW** written above the architecture and design; **RISK-BASED SECURITY TESTS** to the test plans; **CODE REVIEW (TOOLS)** to the code; **RISK ANALYSIS** again to the tests and test results; **PENETRATION TESTING** (two arrows) to the tests and test results and to the feedback from the field; **SECURITY OPERATIONS** to the feedback from the field. A large gray circular arrow runs around the whole row.

**Expansion.** The key design choice of the touchpoints: they are attached to **artifacts**, not to the phases of a particular process. Every development process, waterfall, spiral or agile, produces requirements, a design, test plans, code, test results and feedback from operations, so the touchpoints can be adopted without changing the process (Slide 13). The circular arrow means that the artifacts are revisited iteratively: feedback from the field feeds new requirements.

### Slide 12 · Three pillars in Software Security

> Microsoft's Move

![Lecture 15, page 12](L15_p12.webp "50% 1369x973")

**Figure.** Two pictures linked by a downward arrow. **Above**, the timeline of a product's development, **Concept → Designs Complete → Test Plans Complete → Code Complete → Ship → Post Ship**, with security activities attached: "Secure questions during interviews" and "Team member training" at the concept stage; "Threat analysis" before the designs are complete; "Security review" at designs complete; "Data mutation and least priv tests" at test plans complete; "External review" after it; "Review old defects, Check-ins checked, Secure coding guidelines, Use tools" during coding; "Security push/audit" between code complete and ship; "Learn and refine" after shipping. A circular-arrow symbol marks the activities that are "on-going" (all of them except the security review, the data mutation tests and the external review). **Below**, the Microsoft SDL bar of Lecture 13, Slide 26: **Security Training** across the first phases; Security Kickoff & Register with SWI; Security Design Best Practices; Security Architecture & Attack Surface Review; Threat Modeling; Use Security Development Tools & Security Best Dev & Test Practices; Create Security Documentation & Tools for Product; Prepare Security Response Plan; Security Push; Pen Testing; Final Security Review; Security Servicing & Response Execution; over the phases Requirements, Design, Implementation, Verification, Release, Support & Servicing.

**Expansion.** The touchpoints are not just theory: the slide shows how Microsoft moved security into its own development process (the SDL of Lecture 13, Slides 17-28). The upper picture is the early version, with security activities attached to the milestones of the existing process (threat analysis during design, reviews and secure coding guidelines during coding, the security push before shipping, learning after shipping); the lower one is the mature SDL with SD³+C. Many SDL activities correspond to touchpoints: threat modelling and attack surface review are architectural risk analysis, security development tools are code review with tools, pen testing is penetration testing, the final security review is an external review, and security servicing is security operations.

### Slide 13 · Three pillars in Software Security

> Pillar II: (contd.)

![Lecture 15, page 13](L15_p13.webp "50% 1389x881")

**Figure.** A red banner, "**Apply Security Touchpoints (Process-Agnostic)**", with five arrows pointing down into a cycle of four large yellow arrows labelled **iCMM**, **CMMI**, **XP** and **RUP** (a label "**Process models**" points at the cycle). Inside the cycle, a red disc, "**Software Security**", branches into two blue boxes, "**System-wide Issue**" and "**Emergent Property**"; below them: "*account for* **Security Mechanisms**, **Design for Security**".

**Expansion.** The touchpoints are **process-agnostic**: they can be applied on top of any process model, whether a maturity model such as CMMI or iCMM (Lecture 14), an agile method such as **XP** (Extreme Programming) or the **RUP** (Rational Unified Process, an iterative, use-case-driven process). Whatever the process, software security remains what Slide 9 said, a system-wide issue and an emergent property, and it has to account for both the **security mechanisms** and the **design for security** of the whole system.

### Slide 14 · Three pillars in Software Security

> Pillar III: Knowledge
>
> - Involves
>   - Gathering, encapsulating, and sharing security knowledge
> - Software security knowledge catalogs
>   - Principles
>   - Guidelines
>   - Rules
>   - Vulnerabilities
>   - Exploits
>   - Attack patterns
>   - Historical risks
>
> Can be put into three categories
>
> Prescriptive knowledge
>
> Diagnostic knowledge
>
> Historical knowledge

**Figure.** The last four lines are in a red-shaded box on the right of the slide, with two arrows pointing from the box to the list of catalogs.

**Expansion.** Security knowledge must be **gathered** (from experience, attacks, research), **encapsulated** in a reusable form and **shared**, so that each developer does not have to rediscover it. McGraw's seven **knowledge catalogs** fall into three categories:

- **Prescriptive knowledge**, what to do: **principles** (high-level design maxims such as least privilege; Lectures 10 and 12), **guidelines** (recommended practices, often tied to a language or a platform) and **rules** (concrete, checkable coding rules such as "do not use \`gets()\`", the kind a static analysis tool enforces).
- **Diagnostic knowledge**, how to recognise problems: **vulnerabilities** (descriptions of real flaws, as in CVE), **exploits** (how they are used in practice) and **attack patterns** (generic descriptions of attack techniques, as in MITRE's CAPEC catalog).
- **Historical knowledge**: **historical risks**, the record of the risks identified in real projects and of how they turned out.

### Slide 15 · Three pillars in Software Security

> Pillar III: Knowledge catalogs to s/w artifacts

![Lecture 15, page 15](L15_p15.webp "50% 1397x807")

**Figure.** The touchpoint diagram of Slide 11 with seven clouds above it, one per knowledge catalog: **Principles**, **Guidelines**, **Historical Risks**, **Attack Patterns**, **Rules**, **Vulnerabilities**, **Exploits**. Many thin gray arrows run from each cloud down to the touchpoints and the artifacts, showing which knowledge feeds which touchpoint.

**Expansion.** Each touchpoint needs specific knowledge. For example, **rules** feed code review (they are what static analysis tools check), **principles and guidelines** feed security requirements and architectural risk analysis, **attack patterns** feed abuse cases, risk-based security tests and penetration testing, **vulnerabilities and exploits** feed penetration testing and security operations, and **historical risks** feed risk analysis. Knowledge is what turns a touchpoint from a ritual into an effective check: a code reviewer who does not know format string attacks will not see them (Lecture 6, Slides 37-38: a fool with a tool is still a fool).

## Risk Management Framework (pages 16-22)

### Slide 16 · Risk Management Framework: Five Stages

> - RMF occurs in parallel with SDLC activities

![Lecture 15, page 16](L15_p16.webp "50% 1368x660")

**Figure.** Five green boxes connected by arrows: **1 Understand the Business context** → **2 Identify the Business and Technical Risk** (with a red label "**Artifact Analysis**") → **3 Synthesize and Rank the Risks** → **4 Define the Risk Mitigation Strategy** → (down) **5 Carry out fixes And validate**, from which an arrow goes left and back up to the "**Business Context**" written under box 2. Boxes 2-5 sit on a yellow background labelled "**Measurement and reporting**".

**Expansion.** The **Risk Management Framework (RMF)** is the process of Pillar I. It runs **in parallel** with the development activities, whatever the life cycle, in five stages detailed on Slides 17-21: understand the business context, identify the business and technical risks (by analysing the artifacts), synthesise and rank them, define a mitigation strategy, carry out the fixes and validate them. Two features of the picture matter: **measurement and reporting** surround all the stages (risks, their status and the progress of mitigation are tracked and reported continuously), and the arrow back from stage 5 makes it a **loop**, repeated as the project and its risks evolve (Slide 22).

### Slide 17 · Stage 1: Understand Business Context

> - Risk management
>   - Occurs in a business context
>   - Affected by business motivation
> - Key activity of an analyst
>   - Extract and describe business goals - clearly
>     - Increasing revenue; reducing dev cost; meeting SLAs; generating high return on investment (ROI)
>   - Set priorities
>   - Understand circumstances
> - Bottomline - answer the question
>   - who cares?

**Expansion.** Software risk matters only as **business** risk, so the analysis starts from the business: what the organisation wants to achieve with the software (more revenue, lower development cost, meeting its **SLAs**, the service-level agreements with its customers, a high **return on investment**), what its priorities are and in which circumstances it operates (market, regulations, deadlines). The bottom-line question is **"who cares?"**: a technical weakness in a component that handles nothing of value matters less than the same weakness in the payment component. Without this stage, risk analysis produces a list of technical problems that nobody knows how to prioritise.

### Slide 18 · Stage 2: Identify the business & technical risks

> - Business risks have impact
>   - Direct financial loss; loss of reputation; violation of customer or regulatory requirements; increase in development cost
> - Severity of risks
>   - Should be capture in financial or project management terms
> - Key is -
>   - tie technical risks to business context

**Expansion.** **Business risks** are expressed by their **impact** on the business: money lost directly, damage to reputation, violation of contracts or regulations (for example data-protection law), higher development costs. **Technical risks** are the software problems that could cause them (a SQL injection in the customer database, a missing access check). The key step is to **tie each technical risk to the business context**: "an attacker can read the orders table" becomes "a breach of customer records, with fines and loss of customers", and its severity is stated in **financial or project-management terms**, which managers can weigh against the cost of the fix. This is the "Artifact Analysis" of Slide 16: technical risks are found by analysing the actual artifacts (requirements, design, code).

### Slide 19 · Stage 3: Synthesize and rank the risks

> - Prioritize the risks alongside the business goals
> - Assign risks appropriate weights for resolution
> - Risk metrics
>   - Risk likelihood
>   - Risk impact
>   - Number of risks mitigated over time

**Expansion.** Once many risks are identified, they must be **prioritised against the business goals** and given **weights** that decide the order in which they are resolved. Three **risk metrics** support this: the **likelihood** of each risk (how probable an exploit is), its **impact** (how much damage it would do; together they give the usual likelihood × impact estimate) and, over time, the **number of risks mitigated**, which measures the progress of the whole effort.

### Slide 20 · Stage 4: Risk Mitigation Strategy

> - Develop a coherent strategy
>   - For mitigating risks in cost effective manner; accounting for
>     - Cost
>     - Completeness
>     - Likelihood of success
> - A mitigation strategy should
>   - Be developed within the business context
>   - Be based on what the organization can afford, integrate and understand
>   - Must directly identify validation techniques

**Expansion.** The mitigation strategy is a **coherent plan**, not a list of patches: for each risk, which countermeasure, in which order, chosen by **cost**, **completeness** (how much of the risk it removes) and **likelihood of success**. It must fit the **business context** (Stage 1), it must be something the organisation can actually **afford, integrate and understand** (a perfect solution that the team cannot maintain is not a solution), and it must say in advance **how each fix will be validated** (Stage 5), so that "mitigated" has a checkable meaning.

### Slide 21 · Stage 5: Carry out Fixes and Validate

> - Execute the chosen mitigation strategy
>   - Rectify the artifacts
>   - Measure completeness
>   - Estimate
>     - Progress, residual risks
> - Validate that risks have been mitigated
>   - Testing can be used to demonstrate and measure
>   - Develop confidence that unacceptable risk does not remain

**Expansion.** The strategy is carried out by **correcting the artifacts** (requirements, design, code, configuration), while measuring how **complete** the work is and estimating the **progress** and the **residual risks** (what remains after the fixes). Then the fixes are **validated**: **testing** (for example re-running the attack that motivated the fix, or the risk-based security tests of Slides 40-41) demonstrates and measures that the risk is gone, so that there is justified **confidence that no unacceptable risk remains**.

### Slide 22 · RMF - A Multi-Loop

> - Risk management is a continuous process
>   - Five stages may need to be applied many times
>   - Ordering may be interleaved in different ways
>     - Risk can emerge at any time in SDLC
>       - One way - apply in each phase of SDLC
>     - Risk can be found between stages
> - Level of application
>   - Primary - project level
>     - Each stage of loop must be represented in complete project
>   - SDLC phase level in requirements, in design, ...
>   - Artifact level
> - It is important to know that RM process is
>   - Cumulative
>   - At times arbitrary and difficult to predict

**Expansion.** The RMF is not executed once, in sequence. **Risk management is continuous**: the five stages are applied many times and can be interleaved in different orders, because risks emerge at any moment of the life cycle (new requirements, design changes, new attack techniques), even between stages. One way to organise it is to run the loop in **each phase** of the SDLC. The loop works at three **levels**: the **project** level (the primary one: every stage must be carried out for the project as a whole), the **SDLC phase** level (a loop within requirements, within design, ...) and the **artifact** level (a loop on a single document or component). The process is **cumulative**, each pass builds on what was found before, and at times **arbitrary and difficult to predict**: it relies on judgement, not on a mechanical procedure.

## The seven touchpoints (pages 23-24)

### Slide 23 · Seven touchpoints

![Lecture 15, page 23](L15_p23.webp "50% 1400x798")

**Figure.** The touchpoint diagram of Slide 11, now with the touchpoints numbered in black circles: **1** Code review (tools); **2** Risk analysis (the number appears on both RISK ANALYSIS labels); **3** Penetration testing; **4** Risk-based security tests; **5** Abuse cases; **6** Security requirements; **7** Security operations. **External review** is marked with an asterisk (*) instead of a number.

**Expansion.** The summary of Pillar II. The numbers are McGraw's ranking by effectiveness (Slide 9): code review (1) and architectural risk analysis (2) first, then penetration testing (3), risk-based security tests (4), abuse cases (5), security requirements (6) and security operations (7). External review (*), an analysis by people outside the design team, is recommended in addition, because an internal team shares the same blind spots. The numbering is about effectiveness, while the position in the picture follows the artifacts: abuse cases and security requirements (5 and 6) come first in the life cycle even though they rank lower.

### Slide 24 · Cost of fixing defect at each stage

![Lecture 15, page 24](L15_p24.webp "50% 1400x842")

**Figure.** A chart, "**Cost of Fixing Defects at Each Stage of Software Development**", with the **Cost per Defect** on the vertical axis (from $0 to $15,000) and one arrow per stage, from left to right: **Requirements** and **Design** (barely visible), **Coding** (small, under $2,000), **Testing** (tall, around $10,000) and **Maintenance** (the tallest, close to $15,000).

**Expansion.** The economic argument for the touchpoints, the same as in Lecture 1, Slide 43, and Lecture 13, Slides 4 and 16: the cost of fixing a defect grows steeply the later it is found. A requirements or design defect fixed on paper costs little; the same defect found in testing requires redesign, recoding and retesting; found in maintenance, after release, it also brings patches, incident response and damage to the customers. This is why the touchpoints are spread over the whole life cycle, starting from requirements and design, instead of relying on penetration testing at the end.

## Code review (pages 25-31)

### Slide 25 · Code review

> - Focus is on implementation *bugs*
>   - Essentially those that *static analysis* can find
>   - Security bugs are real problems - but architectural flaws are just as big a problem
>     - Code review can capture only half of the problems
>   - e.g.
>     - Buffer overflow bug in a particular line of code
>   - Architectural problems are very difficult to find by looking at the code
>     - Specially true for today's large software

**Expansion.** **Code review** (touchpoint 1) targets **implementation bugs**: essentially the problems that a **static analysis** tool can find, such as a buffer overflow on a particular line. They are real and important, but they are only **about half** of the problems: **architectural flaws** are just as big, and they are very hard to see by reading code, because a flaw is not on any single line (a missing authorisation check on a whole tier, a protocol that trusts the client). This is especially true for today's large systems, whose architecture nobody can reconstruct from millions of lines. Hence code review must be paired with architectural risk analysis (Slide 10).

### Slide 26 · Code review

> - Taxonomy of coding errors
>   - Input validation and representation
>     - Some source of problems
>       - Meta-characters, alternate encodings, numeric representations
>       - Forgetting input validation
>       - Trusting input too much
>       - Example: buffer overflow; integer overflow
>   - API abuse
>     - API represents contract between caller and callee
>     - e.g., failure to enforce principle of least privilege
>   - Security features
>     - Getting right security features is difficult
>     - e.g., insecure randomness, password management, authentication, access control, cryptography, privilege management, etc.

**Expansion.** The **taxonomy of coding errors** is the *Seven Pernicious Kingdoms* of Tsipenyuk, Chess and McGraw (Lecture 5, Slide 31), which organises what code review looks for. The first three kingdoms:

- **Input validation and representation**: problems caused by **meta-characters** (characters with a special meaning for an interpreter, such as \`'\` for SQL or \`;\` for the shell), **alternate encodings** (URL or Unicode encodings that slip past filters) and **numeric representations** (signed/unsigned, overflow), by forgetting validation or by trusting input too much. Examples: buffer overflow (Lecture 3), integer overflow (Lecture 8, Slides 30-33), SQL and command injection (Lectures 5 and 9).
- **API abuse**: an API is a **contract** between caller and callee, and abuse means violating it, for example ignoring a return value, or calling a privileged API without dropping privileges afterwards, which fails to enforce **least privilege** (Lecture 10).
- **Security features**: getting the security features themselves right is hard: **insecure randomness** (a predictable random number generator used for keys or session IDs, like the OpenSSL/OpenSSH PRNG bug of Lecture 10, Slide 39), poor **password management**, broken **authentication** or **access control**, misused **cryptography**, wrong **privilege management**.

### Slide 27 · Code review

> - Taxonomy of coding errors
>   - Time and state
>     - Typical race condition issues
>     - e.g., TOCTOU; deadlock
>   - Error handling
>     - Security defects related to error handling are very common
>     - Two ways
>       - Forget to handle errors or handling them roughly
>       - Produce errors that either give out way too much information or so radioactive no one wants to handle them
>     - e.g., unchecked error value; empty catch block

**Expansion.** Two more kingdoms:

- **Time and state**: errors due to concurrency and to the order of events: **race conditions** such as **TOCTOU** (Lecture 11) and **deadlocks**, which can freeze a system (a denial of service).
- **Error handling**, very common in practice, in two opposite ways: errors that are **not handled**, or handled carelessly (an **unchecked error value**, an **empty catch block** that silently continues in an inconsistent state; Lecture 10, Slides 37-38), and errors that **reveal too much** (stack traces or SQL error messages shown to the user, which help the attacker, as in the SQL injection of Lecture 9) or are so complicated ("radioactive") that nobody wants to deal with them.

### Slide 28 · Code review

> - Taxonomy of coding errors
>   - Code quality
>     - Poor code quality leads to unpredictable behavior
>     - Poor usability
>     - Allows attacker to stress the system in unexpected ways
>     - E.g., Double free; memory leak
>   - Encapsulation
>     - Object oriented approach
>     - Include boundaries
>     - E.g., comparing classes by name
>   - Environment
>     - Everything outside of the code that is important for the security of the software
>     - E.g., password in configuration file (hardwired)

**Expansion.** The last kingdoms:

- **Code quality**: poor-quality code behaves unpredictably, and attackers exploit unpredictability by stressing the system in unexpected ways. Examples: a **double free** (freeing the same memory twice corrupts the allocator's data structures and can lead to code execution; Lecture 2, Slide 3) and a **memory leak** (repeated until memory runs out, it becomes a denial of service). Poor usability belongs here too, because it leads users and administrators to insecure choices.
- **Encapsulation**: object-oriented programs rely on boundaries between classes, objects and components, and violating them is a security error. Example: **comparing classes by name** (in Java two different classes can have the same name if loaded by different class loaders, so a check based on the name can be fooled by an attacker's class with a trusted name).
- **Environment**: everything **outside the code** that affects its security: configuration, deployment, build environment. Example: a **password hard-wired in a configuration file**, readable by anyone with access to the file or to the repository.

### Slide 29 · Code review

> - Static analysis tools
>   - False negative (wrong sense of security)
>     - A sound tool does not generate false negatives
>   - False positives
>   - Some examples
>     - ITS4 (It's The Software Stupid Security Scanner);
>     - RATS; Flawfinder

**Expansion.** Static analysis tools automate part of code review (Lectures 6 and 7). Their errors are of two kinds (Lecture 6, Slide 4): **false negatives**, real problems that the tool misses, dangerous because they give a **wrong sense of security**; and **false positives**, warnings about problems that are not real, which waste the reviewers' time and lead them to ignore the tool. A **sound** tool guarantees no false negatives (whatever it does not report is safe), which in practice means accepting more false positives (Lecture 7: sound analyses over-approximate). The examples are the early lexical scanners of Lecture 6, Slide 15, and Lecture 8, Slide 13: **ITS4** (by Cigital, the company where McGraw worked), **RATS** and **Flawfinder**.

### Slide 30 · Rules overlap

![Lecture 15, page 30](L15_p30.webp "50% 1064x1107")

**Figure.** A Venn diagram of the C/C++ API rules of three static analysis tools: **SourceScope** (653 total C/C++ APIs), the largest circle; **RATS** (310 total C/C++ APIs); **ITS4** (144 total C/C++ APIs). Labels point to three regions: "**26 APIs unique to RATS**", "**45 APIs unique to ITS4**" and "**3 APIs shared by ITS4 and RATS but not in SourceScope**"; the rest of the RATS and ITS4 circles lies inside SourceScope.

**Expansion.** The rules of a static analysis tool are its knowledge (Pillar III): a tool finds only what its rule base describes. The diagram compares the lists of dangerous C/C++ functions known to three tools: even the largest, SourceScope, misses dozens of APIs that the smaller tools flag (26 known only to RATS, 45 only to ITS4, 3 known to both of them but not to SourceScope). No single tool's rule set is complete, so using several tools, or one with a carefully maintained rule base, finds more, and a clean report never means "no problems".

### Slide 31 · Cigital Static analysis process

![Lecture 15, page 31](L15_p31.webp "50% 1226x1226")

**Figure.** A flowchart, "**Static Code Analysis**", in three columns, **Inputs**, **Activities** and **Outputs**:

- **Inputs**: the **Technical Lead**; a **Static Analysis Tool** (FxCop, Fortify, BOON, BLAST); and **Documentation**: a **Knowledge Management System** that provides a **List of Categorized, Prioritized Risks** and the **Analysis Criteria**, **Code Documentation** (extracted: standards, platform, language, framework), **Architecture & Design Documents**, **Prior Analysis Documents** and a **Source File to Module Mapping**.
- **Activities**, from top to bottom: **Identify Input Points, Problem Symptoms, & Vulnerabilities for Additional Inspection** → **Set Up Selected Tool(s)** → **Select Source Files to Be Analyzed** → **Run Tool(s)** → **Analyze Tool Output** → **Identify, Categorize, & Prioritize Risk(s)** → **Run Tool(s) Again?**: if YES, back to the first activity; if NO, **Synthesize Results**.
- **Outputs**: **Vulnerable Code & Auto Data** and **Vulnerability Documentation** (from the first activity), the **Configured Tool(s)**, the **Source Files to Be Analyzed**, the **Tool Output**, the **Knowledge Management System** with an **Updated List of Categorized, Prioritized Risks**, and the synthesised results.

**Expansion.** The process that Cigital, McGraw's company, used for tool-assisted code review. Three points stand out: the tool is **set up and configured** for the code base, not just run with its defaults (the tools named are FxCop, Microsoft's analyser for .NET code, the commercial Fortify, and the research tools BOON, for buffer overruns, and BLAST, a model checker); the **tool output is analysed by people**, who discard the false positives and turn the true findings into **categorised, prioritised risks**, which enter the risk management of Pillar I; and the process is **iterative** (the tools are run again with refined settings or on more files) and **feeds the knowledge base**, so that each review improves the next one. The inputs show that the reviewer needs context, architecture, prior analyses and known risks, to know where to look.

## Architectural risk analysis (pages 32-37)

### Slide 32 · Architectural Risk Analysis

> - Design flaws
>   - about 50% of security problem
>   - Cannot be found by looking at code
>     - A higher level of understanding required
> - Risk analysis
>   - Track risk over time
>   - Quantify impact
>   - Link system-level concerns to probability and impact measures
>   - Fits in the RMF

**Expansion.** **Architectural risk analysis (ARA)**, touchpoint 2, targets **design flaws**, about **half** of all security problems, which **cannot be found by reading code** because they live at a higher level, in how components, trust boundaries and protocols fit together (Slide 25). It is a **risk** analysis in the sense of the RMF (Slides 16-22): risks are **tracked over time**, their **impact** is quantified, and system-level concerns ("an attacker could impersonate the payment server") are linked to **probability and impact** measures that management can act on. It is the threat modelling of Lecture 12 inside McGraw's framework.

### Slide 33 · Architectural Risk Analysis

> - Three critical steps (or subprocesses)
>   - Attack Resistance Analysis
>   - Ambiguity Analysis
>   - Weakness Analysis

**Expansion.** ARA consists of three sub-processes, detailed on Slides 35-37: **attack resistance analysis** (check the design against **known** attacks and flaws), **ambiguity analysis** (discover **new** risks where the design is unclear, or understood differently by different people) and **weakness analysis** (assess the risks that come from **external dependencies**: frameworks, libraries, platform).

### Slide 34 · ARA with RMF

![Lecture 15, page 34](L15_p34.webp "50% 1400x781")

**Figure.** The RMF picture of Slide 16 adapted to architectural risk analysis: **1 Understand the Business context** → a block with **2 Identify the Business Risk** and **3 Identify the Technical Risk** (each with a red "**Artifact Analysis**" label, with "**Business Context**" between them and the note "**Technical expertise**") → **4 Synthesize and Rank the Risks** → **5 Define the Risk Mitigation Strategy** → (down) **6 Fix the artifacts** → **7 Validate the artifacts**, from which a "**Validation loop**" arrow returns to the block of stages 2-3. Stages 2-7 sit on a yellow background labelled "**Measurement and reporting**"; a thin arrow from stage 7 leads out of it to a box "**Initiate process improvement**".

**Expansion.** ARA is the RMF applied to the architecture: business risks and technical risks are identified **separately** (stage 2 needs an understanding of the business, stage 3 **technical expertise** about the design and its attacks) and then combined. Two additions compared with Slide 16: the fixes are **validated** in a loop until the risk is acceptable, and the lessons learned **initiate process improvement**, so that the same kind of flaw is avoided in future designs, not only fixed in this one.

### Slide 35 · ARA process

![Lecture 15, page 35](L15_p35.webp "50% 1400x912")

**Figure.** A flowchart, "**Architectural Risk Analysis**", in three columns, **Input**, **Activities** and **Outputs**:

- **Input**, three groups of documents: Exploit Graphs, Attack Patterns and Secure Design Literature; Requirements, Architectural Documents and Regulatory Requirements/Industry Standards; External Resources (Mailing Lists, Product Documentation) and Attack Patterns.
- **Activities**: the **Security Analyst** starts with **Build One-Page Architecture Overview**, followed by three parallel columns:
  - **Perform Attack Resistance Analysis** → Identify General Flaws (Noncompliance; Show Where Guidelines Are Not Followed) → Map Applicable Attack Patterns → Show Risks and Drivers in Architecture → Show Viability of Known Attacks Against Analogous Technologies.
  - **Perform Ambiguity Analysis** → Ponder Design Implications → Generate Separate Architecture Diagram Documents → Unify Understanding (Uncovers Ambiguity; Identify Downstream Difficulty (Sufficiency Analysis); Unravel Convolutions; Uncover Poor Traceability).
  - **Perform Underlying Framework Weakness Analysis** → Find & Analyze Flaws in COTS, Frameworks, Network Topology, Platform → Identify Services Used by Application → Map Weaknesses to Assumptions Made by Application.
- **Outputs**: the documents **Software Flaws** and **Architectural Risk Assessment Report**.

**Expansion.** The whole ARA process on one page. Its first step is notable: **build a one-page architecture overview**, a high-level picture of the components and their interactions, because flaws are visible only at that level of abstraction. From there the three sub-processes run in parallel (Slides 36-37), each fed by its own knowledge: attack patterns, exploit graphs and secure-design literature for attack resistance; requirements and architecture documents for ambiguity; external resources about the platforms and frameworks for weakness analysis. The outputs are the list of **software flaws** and the **architectural risk assessment report**, which enter the ranking and mitigation stages of the RMF.

### Slide 36 · ARA process

> - *Attack Resistance Analysis*
>   - Steps
>     - Identify general flaws using secure design literature and checklists
>       - Knowledge base of historical risks useful
>     - Map attack patterns using either the results of *abuse case* or a list of attack patterns
>     - Identify risk based on checklist
>     - Understand and demonstrate the viability of these known attacks
>       - Use exploit graph or attack graph
> - Note: particularly good for finding known problems

**Expansion.** **Attack resistance analysis** checks the design against **known** problems:

1. Identify **general flaws** using secure-design literature and **checklists** (the principles of Lectures 10 and 12), helped by a knowledge base of **historical risks**: what went wrong in similar systems.
2. **Map attack patterns** onto the design, using the results of the **abuse cases** (Slides 42-44) or a catalog of attack patterns: which known attacks apply to which component?
3. **Identify the risks** based on the checklist.
4. **Demonstrate the viability** of the known attacks with an **exploit graph** or **attack graph**, a diagram of the steps by which an attacker could reach a goal through the system, like the attack trees of Lecture 12, Slides 12-13.

As the note says, it is particularly good at finding **known** problems, which is also why it misses new ones: that is the job of ambiguity analysis.

### Slide 37 · ARA process

> - *Ambiguity analysis*
>   - Discover new risks - creativity required
>   - A group of analyst and experience helps - use multiple points of view
>     - Unify understanding after independent analysis
>   - Uncover ambiguity and inconsistencies
> - *Weakness analysis*
>   - Assess the impact of external software dependencies
>   - Modern software
>     - is built on top of middleware such as .NET and J2EE
>     - Use DLLs or common libraries
>   - Need to consider
>     - COTS
>     - Frameworks (J2EE, .NET, ...)
>     - Network topology
>     - Platform
>     - Physical environment
>     - Build environment

**Expansion.** The other two sub-processes:

- **Ambiguity analysis** looks for **new** risks, which no checklist can provide; it requires **creativity** and benefits from **several analysts** with different experience, who first analyse the design **independently** and then **unify their understanding**. Where their views of the design disagree there is an **ambiguity or inconsistency**, and ambiguities are where flaws hide: if two designers understand a protocol differently, an attacker can exploit the gap between the two implementations.
- **Weakness analysis** assesses the risks of **external dependencies**. Modern software is built on **middleware** and platforms (.NET and J2EE then; today also Spring, Node.js, cloud services) and on DLLs and common libraries, and their weaknesses become the application's weaknesses. It must consider **COTS** (commercial off-the-shelf) components, **frameworks**, the **network topology**, the **platform**, the **physical environment** and the **build environment** (a compromised build system compromises everything it builds, Lecture 2's Trusting Trust). Today this is called software supply-chain security.

## Penetration testing and risk-based security testing (pages 38-41)

### Slide 38 · Software penetration testing

> - Most commonly used testing today
> - Currently
>   - Outside -> in approach
>   - Better to do after code review and ARA
>   - As part of final preparation acceptance regimen
>   - One major limitation
>     - Almost always a too-little-too-late attempt at the end of a development cycle
>       - Fixing things at this stage
>         - May be very expensive
>         - Reactive and defensive

**Expansion.** **Penetration testing** (touchpoint 3; Lecture 6, Slide 32) is the most widely used form of security testing. As usually practised, it is an **outside → in** attack on the finished system, done as part of the final acceptance before release. It works better **after** code review and ARA, when the obvious problems are already gone and the testers can focus on what remains. Its major limitation: done only at the end, it is **too little, too late**; fixing what it finds is **expensive** (Slide 24), and the approach is **reactive and defensive** (patching what the testers happened to break) rather than building security in. A passed penetration test shows only that these testers did not break the system in the time they had.

### Slide 39 · Software penetration testing

> - A better approach
>   - Penetration testing from the beginning and throughout the life cycle
>   - Penetration test should be driven by perceived risk
>   - Best suited for finding configuration problems and other environmental factors
>   - Make use of tools
>     - Takes care of majority of grunt work
>     - Tool output lends itself to metrics
>     - e.g.,
>       - fault injection tools;
>       - attacker's toolkit: disassemblers and decompilers; control flow and coverage tools, monitors, rootkits

**Expansion.** How to do penetration testing well: start **early** and continue **throughout** the life cycle (testing components and prototypes, not only the final product), and **drive it by risk**: attack where the risk analysis says the danger is, instead of running generic attacks. It is best at what the other touchpoints miss: **configuration problems** and **environmental factors** (open ports, default passwords, weak server settings), visible only in a deployed system. **Tools** do the repetitive "grunt work" and produce output that can be measured over time (metrics): **fault injection** tools (which feed malformed input, as fuzzers do; Lecture 6, Slide 25) and the attacker's own toolkit, **disassemblers and decompilers** (to understand binaries), **control-flow and coverage** tools (to see which code the tests reached), **monitors** and even **rootkits** (to observe and control the system from the inside).

### Slide 40 · Risk-based security testing

> - Testing must be
>   - Risk-based
>   - grounded in both the system's architectural reality and the attacker's mindset
>     - Better than classical black box testing
>   - Different from penetration testing
>     - Level of approach
>     - Timing of testing
>       - Penetration testing is primarily on completed software in operating environment; outside->in

**Expansion.** **Risk-based security testing** (touchpoint 4) is driven by the **risks** found by ARA and by the abuse cases, and it is grounded both in the system's **real architecture** (white-box: the testers know the design and target its weak points) and in the **attacker's mindset**. That makes it better than classical **black-box** testing, which probes the system blindly. It differs from penetration testing in **level** (it tests components and features, not only the whole system from outside) and in **timing**: penetration testing is done mainly on completed software in its operating environment, from outside in, while risk-based tests are planned with the test plans and run as soon as the components exist.

### Slide 41 · Risk-based security testing

> - Security testing
>   - Should start at feature or component/unit level testing
>   - Must involve two diverse approaches
>     - Functional security testing
>       - Testing security mechanisms to ensure that their functionality is properly implemented
>     - Adversarial security testing
>       - Performing risk-based security testing motivated by understanding and simulating the attacker's approach

**Expansion.** Security testing should start at the level of **features and units**, as ordinary testing does, and it must combine two approaches:

- **Functional security testing** checks that the security **mechanisms** work as specified: the login rejects wrong passwords, the access control denies unauthorised users, the encryption is really applied (the functional testing for security of Lecture 6, Slide 23). It tests what the system *should* do.
- **Adversarial security testing** checks what the system must *not* allow, by **simulating an attacker**: guided by the risks, it tries injections, overflows, bypasses and abuse of the mechanisms. It finds the problems that functional testing never looks for, because security is about what happens outside the intended behaviour.

## Abuse cases (pages 42-44)

### Slide 42 · Abuse cases

> - Creating anti-requirements
>   - Important to think about
>     - Things that you don't want your software to do
>     - Requires: security analysis + requirement analysis
>   - Anti-requirements
>     - Provide insight into how a malicious user, attacker, thrill seeker, competitor can abuse your system
>     - Considered throughout the lifecycle
>       - indicate what happens when a required security function is not included

**Expansion.** **Abuse cases** (touchpoint 5) are the dark side of use cases: a use case describes how a legitimate user employs the system, an abuse case how a malicious user, attacker, thrill seeker or competitor could **misuse** it. They capture **anti-requirements**, things the software must **not** do (the negative requirements of Lecture 1, Slide 32), and they need two kinds of expertise together: **security analysis** (how attacks work) and **requirements analysis** (what the system is for). They are written early but **used throughout the life cycle**: they show what happens if a required security function is missing, which justifies the security requirements, and they become test cases for risk-based security testing (Slides 40-41).

### Slide 43 · Abuse cases

> - Creating an attack model
>   - Based on known attacks and attack types
>   - Do the following
>     - Select attack patterns relevant to your system - build abuse case around the attack patterns
>     - Include anyone who can gain access to the system because threats must encompass all potential sources
>   - Also need to model attacker

**Expansion.** Writing abuse cases requires an **attack model**: a description of the attacks the system can face, based on **known attacks and attack types**. In practice: select the **attack patterns** relevant to the system (for example SQL injection for a web application with a database, Lecture 9) and build an abuse case around each one; and consider **everyone who can access the system**, not only external attackers but also insiders, partners and ordinary users, because threats can come from any source. Finally, **model the attacker** as well: skills, resources and motivation decide which attacks are realistic (a thrill seeker and a nation-state are not the same adversary).

### Slide 44 · Abuse cases

![Lecture 15, page 44](L15_p44.webp "50% 1388x1240")

**Figure.** A flowchart, "**Abuse Cases**", in three columns, **Inputs**, **Activities** and **Outputs**:

- **Inputs**: the **Security Analyst (SA)** and the **Requirements Analysts (RAs)**; **Documentation**: **Requirements** (from the Requirements Analyst-Business), **Use Cases** (from the Requirements Analyst-Technical) and **Attack Patterns** (from a Knowledge Management System).
- **Activities**: **Identify Threats** → **Document Threats** → **Review Threats** → **Approved?** (SA & RAs): if NO, **Revise Threats** and review again; if YES, **Create Anti-Requirements** and **Create Attack Model** (SA) → **Review Anti-Requirements** and **Review Attack Model** (SA & RAs), each followed by an **Approved?** check with a revision loop (**Revise Anti-Requirements**, **Revise Attack Model**) → **Create Misuse and Abuse Cases** → **Review Misuse and Abuse Cases** → **Approved?** (if NO, **Revise Misuse and Abuse Cases**; if YES, **Analyze and Rank Misuse and Abuse Cases**, SA & RAs) → **Review Ranked Misuse and Abuse Cases** → **Approved?** (if NO, **Revise Ranked Misuse and Abuse Cases**, SA; if YES, to the outputs).
- **Outputs**: **Deliverable Documents**: the **Attack Model** (Threats, Attack Patterns) and the **Ranked Misuse and Abuse Cases**, each with the **Security Analyst** as owner.

**Expansion.** The flowchart shows how abuse cases are produced in practice: by the **security analyst**, who brings the knowledge of attacks, together with the **requirements analysts**, who know what the system must do, with a **review and approval** step after every product (threats, anti-requirements, attack model, abuse cases, ranking). The two deliverables are the **attack model** (which threats and attack patterns apply) and the **ranked** list of misuse and abuse cases: the ranking matters because, as in the RMF, the effort must go first to the abuse cases with the highest risk. These abuse cases then drive the architectural risk analysis, the security requirements and the risk-based security tests.
`;export{e as default};
