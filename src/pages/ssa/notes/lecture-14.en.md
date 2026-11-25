Lecture 14 moves from the security activities of a single project (the SDL of Lecture 13) to the **process models** used to define, assess and improve secure development across a whole organisation: what a process model is and what its *capability* or *maturity* dimension measures, the four focus areas of a secure SDLC, the **Capability Maturity Models** (CMMI, the FAA's iCMM, the Trusted CMM and, built specifically for security, the **SSE-CMM**, standardised as ISO/IEC 21827, with its process areas, base practices, generic practices and capability levels), the three ways the SSE-CMM is used (process improvement, capability evaluation with the SSAM appraisal method, assurance), the FAA/DoD safety and security additions to CMMI and iCMM, and the **Team Software Process for Secure Software Development (TSP-Secure)**. The slide deck has 50 pages.

## Objective and process models (pages 1-5)

### Slide 1 · Title slide

> **Security in Software Applications**
>
> Secure Software Development Models/Methods

### Slide 2 · Objective

> - Understand/Familiarize with various process models for secure software development and assurance
>   - Capability Maturity Models
>     - CMMI, iCMM, SSE-CMM
>     - TSP
>   - Secure software development life cycle models

**Expansion.** Lecture 13 described *what* security activities a development project should perform (the SDL). This lecture takes the organisational view: **how an organisation defines, measures and improves the processes** with which it builds secure software, and how outsiders can judge those processes. The acronyms are the map of the lecture:

- **CMM / CMMI**: the Capability Maturity Model (Integration) of the Software Engineering Institute (SEI) at Carnegie Mellon University, the reference model for process maturity (Slides 10-14).
- **iCMM**: the *integrated* CMM of the US Federal Aviation Administration, which merges several standards into one model (Slides 15-16).
- **SSE-CMM**: the Systems Security Engineering CMM, the maturity model written specifically for security engineering, now the standard ISO/IEC 21827 (Slides 18-37).
- **TSP**: the SEI's Team Software Process and its security variant TSP-Secure, an *operational* method for development teams (Slides 44-50).

The word **assurance** in the objective matters: these models are used not only to build secure software but also to produce the *evidence* that lets customers trust it (Slides 24 and 37).

### Slide 3 · Process Models

> - **Secure Process**
>   - Set of activities performed to develop, maintain, and deliver a secure software solution
>   - Activities could be concurrent or iterative
> - **Process model**
>   - provides a reference set of best practices that can be used for both
>     - process improvement and process assessment
>   - defines the characteristics of processes
>   - usually has an architecture or a structure

**Expansion.** Two terms the rest of the lecture relies on:

- A **secure process** is *what an organisation actually does*: the set of activities (requirements, design, coding, review, testing, delivery, maintenance) through which it develops and maintains a secure product. The activities need not be sequential: they can run in parallel or be repeated in iterations (spiral or agile development, the "actually spiral, not waterfall" remark of Lecture 13, Slide 17).
- A **process model** is a *reference*: a structured catalogue of best practices against which a real process is compared. It serves two purposes: **improvement** (find what is missing and add it) and **assessment** (measure how good a process is, for example before a contract is awarded). It describes the **characteristics** a good process must have, organised in a structure (categories, process areas, practices, levels), as the SSE-CMM's 22 process areas show (Slides 26-31).

Process model vs. process is a "what vs. how" distinction: the model says *which* practices must be in place, each organisation decides *how* to implement them (Slide 10, "no operational guidance").

### Slide 4 · Process Models

> - Process Models
>   - Identify technical and management practices
>     - good software engineering practices to manage and build software
>   - Establishes
>     - common measures of organizational processes throughout the software development lifecycle (SDLC).
>   - But … no guarantees the product is bug free

**Expansion.** A process model covers both sides of software production: **technical practices** (how software is built: requirements, design, coding, testing) and **management practices** (how the work is planned, tracked, staffed and controlled). It also establishes **common measures**, so that processes can be compared across projects and organisations and over time (the "measurably improved security" of Lecture 13, Slide 5).

The last bullet is the essential caveat: a good process **raises the probability** of a good product but **does not guarantee** it. A mature organisation can still ship a buffer overflow, because a process is carried out by people and checked by tools that have false negatives (Lecture 6, Slide 4). The point returns on Slide 37: process evidence *supports* a claim of trustworthiness, it does not prove it.

### Slide 5 · Process Models

> - Typically also have a *capability* or *maturity* dimension used for
>   - assessment and evaluation purposes.
> - Assessments, evaluations, appraisals includes
>   - **comparison** of a process being practiced to a reference process model or standard
>   - **understanding** process capability in order to improve processes
>   - **determining** if the processes being practiced are
>     - adequately specified, designed, and implemented

**Expansion.** Besides the list of practices, a process model has a **measurement scale**, so that a process can be given a level rather than a yes/no verdict:

- **Capability** refers to a *single process* (or process area): how well that particular process is performed, from "not performed" to "continuously improving". The SSE-CMM rates each of its process areas on a 0-5 capability scale (Slides 30 and 36).
- **Maturity** refers to the *organisation as a whole*: a maturity level is reached when a defined set of process areas is in place at the required capability. The classic CMM maturity levels are 1 Initial, 2 Repeatable (Managed in CMMI), 3 Defined, 4 Managed (Quantitatively Managed in CMMI), 5 Optimizing.

An **assessment** (also called evaluation or appraisal) uses the scale in the three ways of the bold verbs: **compare** the practised process with the reference model or a standard, **understand** its capability in order to decide what to improve, and **determine** whether the process is adequately specified (written down), designed (sensibly organised) and implemented (actually followed). The third matters: a process that exists only on paper is not a process. Slide 32 adds who performs assessments and why.

## Secure SDLC focus areas (pages 6-9)

### Slide 6 · Software Development Life Cycle (SDLC)

> - A survey of existing processes, process models, and standards seems to identify the following four SDLC focus areas for secure software development
>   - Security Engineering Activities
>   - Security Assurance
>   - Security Organizational and Project Management (focused) Activities
>   - Security Risk Identification and Management Activities

**Expansion.** Whatever model is chosen, a secure development process has to cover four areas (detailed on Slides 7-8):

1. **Security engineering**: building the security in (requirements, secure design, secure coding, security testing).
2. **Security assurance**: producing *evidence* that the result is secure (verification, validation, reviews, evaluations).
3. **Organisational and project management**: policies, sponsorship, roles, plans and resources, without which the engineering activities are not sustained.
4. **Risk identification and management**: deciding *which* threats matter and how much to spend on them.

The same four areas reappear in the structure of the SSE-CMM: its security engineering process areas are divided into **engineering**, **assurance** and **risk** processes (Slides 20-24), and its other eleven process areas cover **project and organisational** practices. The survey quoted on the slide is the SEI's 2005 study of secure-SDLC processes (N. Davis, *Secure Software Development Life Cycle Processes*), which is also the source of the CMMI statistics of Slide 13.

### Slide 7 · SDLC

> - Security Engineering Activities
>   - activities needed to engineer a secure solution.
>
>     security requirements elicitation and definition, secure design based on design principles for security, use of static analysis tools, reviews and inspections, security testing, etc..
> - Security Assurance Activities
>
>   verification, validation, expert review, artifact review, and evaluations.

**Expansion.** The first two focus areas, and how they map onto the course:

- **Security engineering activities** are the ones that *make* the software secure: eliciting and defining **security requirements** (Lecture 13, Slides 7-8; Lecture 1, Slide 56), **secure design** following the design principles (Lectures 10 and 12), **static analysis tools** (Lecture 6, Slide 15; Lecture 7), **reviews and inspections** of designs and code, and **security testing**, including fuzzing (Lecture 6, Slide 25).
- **Security assurance activities** are the ones that *show* that it is secure: **verification** ("did we build the product right?", i.e., does it meet its specification), **validation** ("did we build the right product?", i.e., do the requirements capture the real security needs), **expert review**, **artifact review** (of requirements, design documents, code, test results) and formal **evaluations** (for example a Common Criteria evaluation). Assurance turns activities into evidence for a third party (Slides 24 and 37).

### Slide 8 · SDLC

> - Security Focused Activities
>   - Organizational management
>     - organizational policies, senior management sponsorship and oversight, establishing organizational roles, ….
>   - Project management
>     - project planning and tracking,
>     - resource allocation and usage
> - Security Risk Identification and Management Activities
>   - Cost-based Risk analysis
>   - Risk mitigation ..

**Expansion.** The two remaining focus areas:

- **Security-focused management.** At the **organisational** level security needs *policies* (what must be protected, which practices are mandatory), *senior management sponsorship and oversight* (someone with authority who funds and enforces the programme) and *defined roles* (security officers, the "security buddy" of Lecture 13, Slide 20). At the **project** level it needs *planning and tracking* of the security tasks and *resources* (people, time, tools) to perform them. This is the lesson of Microsoft's SDL: it worked because it was mandatory, measured and supported by a central team (Lecture 13, Slide 27).
- **Security risk identification and management.** Security budgets are finite, so risks must be identified (assets, threats, vulnerabilities, impact: Lecture 1, Slide 49) and **ranked by cost**: a countermeasure is worth adopting when it costs less than the loss it prevents. **Risk mitigation** then reduces each risk to an acceptable level; what is left (the residual risk) is accepted, transferred (for example to an insurer) or avoided by dropping the risky feature. The SSE-CMM implements this area with its risk process areas (Slide 22).

### Slide 9 · System DLC

![Lecture 14, page 9](L14_p09.webp "50% 1400x781")

**Figure.** A waterfall of six boxes descending from left to right, each connected to the next by a curved arrow: **Investigation → Analysis → Logical Design → Physical Design → Implementation → Maintenance**.

**Expansion.** The **systems development life cycle** in the waterfall form common in information-security textbooks: *investigation* (what problem, what scope, is it feasible), *analysis* (current systems, requirements, threats), *logical design* (the solution independent of technology: what the system must do and which security model it needs), *physical design* (the concrete technologies, products and controls), *implementation* (building or buying, testing, deploying) and *maintenance* (operating, monitoring, patching and changing the system for the rest of its life). It is the chain of Lecture 13, Slide 3, with design split into a logical and a physical step. In the secure version every phase gets its security activities, as in the SDL of Lecture 13; and, as with every waterfall picture, real projects iterate.

## Capability Maturity Models (pages 10-17)

### Slide 10 · Capability Maturity Models (CMM)

> - Provides reference model of mature practices
> - Helps identify the potential areas of improvement
> - Provides goal-level definition and key attributes for specific processes
> - **No operational guidance !!**
> - *Focuses on/Defines process characteristics*

**Expansion.** A **Capability Maturity Model** describes what the practices of a *mature* organisation look like, so that an organisation can compare itself with the model and find the gaps to close. For each process it gives the **goals** to achieve and the **key attributes** a process must have to achieve them. The two emphasised lines are the exam point: a CMM says **what** characteristics a process must have, **not how** to implement them. It is not a method, a life cycle or a set of procedures; each organisation designs its own process and uses the CMM to check it. (A method with operational guidance is TSP, Slides 44-50.)

The original CMM for software (SW-CMM) was developed by the SEI at Carnegie Mellon University from the late 1980s, funded by the US Department of Defense, which needed a way to judge the software contractors it hired. It defines five maturity levels: 1 Initial (ad hoc, success depends on individual heroics), 2 Repeatable (basic project management), 3 Defined (a documented standard process for the whole organisation), 4 Managed (the process is measured and controlled quantitatively) and 5 Optimizing (continuous process improvement).

### Slide 11 · CMM

> - Three CMMs
>   - Capability Maturity Model Integration® (CMMI®),
>   - The integrated Capability Maturity Model (iCMM),
>   - Systems Security Engineering Capability Maturity Model (SSE-CMM)
>     - Specifically to develop secure systems

**Expansion.** The three models of the lecture:

- **CMMI** (SEI) integrates the earlier separate CMMs (software, systems engineering, integrated product development) into one framework (Slides 13-14).
- **iCMM** (FAA) integrates CMMI with other quality and life-cycle standards (Slides 15-16).
- **SSE-CMM** is the only one of the three written **specifically for security**: its process areas are security engineering activities such as assessing threats and vulnerabilities, specifying security needs and building an assurance argument (Slides 18-37).

CMMI and iCMM are general process models with little to say about security, which is why they later received the safety and security additions of Slides 38-43.

### Slide 12 · Why CMM?

> Source: http://www.secat.com/download/locked\_pdf/SSEovrw\_lkd.pdf

![Lecture 14, page 12](L14_p12.webp "50% 1400x731")

**Figure.** A chart with **Costs** on the vertical axis and **Capability** on the horizontal axis, and two rising cost curves: **Current process** (the steeper one, on the left) and **Improved process** (to its right). A magenta point on the current-process curve marks the **Current cost** (dotted line to the vertical axis) at the **Current capability** (dotted line to the horizontal axis). Two moves start from it: a blue arrow labelled **Downsizing** goes down the same curve to a blue point at **Reduced cost**, labelled "**Reduced capability for lower cost**"; an orange arrow labelled **Process Improvement** goes across to the improved-process curve, where an orange point is labelled "**Improved capability at lower cost**". On the right, a bracket between the current-cost level and the level of the orange point reads "**Cost of process improvement**", and a bracket below it "**Options depending upon business goals**"; thin arrows from the magenta point to several points of the improved curve show these options. The chart is credited "Source: Merle Whatley, Texas Instruments, Inc.".

**Expansion.** The business argument for process maturity. With the **current process**, cost and capability are tied together along one curve: the only way to spend less is **downsizing** (fewer people, less scope), which moves down the curve and **loses capability**. **Process improvement** moves the organisation onto a **better curve**, on which the same money buys more capability: the orange point has *more* capability than today at *lower* cost. The improvement itself costs something, and where to land on the new curve, the same capability for much less money or much more capability for similar money, is a business choice. Here "capability" is the ability to deliver the required product (for this course, the required security) reliably, predictably and at a known cost. The source link points to an overview of the SSE-CMM, which uses the chart to answer the title: maturity models are the tool for this kind of improvement.

### Slide 13 · CMMI

> - CMM Integration (CMMI) provides
>   - the latest best practices related to
>     - development, maintenance, and acquisition,
>   - it includes
>     - Mechanisms to improve processes and
>     - Criteria for evaluating process capability and process maturity.
> - As of Dec 2005, the SEI reports
>   - 1106 organizations and 4771 projects have reported results from CMMI-based appraisals
> - its predecessor, the software CMM (SW-CMM)
>   - Since 80s - Dec, 2005
>     - 3049 Organizations + 16,540 projects

**Expansion.** **CMMI** (Capability Maturity Model Integration) replaced the separate SEI models for software (SW-CMM), systems engineering and integrated product development with a single integrated framework, first released in 2000 (an acquisition variant followed). It covers the **development**, **maintenance** and **acquisition** of products and services, and it contains both the **improvement mechanisms** (what to do to get better) and the **appraisal criteria** to measure *capability* (per process area) and *maturity* (of the organisation). CMMI offers two representations: *staged* (the five maturity levels of Slide 10) and *continuous* (a capability level for each process area, the approach the SSE-CMM also takes). The numbers show how widespread these models are: by December 2005 about 1,100 organisations had reported CMMI appraisals, and the older SW-CMM had been used in more than 3,000 organisations and 16,000 projects since the late 1980s. Large customers, governments and defence above all, often require a minimum maturity level from their suppliers.

### Slide 14 · CMMI

![Lecture 14, page 14](L14_p14.webp "50% 1006x1118")

**Figure.** A tree, "**CMMI Categories**", with four categories and their process areas:

| Process Management | Project Management | Engineering | Support |
| --- | --- | --- | --- |
| Organizational Process Focus | Project Planning | Requirements Development | Configuration Management |
| Organization Process Definition | Project Monitoring and Control | Requirements Management | Process and Product Quality Assurance |
| Organizational Training | Supplier Agreement Management | Technical Solution | Measurement and Analysis |
| Organizational Process Performance | Integrated Project Management | Product Integration | Organizational Environment for Integration |
| Organizational Innovation and Deployment | Risk Management | Verification | Decision Analysis and Resolution |
| | Integrated Teaming | Validation | Causal Analysis and Resolution |
| | Integrated Supplier Management | | |
| | Quantitative Project Management | | |

**Expansion.** CMMI's **process areas** (25 in this version of the model) are grouped into four categories: **process management** (how the organisation defines, trains for and improves its processes), **project management** (planning, monitoring, suppliers, risk, teams), **engineering** (requirements, technical solution, integration, verification and validation) and **support** (configuration management, quality assurance, measurement, decision and causal analysis). Note what is missing: there is **no security process area**. Security can appear only indirectly, as a requirement, a risk or something to verify, which is the gap that motivates the SSE-CMM (Slide 18) and the safety and security additions (Slides 38-43). Note also the two engineering checks, **verification** (built right) and **validation** (the right product), the assurance activities of Slide 7.

### Slide 15 · Integrated CMM

> - iCMM is widely used in the Federal Aviation Administration (FAA-iCMM)
>   - Provides a single model for enterprise-wide improvement
>   - integrates the following standards and models:
>     - ISO 9001:2000, EIA/IS 731,
>     - Malcolm Baldrige National Quality Award and President's Quality Award criteria,
>     - CMMI-SE/SW/IPPD and
>     - CMMI-A, ISO/IEC TR 15504, ISO/IEC 12207, and ISO/IEC CD 15288.

**Expansion.** The **FAA-iCMM** was built by the US Federal Aviation Administration to avoid satisfying many overlapping standards separately: one model, one improvement effort and one appraisal for the whole enterprise. The standards it merges:

- **ISO 9001:2000**: the general quality-management standard.
- **EIA/IS 731**: the systems-engineering capability model.
- **Malcolm Baldrige** and **President's Quality Award** criteria: US criteria for organisational performance excellence.
- **CMMI-SE/SW/IPPD** (systems engineering, software engineering, integrated product and process development) and **CMMI-A** (acquisition).
- **ISO/IEC TR 15504** (also known as SPICE): process assessment.
- **ISO/IEC 12207**: software life-cycle processes (met in Lecture 12, Slide 2, for its definition of design).
- **ISO/IEC 15288** (here still a committee draft, CD): system life-cycle processes.

Without the integration, an organisation working for the FAA would need a separate programme and appraisal for each of these.

### Slide 16 · Integrated CMM

![Lecture 14, page 16](L14_p16.webp "50% 1111x1110")

**Figure.** A tree, "**iCMM Categories**", with three categories and their process areas:

| Management Processes | Life Cycle Processes | Support Processes |
| --- | --- | --- |
| Integrated Enterprise | Needs | Outsourcing |
| Project Management | Requirements | Alternatives Analysis |
| Risk Management | Design | Measurement and Analysis |
| Supplier Agreement | Design Implementation | Quality Assurance and Management |
| Integrated Teaming | Integration | Configuration Management |
| | Deployment, Transition, | Information Management |
| | Integration | Process Definition |
| | Operation and Support | Process Improvement |
| | Evaluation | Training |
| | | Innovation |

The "Deployment, Transition," box is cut short in the figure, and "Integration" appears twice in the life-cycle column.

**Expansion.** The iCMM groups its process areas by role rather than by CMMI's four categories: **management** processes (enterprise, project, risk, suppliers, teams), **life-cycle** processes, which follow a product from the stakeholders' *needs* through requirements, design, implementation, integration, deployment and operation to evaluation, and **support** processes (outsourcing, alternatives analysis, measurement, quality, configuration and information management, process definition and improvement, training, innovation). The truncated box is "Deployment, Transition, and Disposal": the life cycle covers the system until it is retired. As in CMMI, security is not a process area of its own.

### Slide 17 · Trusted CMM

> - Trusted CMM
>   - Early 1990 - Trusted Software Methodology (TSM)
>   - TSM defines trust levels
>     - *Low* emphasizes resistance to unintentional vulnerabilities
>     - *High* adding processes to counter malicious developers
>   - TSM was later harmonized with CMM
>     - Not much in use

**Expansion.** The **Trusted Software Methodology (TSM)**, developed in the early 1990s for US defence programmes, defined a scale of **trust levels**, each requiring more development practices than the one below. The two ends of the scale address two different threats:

- **Low trust levels** protect against **unintentional vulnerabilities**: honest mistakes such as the buffer overflows and format string bugs of Lectures 3-4, caught by reviews, testing and configuration control.
- **High trust levels** add processes against **malicious developers**: an insider who deliberately plants a backdoor (the Trusting Trust scenario of Lecture 2). Countering them takes separation of duties, independent review of every change, strict configuration management and traceability of who wrote what.

TSM was later merged with the CMM into the **Trusted CMM**, but, as the slide notes, it is **not much in use**. Its value is the idea that "how far do we trust our own developers" can be built into a process model.

## SSE-CMM (pages 18-31)

### Slide 18 · Systems Security Engineering CMM

> - The SSE-CMM
>   - To improve and assess the **security engineering capability** of an organization
>   - provides a comprehensive framework for
>     - evaluating security engineering practices against the generally accepted security engineering principles.
>   - provides a way to
>     - measure and improve performance in the application of security engineering principles.

**Expansion.** The **SSE-CMM** is the capability maturity model for **security engineering**. It was started in 1993 on an initiative of the US National Security Agency, developed with government and industry partners, and later maintained by the International Systems Security Engineering Association (ISSEA). It does for security what CMMI does for software: it lists the practices that a capable security engineering organisation performs and gives a scale to rate them. The verbs of the slide are its uses: **evaluate** an organisation's practices against generally accepted security engineering principles (an appraisal, Slides 34-36), and **measure and improve** how well the principles are applied (process improvement, Slide 33). It applies to whoever does security engineering: developers of secure products, integrators of secure systems, and providers of security services such as evaluation or operation.

### Slide 19 · SSE-CMM: ISO/IEC 21827

> - Purpose for SSE-CMM
>   - To fill the lack of a comprehensive framework for evaluating security engineering practices against the principles
> - The SSE-CMM also
>   - describes the essential characteristics of an organization's security engineering processes.
>
> The SSE-CMM is now ISO/IEC 21827 standard (version 3 available)

**Expansion.** Before the SSE-CMM, security was judged on the **product** (evaluations such as the Orange Book or the Common Criteria, which check a finished product against security requirements); nothing evaluated the **process** used to build it. The SSE-CMM fills that gap and, like every CMM (Slide 10), describes the **essential characteristics** of good security engineering processes, not a procedure. It was adopted as the international standard **ISO/IEC 21827** (first edition 2002, revised in 2008); version 3.0 of the model, the one mentioned on the slide, was published in 2003. Being an ISO standard is what makes it usable in contracts and certifications between organisations.

### Slide 20 · SSE-CMM

![Lecture 14, page 20](L14_p20.webp "49% 876x1080")

**Figure.** A tree, "**SSE-CMM Categories**", with two branches:

- **Project and Organizational Process**: Ensure Quality; Manage Configuration; Manage Project Risk; Monitor and Control Technical Effort; Plan Technical Effort; Define Organization's Systems Engineering Process; Improve Organization's Systems Engineering Process; Manage Product Line Evolution; Manage Systems Engineering Support Environment; Provide Ongoing Skills and Knowledge; Coordinate with Suppliers.
- **Security Engineering Process Areas**, in three groups:
  - **Engineering Process**: Specify Security Needs; Provide Security Input; Monitor Security Posture; Administer Security Controls; Coordinate Security.
  - **Assurance Process**: Verify and Validate Security; Build Assurance Argument.
  - **Risk Process**: Assess Threat; Assess Vulnerability; Assess Impact; Assess Security Risk.

**Expansion.** The SSE-CMM's 22 **process areas** (Slides 26-28) in two halves of eleven. The **project and organisational** process areas are ordinary systems-engineering management (quality, configuration, risk, planning, process definition and improvement, training, suppliers), adapted from the systems engineering CMM. The **security engineering** process areas are the core of the model and are organised into the three processes of the next slides: **risk** (decide what to protect against: Slide 22), **engineering** (decide and build the security: Slide 23) and **assurance** (show that it works: Slide 24). They match Slide 6: engineering, assurance and risk are three of the four focus areas of a secure SDLC, and the fourth, management, is the other half of the tree.

### Slide 21 · Security Engineering Process

![Lecture 14, page 21](L14_p21.webp "50% 1400x768")

**Figure.** Three yellow boxes in a triangle: **Engineering Process** at the top, under a computer icon labelled "**Product, System, or Service**"; **Assurance Process** at the bottom left; **Risk Process** at the bottom right. Curved red double-headed arrows join each pair of boxes. Next to the Assurance Process a document icon is labelled "**Assurance Argument**"; next to the Risk Process, a document icon is labelled "**Risk Information**".

**Expansion.** The SSE-CMM sees security engineering as **three interacting processes**:

- The **risk process** identifies and prioritises the dangers to the product or system and produces **risk information** (Slide 22).
- The **engineering process** works with the other engineering disciplines to decide and implement solutions to the risks, inside the actual **product, system or service** (Slide 23).
- The **assurance process** establishes confidence that the solutions really work and produces an **assurance argument** with its evidence (Slide 24).

The arrows go both ways because the three feed each other continuously: risk information drives what engineering builds, engineering choices create new risks to assess, and assurance checks both and reports problems back. Security is not a phase but this ongoing loop, the same idea as the SDL's security activities in every phase (Lecture 13).

### Slide 22 · Security Risk Process

![Lecture 14, page 22](L14_p22.webp "50% 1400x767")

**Figure.** Three yellow process-area boxes on the left, each with an arrow to a document icon: **PA04: Assess Threat** → "**Threat Information**"; **PA05: Assess Vulnerability** → "**Vulnerability Information**"; **PA02: Assess Impact** → "**Impact Information**". Arrows from the three documents converge on **PA03: Assess Security Risk**, which outputs a document labelled "**Risk Information**".

**Expansion.** Risk is computed from three ingredients, each assessed by its own process area: the **threats** (who could attack, with which capabilities and motivation), the **vulnerabilities** (which weaknesses they could exploit) and the **impact** (what the organisation would lose if they succeed). **Assess Security Risk** combines them: there is a risk only where a threat can exploit a vulnerability with a significant impact, the threat-vulnerability-asset relationship of Lecture 1, Slides 48-49. The resulting **risk information** ranks the risks and is the input of the engineering process (next slide), which decides which risks to mitigate: the cost-based risk analysis of Slide 8.

### Slide 23 · Security is part of Engineering

![Lecture 14, page 23](L14_p23.webp "50% 1400x756")

**Figure.** Five yellow process-area boxes connected in a loop through four document icons: **PA10: Specify Security Needs** (top left) → "**Requirements, Policy, etc...**" → **PA09: Provide Security Input** (bottom left) → "**Solutions, Guidance, etc...**" → **PA01: Administer Security Controls** (bottom right) → "**Configuration Information**" → **PA08: Monitor Security Posture** (top right) → "**Risk Information**" → back to PA10. **PA07: Coordinate Security** sits in the middle of the loop.

**Expansion.** The **engineering process**, where security is designed and operated, as a cycle of process areas:

1. **Specify Security Needs** turns risk information, laws and policies into security **requirements**.
2. **Provide Security Input** gives designers and implementers **solutions and guidance** that meet those requirements (alternatives, trade-offs, secure design advice).
3. **Administer Security Controls** installs, configures and operates the chosen controls, producing **configuration information**.
4. **Monitor Security Posture** watches the system in operation (logs, incidents, new vulnerabilities, changes) and produces new **risk information**, which feeds back into the security needs.
5. **Coordinate Security**, in the centre, makes all the groups involved (engineering teams, the security team, external parties) communicate and agree. This is the slide title's point: security is **part of engineering**, done together with the other engineering activities, not in isolation.

The loop never ends: monitoring after deployment restarts the cycle, just as the response phase of the SDL feeds back into requirements (Lecture 13, Slides 15 and 25).

### Slide 24 · Assurance

![Lecture 14, page 24](L14_p24.webp "50% 1400x584")

**Figure.** **PA11: Verify and Validate Security** → a document "**Verification and Validation Evidence**"; a stack of boxes "**Many other PAs**" → a document "**Evidence**". Both documents feed **PA06: Build Assurance Argument**, which produces a document "**Assurance Argument**".

**Expansion.** **Assurance** is the degree of confidence that the security needs are met, and the SSE-CMM builds it from **evidence**. **Verify and Validate Security** checks the solutions against the requirements (verification) and against the real operational needs (validation), and **many other process areas** also leave evidence behind (risk assessments, design documents, configuration records, test results). **Build Assurance Argument** assembles this evidence into an **assurance argument**: a structured case that explains, claim by claim, why the system can be trusted to meet its security objectives. This is how process work becomes something a customer or an evaluator can check (Slide 37).

### Slide 25 · SSE-CMM dimensions

> Practices (generic) that indicate Process Management & Institutionalization Capability

![Lecture 14, page 25](L14_p25.webp "50% 1102x838")

**Figure.** A grid with a vertical axis "**Capability Dimension (Generic Practices)**" and a horizontal axis "**Domain Dimension (Base Practices)**". One column and one row are highlighted in yellow and cross in a red cell. A callout pointing at the yellow column reads "**Generic Practice 2.1.1 Allocate Resources**"; a callout pointing at the yellow row reads "**Base Practice 05.02 Identify System Security Vulnerabilities**".

**Expansion.** The SSE-CMM has **two dimensions**:

- The **domain dimension** holds the **base practices**: *what* security engineering consists of (identify vulnerabilities, assess threats, specify security needs, ...), grouped into process areas (Slides 26-28).
- The **capability dimension** holds the **generic practices**: *how well* any process is managed and institutionalised (allocate resources, plan, track, verify, standardise, measure, improve), grouped into common features and capability levels (Slides 29-31). As the caption says, they indicate process management and institutionalisation capability, and they are "generic" because they apply to every process area.

Every cell of the grid pairs a base practice with a generic practice. The red cell is the example: generic practice 2.1.1, *Allocate Resources* (a level-2 practice), applied to base practice 05.02, *Identify System Security Vulnerabilities* (in PA05, Assess Vulnerability), asks whether the organisation allocates adequate resources (people, time, tools) to identifying vulnerabilities. Appraising the whole grid shows *how capable* the organisation is at each part of security engineering.

### Slide 26 · SSE-CMM

> - 129 base practices organized into 22 process areas
>   - 61 of these, organized in 11 process areas, cover all major areas of security engineering
>   - Remaining relates to project and organization domains
> - Base practice
>   - Applies across the life cycle of the enterprise
>   - Does not overlap with other base practices
>   - Represents a "best practice" of the security community
>   - Does not simply reflect a state of the art technique
>   - Is applicable using multiple methods in multiple business context
>   - Does not specify a particular method or tool

**Expansion.** The domain dimension in numbers: **129 base practices** in **22 process areas**. 61 of them, in the 11 security engineering process areas (PA01-PA11), cover security engineering; the other 68, in the 11 project and organisational process areas (PA12-PA22), cover management. The properties of a base practice explain why the model stays valid over time: it is **essential** (it applies throughout the enterprise life cycle), **distinct** (it does not overlap with other practices), **proven** (an established best practice of the security community, not the latest research technique) and **method-independent** (it says *what* must be done, for example "identify system security vulnerabilities", never *which* tool or method to use, in line with "no operational guidance" on Slide 10). A practice that named a specific scanner would be obsolete within a few years; a practice that requires vulnerabilities to be identified will not.

### Slide 27 · Process Area

> - Assembles related activities in one area for ease of use
> - Relates to valuable security engineering services
> - Applies across the life cycle of the enterprise
> - Can be implemented in multiple organization and product contexts
> - Can be improved as a distinct process
> - Can be improved by a group with similar interests in the process
> - Includes all base practices that are required to meet the goals of the process area

**Expansion.** A **process area** is a cluster of related base practices that together achieve a set of **goals** (for example, the goal of PA05 *Assess Vulnerability* is an understanding of the system's security vulnerabilities). The grouping makes the model usable: a process area corresponds to a recognisable security engineering service, it can be applied in different organisations and products, and, crucially, it can be **appraised and improved on its own** by the people who perform it (the vulnerability-assessment team can improve PA05 without waiting for the rest of the organisation). The last bullet is the completeness rule: performing all the base practices of a process area is what it takes to meet its goals.

### Slide 28 · Process Areas

> **Process Areas related to Security Engineering process areas**
>
> **Process Areas related to project and Organizational practices**

![Lecture 14, page 28](L14_p28.webp "50% 1400x481")

**Figure.** Under the two headings, the two lists of process areas:

| Security engineering process areas | Project and organisational process areas |
| --- | --- |
| PA01 Administer Security Controls | PA12 - Ensure Quality |
| PA02 Assess Impact | PA13 - Manage Configuration |
| PA03 Assess Security Risk | PA14 - Manage Project Risk |
| PA04 Assess Threat | PA15 - Monitor and Control Technical Effort |
| PA05 Assess Vulnerability | PA16 - Plan Technical Effort |
| PA06 Build Assurance Argument | PA17 - Define Organization's Systems Engineering Process |
| PA07 Coordinate Security | PA18 - Improve Organization's Systems Engineering Process |
| PA08 Monitor Security Posture | PA19 - Manage Product Line Evolution |
| PA09 Provide Security Input | PA20 - Manage Systems Engineering Support Environment |
| PA10 Specify Security Needs | PA21 - Provide Ongoing Skills and Knowledge |
| PA11 Verify and Validate Security | PA22 - Coordinate with Suppliers |

**Expansion.** The 22 process areas with their official numbers, used in the rest of the lecture. The security engineering ones are numbered in alphabetical order, not in process order; grouped by process (Slides 21-24) they are: **risk** PA02, PA03, PA04, PA05; **engineering** PA01, PA07, PA08, PA09, PA10; **assurance** PA06, PA11. A useful exercise is to place a concrete activity in its process area: running a vulnerability scanner is PA05; analysing who could attack and how is PA04 (with PA03 for the overall risk); defining security requirements is PA10; configuring a firewall is PA01; reviewing logs and incidents is PA08; testing that the controls meet the requirements is PA11; writing the security case for a certification is PA06.

### Slide 29 · Generic Process Areas

> - Activities that apply to all processes
> - They are used during
>   - Measurement and institutionalization
> - Capability levels
>   - Organize common features
>   - Ordered according to maturity

**Expansion.** The capability dimension (Slide 25) has three layers: **generic practices** (activities that apply to every process area, such as "allocate resources" or "track performance"), grouped into **common features** (for example 2.1 Planned Performance, 2.4 Tracking Performance), grouped into **capability levels** ordered by maturity (Slides 30-31). They are used in **measurement** (an appraisal checks which generic practices are performed for each process area, which gives its capability level) and in **institutionalisation**: making a process a stable, documented, resourced and enforced part of how the organisation works, so that it does not depend on particular people and survives staff turnover.

### Slide 30 · Capability Levels

![Lecture 14, page 30](L14_p30.webp "50% 1400x781")

**Figure.** Nested ellipses, from the innermost: **1 Performed Informally** (black), **2 Planned & Tracked**, **3 Well Defined**, **4 Quantitatively Controlled**, **5 Continuously improving** (the outermost); **0 Not Performed** is written outside them. Arrows lead from the levels to the common features listed below them:

| Level | Common features |
| --- | --- |
| 0 Not Performed | |
| 1 Performed Informally | Base Practices Performed |
| 2 Planned & Tracked | Committing to perform; Planning performance; Disciplined performance; Tracking performance; Verifying performance |
| 3 Well Defined | Defining a standard process; Tailoring standard process; Using data; Perform a defined process |
| 4 Quantitatively Controlled | Establishing measurable quality goals; Determining process capability to achieve goals; Objectively managing performance |
| 5 Continuously improving | Establishing quantitative process goals; Improving process effectiveness |

**Expansion.** The six capability levels of an SSE-CMM process area. Each level includes everything in the levels inside it, as the nesting shows:

- **0 Not Performed**: the base practices are not done.
- **1 Performed Informally**: the base practices are done, but ad hoc, depending on individual effort: the work gets done, but nobody can say how it will be done next time.
- **2 Planned and Tracked**: the work is planned, performed according to procedures (disciplined), and its results are verified and tracked, so management can see whether it is on course.
- **3 Well Defined**: the organisation has a **standard process**, tailored to each project and based on data from past projects, so every team works in the same documented way.
- **4 Quantitatively Controlled**: measurable quality goals are set and the process is managed through **measurements** (for example vulnerabilities found per review hour, time to fix), so its performance is predictable.
- **5 Continuously Improving**: quantitative goals for process effectiveness are set and the process is improved continuously on the basis of the measurements.

It is Lecture 13's demand for a repeatable, measurable process (Slides 5-6) turned into a scale: repeatable at levels 2-3, measured at level 4, improving at level 5.

### Slide 31 · Summary chart

![Lecture 14, page 31](L14_p31.webp "50% 1400x1003")

**Figure.** An empty appraisal grid. The rows are the **Common Features**, from the bottom: 1.1 Base Practices Are Performed; 2.1 Planned Performance; 2.2 Disciplined Performance; 2.3 Verifying Performance; 2.4 Tracking Performance; 3.1 Defining a Standard Process; 3.2 Perform the Defined Process; 3.3 Coordinate Practices; 4.1 Establish Meas. Quality Goals; 4.2 Objectively Managing Perf.; 5.1 Improving Org. Capability; 5.2 Improving Proc. Effectiveness. The columns are the 22 **Process Areas**, written vertically: under "**Security Engineering Process Areas**", PA01 - Administer Security Controls to PA11 - Verify and Validate Security; under "**Project and Organizational Process Areas**", PA12 - Ensure Quality to PA22 - Coordinate with Suppliers, with the names of Slide 28, some abbreviated (e.g., "PA17 - Define Org. Systems Eng. Process", "PA20 - Manage Systems Eng. Support Env.").

**Expansion.** The whole SSE-CMM on one page: the **domain dimension** across (22 process areas) and the **capability dimension** upwards (12 common features, grouped into levels 1-5). An appraisal fills in the grid, marking for each process area which common features are satisfied. A process area's **capability level** is the highest level whose common features are all satisfied, together with those of every lower level. The filled-in result is the capability profile of Slide 36.

## Using the SSE-CMM (pages 32-37)

### Slide 32 · Using SSE-CMM

> - Can be used in one of the three ways
>   - Process improvement
>     - Facilitates understanding of the level of security engineering process capability
>   - Capability evaluation
>     - Allows consumer organization to understand the security engineering process capability of provider
>   - Assurance
>     - Increases the confidence that product/system/service is trustworthy

**Expansion.** The three uses differ in **who** applies the model and **why**:

- **Process improvement** is done by an organisation *on itself*: it measures its current capability level in each process area, decides the target levels and improves (Slide 33).
- **Capability evaluation** is done by a *customer* (or on its behalf) on a *supplier*: before buying a product or outsourcing development, the customer checks whether the supplier's security engineering is capable enough (Slides 34-36). This was the original reason for CMMs: the US government wanted to select contractors by process capability, not only by price.
- **Assurance** concerns the *product*: evidence that it was built by a capable process increases the confidence that it is trustworthy (Slide 37).

### Slide 33 · Process Improvement

![Lecture 14, page 33](L14_p33.webp "50% 1400x788")

**Figure.** A circular arrow made of segments, starting from "**Stimulus for Change**" and going through five labelled phases: **Initiating** (Set Context, Build Sponsorship, Charter Infrastructure), **Diagnosing** (Characterize Current & Desired States, Develop Recommendations), **Establishing** (Set Priorities, Develop Approach, Plan Actions), **Acting** (Create Solution, Pilot/Test Solution, Refine Solution, Implement Solution) and **Learning** (Analyze and Validate, Propose Future Actions); the arrowhead after "Propose Future Actions" leads back into the cycle.

**Expansion.** This is the SEI's **IDEAL** model of process improvement, named after its five phases, the improvement cycle used with the SSE-CMM:

1. **Initiating**: a stimulus (an incident, a lost contract, a new regulation) starts the effort; set its context and goals, obtain management **sponsorship** and set up the infrastructure (who runs the programme).
2. **Diagnosing**: appraise the **current** state (for example with the SSE-CMM), define the **desired** state and recommend how to close the gap.
3. **Establishing**: set priorities, choose the approach and plan the actions.
4. **Acting**: create the solution (new procedures, tools, training), **pilot** it on a project, refine it and roll it out.
5. **Learning**: analyse the results, check that the goals were met and propose the next improvements; then the cycle starts again.

It is the plan-do-check-act cycle of quality management applied to processes: improvement is continuous, never a one-off project.

### Slide 34 · Capability Evaluation

> - No need to use any particular appraisal method developed if needed
> - SSE-CMM Appraisal (SSAM) method has been developed if needed
> - SSAM purpose
>   - Obtain the baseline or benchmark of actual practice related to security engineering within the organization or project
>   - Create or support momentum for improvement within multiple levels of the organizational structure

**Expansion.** The SSE-CMM can be used with any appraisal method, but a dedicated one exists, the **SSE-CMM Appraisal Method (SSAM)**. It has two purposes: to produce a **baseline** (where we are now, measured objectively: the "Diagnosing" step of the IDEAL cycle) and to create **momentum**: an appraisal involves people at every level, from practitioners to management, and its results make the need for improvement visible and shared.

### Slide 35 · SSAM Overview

> - Planning phase
>   - Establish appraisal framework
> - Preparation phase
>   - Prepare team for onsite phase through information gathering (questionnaire)
>   - Preliminary data analysis indicate what to look for / ask for
> - Onsite phase
>   - Data gathering and validation with the practitioner
>   - interviews
> - Post-appraisal
>   - Present final data analysis to the sponsor

**Expansion.** An SSAM appraisal has four phases:

1. **Planning**: agree with the sponsor on scope, goals, the appraisal team, the schedule and the process areas to appraise.
2. **Preparation**: train the appraisal team and collect information in advance with **questionnaires** filled in by the organisation; a preliminary analysis of the answers tells the team what to look for and what to ask on site.
3. **On site**: **interviews** with the practitioners (the people who actually do the work, not only managers) and review of the evidence, to gather data and **validate** the questionnaire answers: what people say they do must match what they actually do.
4. **Post-appraisal**: the final analysis, a capability profile (Slide 36) with strengths, weaknesses and recommendations, is presented to the **sponsor**.

### Slide 36 · Capability Evaluation

![Lecture 14, page 36](L14_p36.webp "50% 1400x605")

**Figure.** A **capability profile**: for each of the 22 process areas (columns PA01-PA22, under "**Security Engineering Process Areas**" and "**Project and Organizational Process Areas**"), red cells fill the column from **Level 1** up to the level reached (rows **Level 1** to **Level 5**, labelled "Capability Levels"):

| Level reached | Process areas |
| --- | --- |
| none (no red cell) | PA04, PA10, PA11 |
| Level 1 | PA02, PA05, PA07, PA12, PA13, PA17, PA18, PA19, PA21, PA22 |
| Level 2 | PA01, PA06, PA09, PA14, PA15, PA16 |
| Level 3 | PA03, PA08, PA20 |
| Levels 4-5 | none |

**Expansion.** The result of an appraisal is not a single number but a **profile**, one capability level per process area (the *continuous* representation of Slide 13). The profile shows where to invest. In this example the organisation assesses security risk (PA03) and monitors its security posture (PA08) at a well-defined level 3, but it **does not perform** threat assessment (PA04), security needs specification (PA10) or security verification and validation (PA11) at all: its risk assessment rests on no threat analysis, its security requirements are not specified, and nothing checks that the controls meet them. A customer evaluating this supplier would see the gaps at once, and an improvement programme would start from exactly those three process areas.

### Slide 37 · Assurance

> - A mature organization
>   - more likely to create a product or system with appropriate assurance
> - Process evidence
>   - to support claims for the product trustworthiness
> - It is conceivable that
>   - an immature organization could produce high assurance product.

**Expansion.** The relation between process and product, stated carefully: a mature organisation is **more likely** to produce a trustworthy product, and the records of its process (plans, reviews, test results, the assurance argument of Slide 24) are **evidence** that supports the product's claims. But process maturity is neither necessary nor sufficient: an **immature** organisation could, by talent or luck, produce a high-assurance product (it just could not show it, nor repeat it), and a mature one can still ship flaws (Slide 4, "no guarantees the product is bug free"). This is why assurance combines **process** evidence (SSE-CMM) with **product** evaluation (testing, analysis, certifications such as the Common Criteria).

## Safety and security additions (pages 38-43)

### Slide 38 · CMMI/iCMM/SSE-CMM

> - CMMI / iCMM used by more organizations than the SSE-CMM
>   - Because of the integration of process disciplines and coverage of enterprise issues,
> - One weakness CMMI and iCMM
>   - have gaps in their coverage of safety and security.
> - Joint effort sponsored by FAA and the DoD
>   - to identify best safety and security practices for use in combination with the iCMM and the CMMI.

**Expansion.** In practice CMMI and iCMM are far more widespread than the SSE-CMM, because they cover the whole enterprise (software, systems, acquisition, management) in one model, while the SSE-CMM covers security engineering only. But they have little to say about **safety** (no harm to people or the environment, essential in aviation) and **security**. Rather than asking organisations to adopt yet another model, the FAA and the US Department of Defense identified a set of **safety and security practices** to be used *on top of* CMMI or iCMM (published in 2004 as the *Safety and Security Extension for Integrated Capability Maturity Models*): 4 goals and 16 practices, on the next slides. Safety and security are treated together because they share most of the engineering: hazards and threats are both analysed as risks, and both need requirements, assurance arguments and independent verification.

### Slide 39 · Safety/Security additions

> - The proposed Safety and Security additions include the following four goals:
>   - Goal 1 - An infrastructure for safety and security is established and maintained.
>   - Goal 2 - Safety and security risks are identified and managed.
>   - Goal 3 - Safety and security requirements are satisfied.
>   - Goal 4 - Activities and products are managed to achieve safety and security requirements and objectives.

**Expansion.** The four goals form a sequence, marked on the slide by the underlined key words *infrastructure*, *risks*, *requirements* and *managed*: (1) set up the organisational **infrastructure** (awareness, competent people, a suitable environment, incident handling, continuity); (2) identify and manage the **risks**; (3) turn them into **requirements** and make sure the product satisfies them, with evidence; (4) **manage** the project's activities and products (plans, suppliers, monitoring) so that the objectives are actually achieved. They mirror the four focus areas of Slide 6: infrastructure and management (Goals 1 and 4), risk (Goal 2), engineering and assurance (Goal 3).

### Slide 40 · Goal 1 related practices

> 1. Ensure safety and security awareness, guidance, and competency.
> 2. Establish and maintain a qualified work environment that meets safety and security needs.
> 3. Ensure integrity of information by providing for its storage and protection, and controlling access and distribution of information.
> 4. Monitor, report and analyze safety and security incidents and identify potential corrective actions.
> 5. Plan and provide for continuity of activities with contingencies for threats and hazards to operations and the infrastructure
>
> Goal 1 - An infrastructure for safety and security is established and maintained.

**Expansion.** The infrastructure practices, which the organisation needs before any project can be safe and secure:

1. **Awareness and competency**: people know the safety and security policies and risks and are trained for their role (the "engineer education" pillar of Lecture 13, Slide 6).
2. **Qualified work environment**: facilities, tools and development environments that are themselves secure; a compromised build server or compiler undermines everything (the Trusting Trust lesson of Lecture 2).
3. **Integrity of information**: protected storage, access control and controlled distribution of the organisation's information, including designs, source code and project data.
4. **Incident management**: incidents are monitored, reported and analysed, and corrective actions identified (the response phase of Lecture 13).
5. **Continuity**: contingency plans so that activities continue despite threats and hazards (business continuity and disaster recovery).

### Slide 41 · Goal 2 related practices

> 1. Identify risks and sources of risks attributable to **vulnerabilities**, security **threats**, and safety **hazards**.
> 2. For each risk associated with safety or security, determine the causal factors, estimate the consequence and likelihood of an occurrence, and determine relative priority.
> 3. For each risk associated with safety or security, determine, implement and monitor the risk mitigation plan to achieve an acceptable level of risk.
>
> Goal 2 - Safety and security risks are identified and managed.

**Expansion.** Classic risk management in three steps: **identify** the risks and their sources, which for security are threats exploiting vulnerabilities and for safety are hazards (Slide 22; Lecture 1, Slide 49); **analyse** each one, its causes, its **consequence** (impact) and its **likelihood**, which together give its priority (risk ≈ likelihood × impact is the usual estimate); and **mitigate**: plan, implement and monitor countermeasures until the residual risk is **acceptable**. "Acceptable" is the realistic target: risk can be reduced, rarely eliminated (Lecture 2, Slide 17).

### Slide 42 · Goal 3 related practices

> 1. Identify and document applicable regulatory requirements, laws, standards, policies, and acceptable levels of safety and security.
> 2. Establish and maintain safety and security requirements, including integrity levels, and design the product or service to meet them.
> 3. Objectively verify and validate work and delivered products and services to assure safety and security requirements achieved and fulfill intended use.
> 4. Establish and maintain safety and security assurance arguments and supporting evidence throughout the lifecycle.
>
> Goal 3 - Safety and security requirements are satisfied.

**Expansion.** The engineering and assurance core, the same chain as the SSE-CMM's engineering and assurance processes (Slides 23-24):

1. Collect the **external constraints**: regulations, laws, standards, policies, and the level of risk that is acceptable (for example data-protection law or aviation safety standards).
2. Write the **safety and security requirements**, with **integrity levels** (how critical each component is: the more critical, the more rigorous its development and verification), and design the product to meet them.
3. **Verify and validate objectively**, that is independently of the developers, that the requirements are met and the product fulfils its intended use (PA11 of the SSE-CMM).
4. Maintain an **assurance argument** with its evidence for the whole life cycle (PA06), updating it whenever the product changes.

### Slide 43 · Goal 4 related practices

> 1. Establish and maintain independent reporting of safety and security status and issues.
> 2. Establish and maintain a plan to achieve safety and security requirements and objectives.
> 3. Select and manage products and suppliers using safety and security criteria.
> 4. Measure, monitor and review safety and security activities against plans, control products, take corrective action, and improve processes.
>
> Goal 4 - Activities and products are managed to achieve safety and security requirements and objectives.

**Expansion.** The management practices:

1. **Independent reporting**: safety and security status reaches management through a channel independent of the project, so that problems are not hidden under schedule pressure (compare the central security team of Microsoft's SDL, Lecture 13, Slide 27).
2. A **plan** for the safety and security activities, like for any other project activity.
3. **Suppliers and products** (third-party components, libraries, outsourced development) are chosen and managed with safety and security criteria: the supply chain is part of the attack surface.
4. **Measure and control**: compare the activities with the plan, correct deviations and improve the process (the metrics-and-accountability pillar of Lecture 13, Slide 6).

## Team Software Process for secure software (pages 44-50)

### Slide 44 · Team Software Process for Secure SW/Dev

> - TSP
>   - provides a framework, a set of processes, and disciplined methods for applying software engineering principles at the team and individual level
> - TSP for Secure Software Development (TSP-Secure)
>   - focus more directly on the security of software applications.

**Expansion.** The **Team Software Process (TSP)**, developed at the SEI by Watts Humphrey (whose work also laid the foundations of the original CMM), is a different kind of model from the ones above: an **operational method** that tells teams and individual engineers *how* to work (planning, estimating, measuring their own defects, reviewing), exactly the "operational guidance" that the CMMs deliberately do not give (Slide 10). It builds on the *Personal Software Process* (PSP), in which each developer measures their own time and defects. **TSP-Secure** extends TSP with security practices, so that security is planned, built and measured by the team itself.

### Slide 45 · Team Software Process for Secure SW/Dev

> - TSP-Secure addresses secure software development (three ways).
>   1. Secure software is not built by accident,
>      - Plan: TSP-Secure addresses planning for security.
>      - Self-direct: Since schedule pressures and people issues get in the way of implementing best practices, TSP-Secure helps to build self-directed development teams, and then put these teams in charge of their own work.
>   2. Since security and quality are closely related,
>      - TSP-Secure helps manage quality throughout the product development life cycle.
>   3. Since people building secure software must have an awareness of software security issues,
>      - TSP-Secure includes security awareness training for developers.

**Expansion.** The three ways, each answering a common cause of insecure software:

1. **Security has to be planned**, not hoped for: security tasks get time and resources in the plan like any other work. And since deadlines and organisational pressure are what usually push good practices aside, TSP hands the plan to **self-directed teams** that own their work and commitments, so they can defend the time security needs (Slides 46-47).
2. **Security follows quality**: most vulnerabilities are defects (Slide 48), so managing quality, measuring and removing defects in every phase, also removes vulnerabilities.
3. **Awareness**: developers cannot avoid vulnerabilities they do not know about, so TSP-Secure trains them (the "knowledge is crucial" point of Lecture 1, Slide 43, and the purpose of this whole course).

### Slide 46 · TSP-Secure

> - Teams
>   - Develop their own plans
>   - Make their own commitments
>   - Track and manage their own work
>   - Take corrective action when needed

**Expansion.** The self-directed team of Slide 45 in four verbs. Engineers who make their own plans and commitments are realistic about the effort (security work included) and feel responsible for meeting them; tracking their own work with data (time, size, defects) lets them see early when they fall behind or when quality drops, and correct it themselves, instead of cutting the review or the security test at the last minute.

### Slide 47 · TSP-Secure

> - Initial planning - "project launch" (3-4 days)
>   - Tasks include
>     - identifying security risks,
>     - eliciting and defining security requirement, secure design, and code reviews,
>     - use of static analysis tools, unit tests, and Fuzz testing.
> - Next, the team executes its plan, and ensures all security related activities are taking place.
>   - Security status is presented and discussed during every management status briefing.

**Expansion.** A TSP project starts with a **launch**: a workshop of a few days in which the team, with management, sets goals, roles and a detailed plan. In TSP-Secure the plan explicitly contains the security tasks: **identifying security risks** (threat modelling, Lecture 12), **security requirements**, **secure design**, **code reviews**, **static analysis** (Lectures 6-7), **unit tests** and **fuzz testing** (Lecture 6, Slide 25), the same activities as the SDL (Lecture 13, Slide 22). During execution, security status is reported at **every** management briefing, so it stays visible next to schedule and cost instead of surfacing only at the end.

### Slide 48 · TSP-Secure

> - Basis
>   - Defective software is seldom secure
>   - Defective software is not inevitable
>     - Consider cost of reducing defects
>     - Manage defects throughout the lifecycle
>   - Defects are leading cause of vulnerabilities
>     - Use multiple defect removal points in the SD
>       - Defect filters

**Expansion.** The reasoning behind TSP-Secure: **most vulnerabilities are ordinary defects** (an unchecked length is a bug before it is a buffer overflow, Lectures 3-4), so software full of defects is almost certainly insecure, and reducing defects reduces vulnerabilities. Defects are **not inevitable**: they can be managed like any other quantity, by measuring where they are injected and where they are removed, and by weighing the cost of removing them early (cheap) against late (expensive, Lecture 13, Slide 16). The method is to place **several removal points** along software development (the "SD" of the slide): reviews, inspections, analysis and tests, each acting as a **filter** that catches part of the defects that got through the previous ones (Slide 50).

### Slide 49 · TSP-Secure

> - Key questions in managing defects
>   - What type of defects lead to security vulnerabilities?
>   - Where in the software development life cycle should defects be measured?
>   - What work products should be examined for defects?
>   - What tools and methods should be used to measure the defects?
>   - How many defects can be removed at each step?
>   - How many estimated defects remain after each removal step?
> - TSP-Secure includes training for developers, managers, and other team members.

**Expansion.** The questions turn defect management into engineering with numbers: *which* defect types become vulnerabilities (catalogues such as CWE answer this), *where* to measure (in every phase, not only in testing), *which work products* to inspect (requirements and designs as well as code), *how* to find the defects (reviews, static and dynamic analysis, testing), and the **yield** of each step: what fraction of the defects present it removes, and therefore how many remain in the product after it. These estimates tell the team when quality is good enough to ship. The training covers **everyone**: managers too must understand why review time is not wasted time.

### Slide 50 · TSP-Secure

![Lecture 14, page 50](L14_p50.webp "50% 1400x961")

**Figure.** Three yellow boxes in a descending staircase: **Requirements Activities**, **Design Activities**, **Implementation Activities**, each with a magenta arrow coming in from the left. After each box a downward arrow passes through a funnel-shaped filter marked "**%**", which diverts part of the flow with a green arrow to the right and passes the rest on to the next box. The green notes read: "**Some % of vuls injected during requirements activities are removed during requirements analysis, threat modeling, or developing abuse cases**"; "**Some % of vuls injected during requirements and design activities are removed during design reviews and verification**"; "**Some % of vuls injected during requirements, design, and coding are removed during code reviews, dynamic analysis, static analysis, and testing**". After the last filter a red arrow points down to the red note: "**Some % of vuls escape all removal filters and are released with the software.**"

**Expansion.** The **defect-filter model** of Slide 48. Every phase **injects** vulnerabilities (the magenta arrows: new requirements, design decisions and code bring new mistakes) and is followed by a **removal filter** that catches only a percentage of the vulnerabilities present: requirements analysis, threat modelling and abuse cases after requirements; design reviews and verification after design; code reviews, static and dynamic analysis and testing after coding. Each filter also sees the vulnerabilities that escaped the earlier ones. Two consequences follow: no single filter is enough, so a secure process needs **several** of them (defence in depth applied to the development process); and **some vulnerabilities always escape** into the released software, so the response phase is unavoidable (Lecture 13, Slide 25). With the yields measured (Slide 49), the model even estimates how many vulnerabilities are left in the shipped product. It sums up the lecture: security comes from a measured process that removes vulnerabilities as early as possible, not from testing at the end alone.
