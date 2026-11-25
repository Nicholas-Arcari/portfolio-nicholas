Lecture 13 is the course's capstone: how to bake security into the *whole* software development process rather than bolting it on at the end. It contrasts the traditional lifecycle (which ignores security) with the **Secure Development Lifecycle (SDL)**, walks through security activities at each phase (requirements, design, implementation, verification, release, response), and presents **Microsoft's SDL** as a case study (the SD³+C paradigm, Final Security Review, and measured results). The slide deck has 28 pages.

**Note on the recurring figure.** From Slide 7 onward most slides show the same **pipeline diagram**, the six lifecycle phases as a left-to-right chain of arrows (*Requirements → Design → Implementation → Verification → Deployment/Release → Maintenance/Response*), with the phase being discussed highlighted in red. It is described once here and not repeated per slide.

## Why security must be engineered in (pages 2-6)

### Slide 2 · Definitions

> - *Software Engineering*: Concept of creating and maintaining software applications by applying technologies and practices from computer science and project management fields \[Wikipedia\]
> - Secure Software Engineering

**Expansion.** **Software engineering** is the disciplined application of computer-science techniques *and* project-management practices to build and **maintain** software, note that maintenance (the long tail of a product's life) is part of it. **Secure software engineering** adds security as a first-class concern throughout that discipline: not a feature added late, but a property engineered in at every phase and maintained over the whole life cycle. This lecture defines how.

### Slide 3 · "Current"/Traditional Software Engineering

> - Over 30 years of software development experience created a well defined application software development lifecycle
> - There are many software development methodologies (ex. XP, waterfall, etc) they all have these basic steps
> - Capability Maturity Model for Software (SW-CMM) is used to measure quality of methodologies employed

![Lecture 13, page 3](L13_p03.webp "50% 1400x68")

**Figure.** The traditional **Software Development Life Cycle (SDLC)** as a left-to-right chain: **REQUIREMENTS → DESIGN → IMPLEMENTATION → TESTING → DEPLOYMENT → MAINTENANCE**.

**Expansion.** The standard **SDLC** has six phases (requirements → design → implementation → testing → deployment → maintenance). Although methodologies differ, **waterfall** (phases strictly in sequence), **agile/XP** (short iterative cycles), spiral, they all contain these basic activities. The **SW-CMM (Capability Maturity Model for Software)** rates how mature and repeatable an organisation's process is (levels 1-5, from "ad hoc" to "optimising"). The crucial observation (next slide): this traditional process has **no security activities** in it.

### Slide 4 · Motivation

> - This application development process in its essence fails to address security issues
> - Consequently, security flaws are identified only at the later stages of the application lifecycle. And thus: Much greater cost to fix; High maintenance cost; …
> - Nearly every company/organization utilizes network security infrastructure (e.g. Firewalls, IDS, etc)
> - But very small number of them invest in application security strategy, design, and code review services

**Expansion.** The problem statement. The traditional SDLC **ignores security**, so vulnerabilities are discovered **late**, in testing, or worse, after release, when they are **far more expensive to fix** (a bug caught in requirements costs a fraction of one caught in production, which brings emergency patches, incident response and reputational damage; the cost-of-late-fixes point of Lecture 1, Slide 43). There is also a **misallocation of effort**: almost everyone buys *network* security (firewalls, IDS), but few invest in *application* security (secure design, code review), even though the application is the weak link the network defences let traffic through to (Lecture 1, Slide 20; Lecture 10 "secure the weakest link"). The money goes to the strong link, not the weak one.

### Slide 5 · So (the solution direction)

> - For the software industry, the key to meeting demand for improved security is to implement repeatable processes that reliably deliver measurably improved security
> - Thus, there must be a transition to a more stringent software development process that greatly focuses on security
> - Goal: minimize the number of security vulnerabilities in design, implementation, and documentation - Identify and remove vulnerabilities in the development lifecycle as early as possible!!!

**Expansion.** The response: make security a **repeatable, measurable process**, not heroics. The three emphasised words matter, **repeatable** (the same process every time, so results are consistent, the CMM idea), **reliably** (it dependably improves security), and **measurably** (you can quantify the improvement with metrics). The goal is to **minimise vulnerabilities across design, implementation and documentation**, and above all to **find and fix them as early as possible** ("shift left"), because early fixes are cheap and late fixes are expensive (Slide 4). This motivates the SDL.

### Slide 6 · Building Secure Software

> Three essential components
>
> - Repeatable process
> - Engineer Education
> - Metrics and Accountability
>
> SDL - Secure Development Lifecycle - Used along with traditional/current software development lifecycle/techniques in order to introduce security at every stage of software development

**Expansion.** Building secure software needs **three pillars**: (1) a **repeatable process** (do security the same, dependable way every time); (2) **engineer education** (developers must *know* the vulnerabilities and defences, this course, the "fool with a tool" lesson of Lecture 6 that tools are useless without trained people); and (3) **metrics and accountability** (measure security and make teams responsible for it, you improve what you measure). The vehicle is the **Secure Development Lifecycle (SDL)**: a set of security activities **layered onto the existing SDLC**, adding security to *every* phase rather than replacing the development process. The rest of the lecture details the per-phase activities.

## SDL phase by phase (pages 7-16)

### Slides 7-8 · SDL - Requirements Phase

![Lecture 13, page 7](L13_p07.webp "50% 1400x71")

> (7) Development of requirements (Gather information about application \[customer/experience/survey\]). Analysis of requirements (Are all the security issues addressed \[C, I, A, …\]). Verification of requirements (Any inconsistencies? - system interface - correctness; Documentation!!!; Feasibility of requirements). \[repeat\]. Planning at this stage offers the best opportunity to build secure software in the most efficient manner \[cost, time, etc\].
>
> ![Lecture 13, page 8](L13_p08.webp "50% 1400x71")
>
> (8) Develop Security Requirements (Security Requirements of a system/application must be developed along with any other requirements (e.g. functional, legal, user, etc)). Risk analysis (Identify all the assets at risk; Identify all the threats). Develop security policies (Used as guidelines for requirements). Develop security metrics.

**Expansion.** The **requirements phase** is where security is cheapest to address ("best opportunity ... most efficient"), so the SDL front-loads it:

- **Security requirements are written alongside functional, legal and user requirements**, not after. Just as you specify what the system must *do*, you specify what it must *not* allow (the negative requirements of Lecture 1, Slide 32), in terms of **C, I, A** (confidentiality, integrity, availability) and more.
- **Risk analysis**: inventory the **assets at risk** and the **threats** to them (Lecture 1, Slide 49; Lecture 12 threat modelling) so that requirements target the real risks.
- **Security policies** are drafted to guide the requirements (what access rules, what data protection).
- **Security metrics** are defined now, so progress can be *measured* later (the "measurably" of Slide 5).
- Requirements are then **analysed and verified** (consistent? correct? feasible? documented?) and iterated ("\[repeat\]").

### Slides 9-10 · SDL - Design Phase

![Lecture 13, page 9](L13_p09.webp "50% 1400x71")

> (9) At this stage, all design decisions are made, about: Software Architecture; Software components; Programming languages; Interfaces; …. Develop documentation. Confirm that all requirements are followed and met.
>
> ![Lecture 13, page 10](L13_p10.webp "50% 1400x71")
>
> (10) Threat Models; Input Data Types; Security Use Cases; Security Architecture. Defense in Layers/Separate Components/Least Privilege. Tool: SecureUML and UMLsec.

**Expansion.** The **design phase** makes the architectural decisions (components, languages, interfaces) and must bake in security (Lecture 12). The SDL security activities here:

- **Threat models** (STRIDE, attack trees; Lecture 12) to find how each component can be attacked.
- **Input data types**: define exactly what inputs are expected (so validation can be specified, Lecture 5).
- **Security use cases** (and *abuse cases*, Lecture 1, Slide 45): describe how the system is used securely and how it could be misused.
- **Security architecture** applying the design principles: **defence in depth (layers)**, **compartmentalization (separate components)** and **least privilege** (Lecture 10).
- **Tools**: **SecureUML** and **UMLsec** are extensions of UML (the standard modelling language) that let designers express and check security properties (access-control rules, confidentiality/integrity requirements) directly in the design diagrams, so security can be analysed at design time.

### Slides 11-12 · SDL - Implementation Phase

![Lecture 13, page 11](L13_p11.webp "50% 1400x71")

> (11) This is the stage where coding is done. To produce secure software: Coding Standards; Centralized Security Modules; Secure builds and configurations (Known security vulnerabilities - use good programming practices. Be aware of: Race conditions; Buffer overflow; Format string; Malicious logic; …). Follow Design and Develop Documentation \[further\].

![Lecture 13, page 12](L13_p12_1.webp "50% 1400x71")

![Lecture 13, page 12 (2)](L13_p12_2.webp "50% 1326x505")

**Figure (Slide 12).** A diagram: a central box "**Vulnerability-free Application**" with a curved arrow feeding into it from each side, one labelled "**Design and implementation of security features** - From the Requirements", the other "**Robust Programming Practices** - Good design and coding practices".

**Expansion.** The **implementation phase** is coding, where the SDL enforces secure coding:

- **Coding standards** (secure coding rules: SEI CERT C/C++/Java; Lecture 3, Slide 45) so dangerous constructs are avoided consistently.
- **Centralized security modules**: implement cross-cutting security (input validation, authentication, access control, crypto) in **shared, well-reviewed modules** rather than scattering it, the compartmentalization/"small TCB" idea (Lecture 10, Slide 27; Lecture 5 choke-points).
- **Secure builds and configurations**, and above all **awareness of the known vulnerability classes this course has taught**: the slide explicitly lists **race conditions** (Lecture 11), **buffer overflow** (Lecture 3), **format string** (Lecture 4), and **malicious logic** (backdoors/trojans, Lecture 2's Trusting Trust). This is the "knowledge" pillar applied at the keyboard.
- **Figure's message**: a "vulnerability-free" application comes from **two sources working together**, the *security features designed from the requirements* (doing the right security things) **and** *robust programming practices* (doing all things safely), i.e., *secure software > security software* (Lecture 2, Slide 24): you need both the security features and secure implementation of everything. ("Vulnerability-free" is aspirational, the response phase and Lecture 2, Slide 17 remind us it is never fully achievable.)

### Slide 13 · SDL - Verification Phase

![Lecture 13, page 13](L13_p13.webp "50% 1400x71")

> Testing of the code developed in the previous stage. Cleared security tests. Security vulnerability tracking. Code Reviews. Documentation.

**Expansion.** The **verification phase** tests that the code is actually secure, applying the detection techniques of Lecture 6: **security testing** (functional security tests plus fuzzing, Lecture 6), **tracking** discovered vulnerabilities to closure (a bug tracker for security issues, so none is forgotten), **code reviews** (manual and tool-assisted static analysis, Lecture 6), and documentation of results. This is where the earlier-defined security metrics are measured.

### Slides 14-15 · SDL - Release and Response Phases

![Lecture 13, page 14](L13_p14.webp "50% 1400x71")

> (14, Release/Deployment) Secure Management Procedures; Monitoring Requirements; Security Upgrade Procedures.
>
> ![Lecture 13, page 15](L13_p15.webp "50% 1400x71")
>
> (15, Response/Maintenance) Causes: Customer feedback; Security incident details and vulnerability reports; …. Types of maintenance: Need to introduce new functionality; Need to upgrade to keep up with technology; Discovered vulnerability.

**Expansion.** Security does not end at release:

- **Release/Deployment** must ship with **secure management procedures** (how to operate it safely), **monitoring** (logging/alerting to detect attacks, the operational tooling of Lecture 6, Slide 34; the auditing of Lecture 1), and **security upgrade procedures** (a working mechanism to deliver patches, recall the unpatched Slammer victims of Lecture 1).
- **Response/Maintenance** handles the inevitable post-release security work, triggered by **customer feedback, security incidents and vulnerability reports**. Maintenance has three drivers: adding functionality, keeping up with technology, and, critically, **fixing discovered vulnerabilities** (patching). This is the "assume breach" reality: even a good SDL does not produce perfect software (Slide 25), so you must be ready to respond.

### Slide 16 · Facts

> Every security vulnerability / flaw overlooked in an earlier phase will show-up at later phase\[s\]. Resulting into greater: Cost; Time; of the software development and/or maintenance

**Expansion.** The central economic fact of the SDL, stated plainly: **a security flaw missed in an early phase does not disappear, it resurfaces later, when it is more expensive and time-consuming to fix** (requirements → design → code → test → production, with cost rising at each step, Slide 4). This is the quantitative justification for "shift left": the entire point of adding security activities to *every* phase is to catch each flaw at the earliest (cheapest) possible point, rather than paying the much higher price of fixing it after release.

## Case study: Microsoft's SDL (pages 17-28)

### Slide 17 · Microsoft Trustworthy Computing SDLC

> - Generally accepted SDL process at MS
> - (actually spiral not "waterfall" as it indicates)

![Lecture 13, page 17](L13_p17.webp "50% 1400x360")

**Figure.** The Microsoft SDL overlaid on the lifecycle: the six phase-arrows (Requirements → Design → Implementation → Verification → Release → Support & Servicing) with a coloured band above showing the deliverables/activities per phase, Requirements: *Feature Lists, Quality Guidelines, Architecture Docs, Schedules*; Design: *Functional Specifications, Design Specifications*; Implementation: *Development of New Code*; Verification: *Testing and Verification, Bug fixes*; Release: *Code Signing & signoff*, then *Release*; Support & Servicing: *Product Support, Service Packs/QFEs, Security Updates*.

**Expansion.** Microsoft's **SDL** grew out of Bill Gates's 2002 **Trustworthy Computing** initiative (Lecture 1, Slide 44), after the worms of 2001-2003 (Code Red, Nimda, Blaster) made Windows security a business crisis. It is the most influential real-world SDL and the industry reference. The slide's caveat, "actually spiral, not waterfall", matters: although drawn as a linear pipeline for clarity, real development **iterates** (spiral/agile), so the SDL activities recur each cycle rather than happening once. (QFE = Quick Fix Engineering, Microsoft's term for hotfixes.)

### Slide 18 · Microsoft Case Study: SD³ + C

> - **Secure by Design** - Software designed and implemented to "protect" itself and its information
> - **Secure by Default** - Accept the fact that software will not achieve perfect security - To minimize the harm when vulnerabilities exploited, software's default state should promote security (e.g. least necessary privileges)
> - **Secure in Deployment** - Software accompanied by tools and guidance to assist secure use
> - **Communications** - Developers should be prepared for discovery of product vulnerabilities and should communicate openly and responsibly with end users. (e.g. patching, deploying workarounds)

**Expansion.** **SD³+C** is Microsoft's memorable summary of its security strategy, three "Secure by D..." plus Communications:

- **Secure by Design**: build the software to protect itself and its data from the start, applying the design principles (Lecture 12). Prevention.
- **Secure by Default**: *accept that perfect security is impossible* (Lecture 2, Slide 17), so ship with the **most secure default configuration**, least privilege, unused features off, protections on (Lecture 10, Slide 31). This limits the harm when (not if) a vulnerability is exploited, and was a major practical change: Windows Server 2003 shipped with many services off by default, unlike its predecessors.
- **Secure in Deployment**: give customers the **tools and guidance** to run it securely (hardening guides, configuration tools, patch management).
- **Communications**: be **prepared to respond** to discovered vulnerabilities and communicate **openly and responsibly** with users, timely patches, advisories, workarounds. This institutionalises responsible disclosure and the response phase (Slide 15).

SD³+C neatly maps the course's principles (prevention by design, secure defaults, least privilege, defence in depth, plus honest incident response) onto a corporate strategy.

### Slide 19 · SDL @ Microsoft (activities per phase)

> The six phases (Requirements → Design → Implementation → Verification → Release → Response) with their security activities.

![Lecture 13, page 19](L13_p19.webp "50% 1400x778")

**Figure.** Each phase is annotated with its concrete SDL activities:

| Phase | Security activities |
| --- | --- |
| Requirements ("Inception") | Security Advisor assigned; ensure security milestones are understood; identify security requirements |
| Design | Design & Threat Modeling: design guidelines documented; threat models produced; security architecture documented; threat-model and design review completed |
| Implementation | Guidelines & Best Practices: coding and test standards; test plans developed and executed; tools used |
| Verification | Security Push: threat models reviewed; code reviewed; attack testing; new threats evaluated; security testing completed |
| Release | Final Security Review: threat models reviewed; unfixed bugs reviewed; new bugs reviewed; penetration testing completed; documentation achieved |
| Response | Security Response Feedback: tools/processes evaluated; postmortems completed |

**Expansion.** This is the concrete realisation of the generic SDL (Slides 7-16) at Microsoft, worth noting as the authoritative example. Each phase has mandated, checkable security activities: a **security advisor ("security buddy")** guiding the team from the start; **threat modelling and design review** in design; **coding standards, tools and test plans** in implementation; a dedicated **"Security Push"** (an intensive review-and-test effort) in verification; the **Final Security Review (FSR)** gate before release (Slide 24); and **postmortems and process improvement** in response. The point: security is not a single checkpoint but a continuous thread with specific deliverables and reviews at every stage.

### Slides 20-25 · SDL @ Microsoft, phase details

![Lecture 13, page 20](L13_p20.webp "50% 1400x71")

> (20, Requirements) Product and central security teams assign "security buddy" - security advisor (Point of contact / resources / guide; Review plans / recommendations / resources). Product team considers (How security will be integrated into the development process; Key security objectives). Documentation.
>
> ![Lecture 13, page 21](L13_p21.webp "50% 1400x71")
>
> (21, Design) Define security architecture and design guidelines (identify TCB, use layering). Document the elements of the software attack surface. Conduct threat modeling. Define supplemental ship criteria.
>
> ![Lecture 13, page 22](L13_p22.webp "50% 1400x71")
>
> (22, Implementation) Apply coding and testing standards. Apply security testing tools, including fuzzing tools (Supplies structured but invalid inputs). Apply static-analysis code scanning tools. Conduct code reviews.
>
> ![Lecture 13, page 23](L13_p23.webp "50% 1400x71")
>
> (23, Verification) "Beta" testing stage. "Security push" (security code reviews beyond those completed in implementation phase (e.g. legacy code not modified); Testing of high priority code; Trying to "break" the code).
>
> ![Lecture 13, page 24](L13_p24.webp "50% 1400x71")
>
> (24, Release) During the release, software is subject to Final Security Review \[FSR\]. The goal of FSR is to determine whether, from security viewpoint, the software is ready to be delivered to customers. Not pass / fail. Goal is to find every remaining security vulnerability in software (If found, revisit all the preceding phases and fix the root problem). Conducted by central security team.
>
> ![Lecture 13, page 25](L13_p25.webp "50% 1400x71")
>
> (25, Response) Despite use of SDL, resulting software is not vulnerability free; and even if it could be so, new attacks would be possible. Evaluation of reports. Development of patches and security updates.

**Expansion.** The per-phase detail, each mapping to techniques from earlier lectures:

- **Requirements**: a **security advisor** is assigned to guide the team, and security objectives and integration are planned up front (Slide 7).
- **Design**: define the **security architecture**, explicitly **identify the TCB** and **use layering** (Lecture 10, Slides 27, 51), **document the attack surface** (so it can be minimised, Lecture 10, Slide 28), and **conduct threat modelling** (Lecture 12). "Supplemental ship criteria" are extra security bars the product must meet to ship.
- **Implementation**: coding/testing standards, **fuzzing** ("structured but invalid inputs", Lecture 6, Slide 25), **static-analysis scanners** (Lecture 6, Slide 15), and **code reviews**, exactly the detection toolkit of Lecture 6.
- **Verification**: the **Security Push**, an intensive extra round of code review (including *legacy code that was not modified*, often the most dangerous because it predates secure practices), testing of high-priority code, and actively **trying to break the code** (the attacker mindset, pen-testing).
- **Release**: the **Final Security Review (FSR)** is the security gate, a central-team assessment of whether the product is secure enough to ship. Crucially it is **not simply pass/fail**: the goal is to **find every remaining vulnerability**, and if serious ones are found, the team must **go back and fix the root cause** in the appropriate phase (not just patch the symptom). This enforces accountability.
- **Response**: acknowledging that **the software is never vulnerability-free** (and new attack techniques keep emerging, Lecture 2, Slide 17), the team evaluates incoming vulnerability reports and ships **patches and security updates** (the maintenance reality of Slide 15).

### Slide 26 · SDL @ Microsoft (after adding SD³+C)

> After adding the SD³+ C paradigm

![Lecture 13, page 26](L13_p26.webp "50% 1400x424")

**Figure.** The same six-phase pipeline, now with the SD³+C activities overlaid as a richer band: Requirements: *Security Kickoff & Register with SWI*; a **Security Training** bar spanning the early phases, *Security Design Best Practices, Security Architecture & Attack Surface Review, Threat Modeling*; Implementation: *Use Security Development Tools & Security Best Dev & Test Practices*; *Create Security Documentation and Tools For Product*; Verification: *Prepare Security Response Plan, Security Push, Pen Testing*; Release: *Final Security Review*; Support & Servicing: *Security Servicing & Response Execution*.

**Expansion.** This diagram shows the **mature Microsoft SDL** with all SD³+C activities inserted across the lifecycle. Note the additions beyond the basic SDL: a **Security Kickoff** and registration with the Secure Windows Initiative (SWI) team; mandatory **security training** spanning the early phases (the "engineer education" pillar, Slide 6); an explicit **Attack Surface Review** and **Threat Modeling** in design; **penetration testing** and a **Security Response Plan** in verification; and **security servicing** in support. It is the complete, operationalised SDL, the template most of the industry subsequently adopted (and the ancestor of today's DevSecOps).

### Slide 27 · SDL @ Microsoft (what makes it work)

> - Mandatory Application of the SDL
> - Mandatory Education
> - Metrics for Product Teams
> - The Central Security Team

**Expansion.** The four organisational factors that made Microsoft's SDL actually succeed (recall the "culture change" and "champion" advice of Lecture 6, Slide 39):

- **Mandatory application**: the SDL is **required**, not optional, every product team must follow it (a process is only repeatable if it is enforced).
- **Mandatory education**: **required** security training for engineers (the education pillar).
- **Metrics for product teams**: security is **measured**, so teams are accountable and improvement is visible (the metrics-and-accountability pillar, Slide 6).
- **A central security team**: a dedicated expert group that owns the process, advises teams (the security buddies), conducts the Final Security Review, and drives continuous improvement.

Together these turn security from good intentions into an enforced, measured, supported organisational practice, the difference between an SDL that works and a policy document that is ignored.

### Slide 28 · Results

![Lecture 13, page 28](L13_p28.webp "50% 1400x856")

**Figure.** A stacked bar chart, "Figure 3. First Year Security Bulletins: Windows 2000 vs. Windows Server 2003", comparing the number of security bulletins in each product's first year after release, by severity:

| Severity | Windows 2000 (pre-SDL) | Windows Server 2003 (post-SDL) |
| --- | --- | --- |
| Critical | 10 | 6 |
| Important | 32 | 6 |
| Moderate | 16 | 8 |
| Low | 7 | 2 |
| **Total** | **65** | **22** |

**Expansion.** The **measured payoff of the SDL**, the data that justified the whole programme. Windows 2000 (developed *before* the SDL) had **65 security bulletins** in its first year; Windows Server 2003 (the first OS developed *with* the SDL and SD³+C) had only **22**, a roughly **66% reduction**, with the most severe categories falling sharply (Important from 32 to 6, Critical from 10 to 6). This is the "**measurably** improved security" promise of Slide 5 made concrete: a repeatable secure process produced a large, quantifiable drop in real vulnerabilities. It is the empirical argument that **building security in throughout the lifecycle works**, the conclusion of the lecture and of the course: the vulnerabilities studied in Lectures 3-11 are best defeated not one bug at a time but by the secure design (Lecture 12) and secure process (this lecture) that prevent whole classes of them from ever being written.
