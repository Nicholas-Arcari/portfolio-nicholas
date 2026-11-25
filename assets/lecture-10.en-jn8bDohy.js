const e=`Lecture 10 is the course's catalog of **secure-design principles**, the "do's" at the design level, complementing the vulnerability "don'ts" of the earlier lectures. Each principle is stated, motivated, and illustrated with examples and counterexamples (several with code): secure the weakest link, defence in depth, least privilege, compartmentalize, minimise attack surface, secure defaults, fail securely, promote privacy, hiding secrets is hard, use community resources, psychological acceptability, don't mix data and code, assign responsibilities, identify assumptions, and be reluctant to trust. The slide deck has 54 pages. Several code examples here are exam-relevant.

## Introduction (pages 2-4)

### Slide 2 · Security Principles

> - Variations of lists of security principles appear in literature & on-line
> - Security vulnerabilities often exploit violations of these principles
> - Good security solutions or countermeasures follow these principles
> - Some overlap & some tension between principles
> - More generally, checklists are useful for security

**Expansion.** These principles are heuristics distilled from decades of experience (the classic source is Saltzer & Schroeder's 1975 paper "The Protection of Information in Computer Systems"). Two framings make them useful: **vulnerabilities are usually violations of a principle**, and **good countermeasures follow one**. They are not independent rules: some **overlap** (minimise attack surface and least privilege push the same way) and some are in **tension** (least privilege vs keep-it-simple). They work as a **checklist**: running a design against the list surfaces weaknesses systematically, which is itself a valuable security practice.

### Slide 3 · Security Principles (the list)

> - secure the weakest link
> - defence in depth
> - principle of least privilege
> - minimise attack surface
> - compartmentalize
> - secure defaults
> - keep it simple
> - fail securely
> - promote privacy
> - hiding secrets is hard
> - use community resources
> - be reluctant to trust
> - ....

**Expansion.** The full set covered in this lecture (plus a few extra principles added later: psychological acceptability, don't mix data and code, assign responsibilities, identify assumptions). The slide is repeated as a recap at the end (Slide 54). Each is developed below.

### Slide 4 · Security Principles (levels)

> These principles can be applied at many levels, eg.
>
> - in source code of an application
> - between applications on a machine
> - at OS level
> - at network level
> - within an organisation
> - between organisations
> - ...

**Expansion.** The principles are **scale-invariant**: the same idea (e.g., least privilege or compartmentalization) applies in code (private fields, small modules), between processes (separate accounts), at OS level (sandboxes, permissions), at network level (segmentation, firewalls), and organisationally (role separation, need-to-know). Good security applies them consistently at every level, since an attacker attacks whichever level is weakest (the next principle).

## Secure the weakest link (pages 5-8)

### Slide 5 · Secure the weakest link

> - Spend your efforts on improving the security of the weakest part of a system, as this is where attackers will attack
> - NB this requires a good risk analysis

**Expansion.** Security is a **chain**, and an attacker breaks the **weakest link**, not the strongest (Lecture 1, Slide 6). So effort should be directed where the system is weakest, not where it is already strong (hardening an already-strong component yields nothing, while the real hole stays open). Identifying the weakest link requires **risk analysis** (what are the assets, threats and likely attack paths, Lecture 1, Slide 49). A corollary: there is no point adding a stronger lock to a door next to an open window.

### Slide 6 · Secure the weakest link (examples)

> - educating users may be best investment to improve security - eg think of phishing attacks, weak passwords
> - web application visible through firewall may be easier to break than the firewall - improve web application security, not the firewall

**Expansion.** Two concrete cases of finding the weakest link:

- **The human factor is often the weakest link** (Lecture 1, Slide 6), so *user education* against phishing and weak passwords may yield more security per euro than any technical control. (This is also the origin of modern anti-phishing training and MFA.)
- **The exposed application, not the firewall, is usually the easy target.** A firewall *must* let web traffic reach the web app, so the attacker goes *through* the firewall to the app (Lecture 1, Slide 20). Buying a stronger firewall is wasted effort; securing the web application is where the risk actually is.

### Slides 7-8 · Example: using credit cards on the internet

> (7) Internet folklore: don't use your credit card online, or only over SSL-encrypted connection; …
>
> NB threats vs risk:
>
> - Threats to credit card numbers include: me losing my wallet; eavesdropping on the network; stealing from customer database
> - The last poses a bigger risk: end-points of SSL connection are the weak points (Also, the risk to card holder is small)
>
> (8) "Using encryption on the Internet is the equivalent of arranging an armored car to deliver credit card information from someone living in a cardboard box to someone living on a park bench." -- Gene Spafford

**Expansion.** A classic illustration of the difference between **threat** and **risk** (likelihood × impact). Three threats to a credit-card number: losing your wallet, network eavesdropping, and theft from the merchant's **customer database**. The common folklore fixates on the *network* ("only use SSL"), but that is rarely the weakest link: SSL/TLS makes eavesdropping on the wire very hard, so the real risk is at the **endpoints**, especially the merchant database holding millions of cards (the big breaches, Lecture 2, Slide 22). Spafford's famous quip drives it home: encrypting the transport (the "armored car") is pointless when both endpoints are insecure (the "cardboard box" and "park bench"). The practical lessons: do a proper risk analysis before spending on defences, and protect the data at rest (the database), not just in transit.

## Practice defence in depth (pages 9-14)

### Slide 9 · Practice defence in depth

> - have several layers of security - two controls are better than one.
> - no single point of failure
> - A typical violation: having a firewall, and only having firewall - a user bringing in a laptop circumvents firewall - this is an example of environmental creep

**Expansion.** **Defence in depth** means using *multiple independent layers* of protection, so that if one fails, others still hold, there is **no single point of failure**. This is the opposite stance to "one perfect wall" and complements "secure the weakest link" (don't rely on any single control). The **typical violation** is relying on a *perimeter* firewall alone: it protects only the boundary, so a laptop carried inside (or a VPN, a cloud link, a USB device) **bypasses it entirely**. This is **environmental creep**, the system's real environment drifts away from the assumptions the single defence was built on (the "identify your assumptions" principle, Slide 50). Defence in depth is also the modern "assume breach" / zero-trust mindset (Lecture 1, Slide 55).

### Slides 10-11 · Practice defence in depth (layered examples)

> (10) have a firewall AND secure web application software AND run web application with minimal privileges
>
> (11) use OS access control to restrict access to sensitive files AND encrypt them - Esp. when files are written to removable media such as USB sticks (another example of environmental creep), to laptops, or PCs which might be disposed of

**Expansion.** Two concrete layerings:

- *Web app*: a firewall **and** secure application code **and** least-privilege execution. Each layer covers a different failure: the firewall blocks unneeded network access, secure code resists the attacks that do get through, and least privilege limits the damage if the code is nonetheless compromised.
- *Sensitive files*: OS access control (permissions) **and** encryption. Access control fails the moment the storage leaves the OS's control, a USB stick (environmental creep again), a lost laptop, a discarded or resold disk, but encryption still protects the data at rest. The layers are independent, so both must fail for the data to leak. (This is why full-disk and removable-media encryption are standard.)

### Slide 12 · Practice defence in depth (Spafford quote)

> "The only system which is truly secure is one which is switched off and unplugged, locked in a titanium-lined safe, buried in a concrete bunker, and surrounded by nerve gas and very highly paid armed guards. Even then, I wouldn't stake my life on it." -- Gene Spafford

**Expansion.** The famous aphorism: **perfect security is unattainable** (Lecture 2, Slide 17). Even extreme, layered physical defences do not give certainty, so the goal is never "absolute security" but reducing risk to an acceptable level at acceptable cost (Lecture 1, Slide 50), while accepting that usefulness and security trade off (a switched-off computer is secure and useless). It also wryly makes the defence-in-depth point: many layers, and still no guarantee.

### Slide 13 · Defence in depth: counterexample

> - on UNIX systems, the password file, /etc/passwd, which contains hashed passwords, was world readable.
> - better - hash passwords AND enforce tight access control to the file

**Expansion.** A counterexample where only **one** layer was used. Early UNIX relied on a single defence for passwords: they were **hashed**, so \`/etc/passwd\` could safely be world-readable (anyone could read the hashes but not the plaintext). But a hash alone is not enough: once attackers had the hashes, they ran **offline dictionary/brute-force attacks** (famously with Crack) to recover weak passwords, with no rate limiting and no detection. The defence-in-depth fix: hash the passwords **and** restrict access to the hashes. This is exactly why modern UNIX moved the hashes to \`/etc/shadow\`, readable only by root, and added salting and slow hashes. Two independent layers (secret hashes + access control) are far stronger than either alone.

### Slide 14 · Sun tarball problem (1993)

> - Every tarball (zip-file) produced on Solaris 2.0 contained fragments of the password file /etc/password
> - How did this happen? - tar looked up some user info directly prior to producing tarball: password file was loaded in heap memory for this; this heap memory was then released - then tar allocated memory for constructing the tarball: allocated memory was always the memory just released; memory not zeroed out on allocation by program or OS...
> - Solution: replacing \`char *buf = (char*)malloc(BUFSIZE)\` by \`char *buf = (char*)calloc(BUFSIZE)\`

**Code analysis.** A real, instructive **information-disclosure** bug caused by uninitialised memory (and a defence-in-depth lesson about data hygiene).

- *What happened.* Solaris 2.0's \`tar\` first read the password file into a **heap buffer** (to look up user info), then \`free\`d that buffer. Immediately afterwards it \`malloc\`ed a buffer to build the archive, and the allocator handed back **the very same block of memory it had just freed**, still containing fragments of the password file. Since \`malloc\` does **not zero** the memory it returns (Lecture 3, Slide 26), and \`tar\` did not overwrite the whole buffer before writing it out, **every tarball leaked pieces of \`/etc/passwd\`** (hashed passwords) to whoever received the archive.
- *The root cause*: relying on \`malloc\`'d memory being clean. It is not; it contains whatever was there before (a *use of uninitialised memory*, CWE-457, and an *information exposure*, CWE-200). This is the same class as Heartbleed and the \`using_pointer_arithmetic\` over-read of Lecture 2.
- *The fix (on the slide).* Replace \`malloc\` with **\`calloc\`**, which **zero-initialises** the allocated memory. (Strictly, the real \`calloc\` signature is \`calloc(count, size)\`, so the slide's \`calloc(BUFSIZE)\` is shorthand; the point is that \`calloc\` returns zeroed memory.) A more robust fix also **wipes sensitive data as soon as it is no longer needed** (\`explicit_bzero\` after use), rather than relying on the next allocation to clean up, the "zero-out arrays with sensitive information" advice of Slide 30. This is defence in depth for data: do not let secrets linger in reusable memory.

## Principle of least privilege (pages 15-19)

### Slide 15 · Principle of least privilege

> - be stingy with privileges - only grant permissions that are really needed - resource permissions (eg memory limits, CPU priorities), network permissions, file permissions, ....
> - typical violations - logging in as root/administrator - device drivers having to run in kernel mode
> - important cause of violations: laziness

**Expansion.** The **principle of least privilege (PoLP)**: every component (user, process, module) should run with the **minimum privileges needed to do its job, and no more**. Then a compromised or buggy component can do only limited damage. Privileges span many resources: memory and CPU limits, network access, file permissions, system calls. **Typical violations**: running everything as *root/administrator* (so any bug becomes a full compromise), and architectures that force code into the most privileged mode (device drivers in kernel mode, so a driver bug crashes or owns the whole system, which is why microkernels push drivers to user space). The honest root cause of most violations is **laziness**: it is easier to grant all permissions than to work out the minimal set. PoLP is the single most important damage-limiting principle and recurs throughout the course (Lecture 1 role-based access control; Lecture 5/9 low-privilege DB accounts).

### Slide 16 · Principle of least privilege (organisation and computer)

> - in organisation - don't give everyone access to root passwords - don't give everyone administrator rights
> - on computer - run process with minimal set of privileges - Eg, don't run web application as root or administrator

**Expansion.** PoLP at two levels (the scale-invariance of Slide 4): *organisationally*, restrict who holds root passwords and admin rights (need-to-know, separation of duties); *on a machine*, run each process with only the privileges it needs, never run a web application as root/administrator, so that a web-app compromise (SQL injection, buffer overflow) does not hand the attacker the whole machine. Modern practice: dedicated service accounts, dropping privileges after startup (\`setuid\` down), capabilities instead of full root, containers.

### Slide 17 · Principle of least privilege (Java policy example)

> for Java application. Not the default policy:
>
> \`\`\`
> grant codeBase "file:\${{java.ext.dirs}}/*" {
>     permission java.security.AllPermission;
> };
> \`\`\`
>
> but minimum required:
>
> \`\`\`
> grant codeBase "file:./forum/*" {
>     permission java.security.FilePermission "/home/forumcontent/*", "read/write";
> };
> \`\`\`

**Code analysis.** A Java security-policy example of PoLP (the policy consumed by the old Java Security Manager / \`AccessController\`).

- *The over-privileged version* grants \`AllPermission\` to code, which means **every permission there is**, read/write any file, open any socket, exit the VM, load native code. This is the maximum-privilege anti-pattern: any flaw in that code (or malicious code loaded into it) can do anything.
- *The least-privilege version* grants only \`FilePermission\` to **read/write files under \`/home/forumcontent/*\`**, and only to code loaded from \`./forum/*\`. The forum application can touch exactly the content directory it needs and nothing else, no network, no other files, no VM control. If it is compromised, the blast radius is that one directory.
- *Note*: the Java Security Manager is **deprecated (Java 17) and being removed**, so this exact mechanism is historical; the *principle* it illustrates, granting narrow, resource-specific permissions instead of blanket ones, is implemented today with OS sandboxes, containers, seccomp and capability systems.

### Slide 18 · Principle of least privilege (in code)

> - in code - not \`public int x;\` but \`private int x;\` - not \`public void m()\` but \`package void m()\`
> - Expose minimal functionality in interfaces of objects, classes, packages, applications

**Expansion.** PoLP applies *inside* code as **minimal visibility/encapsulation**: declare each field and method with the **narrowest access modifier** that works, \`private\` over \`public\`, package-private over \`public\` (Lecture 1, Slide 33; Lecture 2, Slide 5). Exposing only the minimum in every interface (object, class, package, application) means less surface for other code, including buggy or hostile code in the same process, to misuse. It is simultaneously least privilege (callers get only the access they need) and attack-surface reduction (Slide 29). The broader rule: design narrow, well-defined interfaces.

### Slide 19 · Principle of least privilege (why it is hard)

> - NB applying the principle of least privilege in code is tricky & hard and requires work & discipline. - this is true just for plp in general, not just in code
> - Why? - compiler complains about private field that should be public, not the other way around - compiler complains about missing import, not about superfluous import.
> - Can this be improved? - tool support in compilers & IDEs, eg or separate source code analyzers, eg FindBugs and JAMIT tool for tightening visibility modifiers

**Expansion.** An honest caveat: PoLP is **hard to apply because the defaults and tools push the wrong way**. Languages and compilers flag *insufficient* access (a \`private\` field used from outside, a missing import) but **never warn about *excessive* access** (a field that is \`public\` but only used internally, a superfluous import). So over-privileging is silent and easy, while under-privileging is noisy and gets fixed, exactly backwards for security. The remedy is **tooling**: static analysers that detect and tighten over-broad visibility (the slide cites FindBugs and the **JAMIT** "Java Access Modifier Inference Tool"), and IDE support. This connects to the "fool with a tool" and tool-adoption themes of Lecture 6: the right tools make good practice the easy path.

## Compartmentalize (pages 20-27)

### Slide 20 · Compartmentalize

> - Principle of least privilege works best if access control is all or nothing for large chunks - compartments - of a system
> - Motivations: simplicity; containing attacker in case of failure
> - Analogy: compartments on a ship
> - Counterexample: OS that crashes if an application crashes

**Expansion.** **Compartmentalization** divides a system into isolated **compartments**, each with coarse, all-or-nothing access, so that a breach in one does not spread to the others. Two motivations: **simplicity** (coarse boundaries are easier to reason about and enforce than fine-grained per-object permissions, see the tension on the next slide) and **containment** (an attacker who breaks into one compartment is stuck there). The **ship analogy** is exact: watertight bulkheads mean one flooded compartment does not sink the ship. The **counterexample** is a system with *no* isolation, an OS that crashes when a single application crashes (classic cooperative-multitasking systems), where one failure takes down everything. Modern incarnations: process isolation, containers, VMs, microservices, browser site isolation.

### Slide 21 · Compartmentalize (tension with KISS)

> NB the fundamental conflict between
>
> - principle of least privilege and
> - kiss principle - keep it simple, stupid - plp requires very fine-grained control with expressive policies - ... which leads to more complexity - ... which people then get wrong
> - Compartmentalization can provide a solution using defence in depth

**Expansion.** An important **tension between two principles**. *Least privilege* pushes toward **fine-grained** control (give each thing exactly its minimal rights), but fine-grained policies are **complex and expressive**, and complexity is itself a security risk, people misconfigure complicated policies (the "keep it simple" principle, and the "security misconfiguration" OWASP category). **Compartmentalization resolves the tension**: coarse-grained isolation of a few large compartments gives most of the benefit of least privilege (containment) with far less complexity, a defence-in-depth layer that is simple enough to get right. The lesson: prefer a few well-understood boundaries over a maze of fine-grained permissions no one fully understands.

### Slide 22 · Compartmentalize examples

> - Use different machines for different tasks - eg run web application on a different machine from employee salary database
> - Use different user accounts on one machine for different tasks - unfortunately, security breach under one account may compromise both... - compartmentalization provided by typical OSs is poor!
> - Partition hard disk and install OS twice

**Expansion.** Compartmentalization strength varies with the boundary:

- **Separate machines** = strong isolation (the web server and the salary database on different hosts, so compromising the public web app does not directly reach the sensitive database).
- **Separate user accounts on one machine** = weaker: a local privilege-escalation bug (abundant in OSes) lets an attacker jump from one account to another, so "the compartmentalization provided by typical OSs is poor". Accounts are a convenience boundary, not a strong security boundary.
- **Separate OS installs / disk partitions** (dual boot) = strong but inconvenient.

The takeaway: know how *strong* each compartment boundary actually is, and match it to the risk. This motivates the stronger mechanisms on the next slides.

### Slide 23 · Improved compartmentalization: chroot jail

> - chroot jail restricts access of a process to subset of file system, ie. changes the root of file system for that process
> - Eg run an application you just downloaded with \`chroot /home/sos/paperino/trial;/tmp\`
> - Nice idea, but hard to get working, and hard to get working correctly.

**Expansion.** A **chroot jail** changes a process's view of the filesystem root to a chosen subdirectory, so the process cannot name or reach files outside that subtree, a filesystem compartment (useful for the directory-traversal/file-name defence of Lecture 5, Slide 24). The caveat is important: chroot is **hard to set up correctly** (you must copy in every library, device and config the program needs) and is **not a complete security boundary**, a process running as root can often escape a chroot, and it confines only the filesystem (not network, processes or privileges). Stronger modern equivalents: containers (namespaces + cgroups), FreeBSD jails, seccomp sandboxes.

### Slides 24-26 · Improved compartmentalization: virtual machines and hypervisors

> (24) Examples in operating system world:
>
> - virtual machines - VMWare - very popular these days, but mainly for reasons of convenience & costs, not security
> - operating system hypervisors (true microkernels): small, lightweight kernel, which partitions hard disk & memory, to concurrently run several copies of the OS, in different compartments

![Lecture 10, page 25](L10_p25.webp "38% 684x834")

**Figure (Slide 25): hosted virtualization.** A stack diagram: at the bottom **Hardware**, then **OS 1** (the host OS), on which **process A** runs and also a **Hardware Simulator** (hosted hypervisor); on top of the simulator runs **OS 2**, on which **process B** runs. Caption: "We simulate the hardware in an OS process. Similar to Java VM, except that we simulate the real hardware, and don't provide some abstract VM. This is the solution proposed by VMware.com."

![Lecture 10, page 26](L10_p26.webp "48% 862x647")

**Figure (Slide 26): hypervisor (bare-metal) virtualization.** A stack diagram: at the bottom **Hardware**, then the **hypervisor** directly on it, then two side-by-side guests, **OS 1** (running **process A**) and **OS 2** (running **process B**). Caption: "We simulate the hardware below the operating system, in a so-called hypervisor aka micro-kernel."

**Expansion.** **Virtualization** gives strong compartmentalization by running whole operating systems in isolated **virtual machines**:

- **Hosted virtualization (Type 2, e.g., VMware Workstation, VirtualBox)**: a *hardware simulator* runs as an ordinary process on a host OS, and each guest OS runs on that simulator (Slide 25). It is like a Java VM, but it simulates *real* hardware rather than an abstract machine, so unmodified OSes run inside. The slide notes VMs are popular mainly for **convenience and cost** (consolidation, snapshots), not primarily for security.
- **Bare-metal virtualization (Type 1, hypervisor / microkernel, e.g., Xen, VMware ESXi, KVM)**: a thin **hypervisor** sits *directly on the hardware*, below all the guest OSes, and partitions the real hardware (disk, memory, CPU) among several isolated guest OSes (Slide 26). Being small, it is easier to make trustworthy (the "small TCB" idea), and the isolation is strong.

VMs are the strongest practical compartment boundary short of separate physical machines (cloud multi-tenancy relies on them), though VM-escape vulnerabilities, the "VME" rows in the Zerodium price list of Lecture 1, show even this boundary can be breached.

### Slide 27 · Compartmentalize (in code)

> - in code, aka modularisation - using objects, classes, packages, etc.
> - Restrict sensitive operations to small modules, with small interfaces - so that you can concentrate efforts on quality of these modules - so that only these have to be subjected to code reviews

**Expansion.** Compartmentalization in code is **modularisation**: confine sensitive operations (cryptography, authentication, access-control checks, handling of secrets) to **small modules with small, well-defined interfaces**. The security payoff is concentration of effort: only those small, critical modules need the most rigorous review, testing and verification, the rest of the code base cannot directly perform the sensitive operations. This is the software analogue of a small **Trusted Computing Base** (Lecture 1, Slide 59; Slide 51 below): shrink the part you must trust, then spend your assurance budget there. It also realises "don't scatter security checks everywhere" (centralise them, Lecture 5, Slide 27).

## Minimize attack surface (pages 28-30)

### Slide 28 · Minimize attack surface

> Minimise
>
> - number of open sockets
> - number of services
> - number of services running by default
> - number of services running with high privileges
> - number of dynamic content webpages
> - number of accounts with administrator rights
> - number of files & directories with weak access control
> - ...

**Expansion.** The **attack surface** is the sum of all points where an attacker can interact with the system (Lecture 1, Slide 20). Every open socket, running service, dynamic page, admin account and weakly-protected file is a potential entry point, so **minimise each of them**. Fewer services means fewer vulnerabilities reachable; services off by default means they cannot be attacked until deliberately enabled; fewer high-privilege services means less that a compromise can escalate to. This is the "reducing attack surface" idea of Lecture 3, Slide 52, applied as a design discipline: if it is not needed, do not run it, do not install it, do not expose it.

### Slide 29 · Minimize attack surface (in code)

> - in code - not \`public int x;\` but \`private int x;\` - not \`public void m()\` but \`package void m()\`
> - This is applying principle of least privilege, and also reduces attack surface, from buggy or hostile code

**Expansion.** The same minimal-visibility practice as Slide 18, viewed through the attack-surface lens: a \`public\` member is reachable by *all* other code, a \`private\` one only from within the class. Narrowing visibility shrinks the surface that **buggy or hostile code (in the same process)** can touch, so it serves *both* least privilege (callers get only what they need) and attack-surface reduction (fewer reachable entry points). This is why the two principles overlap (Slide 2).

### Slide 30 · Minimize attack surface in time

> Examples
>
> - Automatically log off users after n minutes
> - Automatically lock screen after n minutes
> - Unplug network connection if you don't use it
> - Switch off computer if you don't use it
> - On smartcards, it's good practice to zero-out arrays that contains sensitive information (usually, decrypted information) as soon as it's no longer needed

**Expansion.** Attack surface has a **time dimension**: the *window* during which something is attackable. Shorten it, auto-logoff and screen-lock close an unattended session, disconnecting or powering off removes exposure entirely when idle. The smartcard example is the data-lifetime version and ties back to the Sun-tarball bug (Slide 14): **wipe sensitive data (decrypted secrets, keys) from memory as soon as it is no longer needed** (\`explicit_bzero\`), so the window in which a memory-disclosure bug could leak it is as short as possible. This is also "availability may be undesirable" / forward secrecy from Lecture 1, Slide 52.

## Use secure defaults (page 31)

### Slide 31 · Use secure defaults

> - By default, security should be switched on; permissions turned off
> - This will ensure that we apply principle of least privilege
> - Counterexample: on bluetooth connection on mobile phone is by default on, but can be abused

**Expansion.** **Secure defaults** (secure by default): the *out-of-the-box* configuration must be the secure one, protections **on**, permissions **off (default-deny)**, because most users never change defaults. This automatically enforces least privilege (you only turn on what you actually need) and is the white-list/default-deny stance (Lecture 4, Slide 38). The **counterexample**, Bluetooth left *on* by default on phones, exposed users to attacks (BlueBorne, Bluesnarfing) they never opted into. This is also the lesson of the Tandberg passwordless-root default (Lecture 1, Slide 15): products must ship secure, since an insecure default is an insecurity for every user who never touches the settings.

## Fail securely (pages 32-40)

### Slide 32 · Fail securely

> - Incorrect handling of unexpected errors is a major cause of security breaches
> - Counterexamples: fallback to unsafe(r) modes on failure (sometimes for backward compatibility; asking user if security settings can be lowered); crashing on failure, leading to DoS attack; leaking interesting information for an attacker
> - Of course, having exceptions in a programming language has a big impact

**Expansion.** **Fail securely (fail-safe defaults)**: when something goes wrong, the system must end up in a **secure** state, typically by **denying** access, not granting it. Botched error handling is a major breach cause. The counterexamples are the ways failure goes *insecure*:

- **Fallback to a less-safe mode**: on error, dropping to weaker security "for backward compatibility" (an attacker then *forces* the error to trigger the downgrade, e.g., TLS downgrade attacks like POODLE), or asking the user to lower security settings (which they will).
- **Crashing**: an unhandled failure that crashes the service is a **denial-of-service** (and may bypass later checks).
- **Leaking information**: error messages that reveal internals help the attacker (the verbose-SQL-error problem of Lecture 9, Slide 13).

The presence of **exceptions** in a language matters hugely: exceptions make it harder to *ignore* an error (the next slides contrast C's return-code errors with exception handling), but mishandled exceptions create their own insecure-failure modes. The guiding rule: **on any error, default to deny/secure.**

### Slide 33 · Fail securely example (the isAdmin bug)

\`\`\`java
isAdmin = true; // enter Admin mode
try {
      …something that may throw SomeException…
} catch (SomeException ex) {
      // should we log?
    log.write(ex.toString());
      // how should we proceed?
    isAdmin = false;
      // or should we exit?
}
\`\`\`

**Code analysis.** A textbook *fail-insecure* bug.

- *The flaw.* \`isAdmin\` is set to \`true\` **before** the risky operation, "entering admin mode" optimistically, and only reset to \`false\` *inside the catch block* if an exception occurs. This is backwards. If the operation throws **a different exception** than \`SomeException\` (one not caught here), or if the code path somehow skips the catch, \`isAdmin\` stays \`true\`, the program **fails open**, granting admin rights on error. Even the attempted recovery is fragile: it relies on *exactly* \`SomeException\` being thrown and caught.
- *The secure pattern (fail closed/default-deny).* Start from the *denied* state and only grant on explicit success:

\`\`\`java
boolean isAdmin = false;          // default deny
try {
    doPrivilegedCheck();          // throws if not allowed
    isAdmin = true;               // granted ONLY after the check succeeds
} catch (Exception ex) {
    log.write(ex.toString());     // isAdmin remains false on ANY failure
}
\`\`\`

Now any error, of any kind, leaves \`isAdmin == false\`. The rule: **initialise security decisions to "deny" and flip to "allow" only on a verified success**, never the reverse.

### Slide 34 · Variants of failing insecurely

> - information leakage - about cause of error, which can be exploited - more on that later
> - ignoring errors - Easier in a programming language without exceptions! (eg forgetting to check for -1 return value in C)
> - misinterpreting errors
> - useless errors - why does strncopy return an error value at all?
> - handling wrong exceptions
> - handling all exceptions

**Expansion.** A taxonomy of error-handling failures:

- **Information leakage**: the error message itself reveals exploitable detail (stack traces, SQL, paths, versions, the "promote privacy" counterexamples of Slides 41 and 44, and blind SQL of Slides 42-43).
- **Ignoring errors**: not checking for failure at all, *easy in C* where errors are return codes (forgetting to test a \`-1\`/\`NULL\` return) and the program blunders on with an invalid result. Exceptions make this harder (an unhandled exception at least stops the thread), which is the "big impact" of exceptions.
- **Misinterpreting errors**: handling an error but drawing the wrong conclusion (treating a transient failure as success).
- **Useless errors**: an error signal that carries no useful information (the rhetorical "why does \`strncpy\` return a value at all?", next slide).
- **Handling the wrong exceptions / handling all exceptions**: catching exceptions you did not mean to, or catching *everything* with one broad handler (Slides 37-38), which hides real problems.

### Slide 35 · Failing insecurely example (strncpy return value)

\`\`\`c
char dest[19];
char *p = strncpy(dest, src, 19);
    // strncpy returns dest, like strcpy
if (p) { // everything went fine, use dest or p
    .....
}
\`\`\`

> - Programmer is careful to check return value of strncopy
> - But strncopy will not return NULL on error
> - Of course, having exceptions in a programming language has a big impact

**Code analysis.** A *misinterpreting-errors* bug born from a *useless* error value.

- *The mistake.* The programmer diligently checks the return value \`p\` of \`strncpy\`, assuming that a non-\`NULL\` return means success. But **\`strncpy\` always returns \`dest\`** (its first argument), exactly like \`strcpy\`; it **never returns \`NULL\`** and has **no error indication at all**. So \`if (p)\` is *always* true, the "check" is meaningless, and the real failure modes of \`strncpy\` (truncation, missing NUL-terminator, the bugs of Lecture 3, Slides 18-21) go completely undetected.
- *The deeper point.* \`strncpy\`'s return value is **useless** (it just echoes an argument), yet it *looks* like an error code, luring the programmer into a false check. This is why knowing the exact contract of each API matters, and why languages with **exceptions** (which force genuine failures to surface) reduce this class of bug.
- *Fix.* Do not rely on \`strncpy\`'s return value; check the real post-conditions: that the source fit and the result is terminated (Lecture 3, Slide 21), or use \`snprintf\`/\`strlcpy\` and check *their* (meaningful) results. Also note \`dest[19]\` with a count of 19 leaves no room to add a terminator, the off-by-one of Lecture 3.

### Slide 36 · Failing insecurely example (ImpersonateNamedClient)

\`\`\`c
ImpersonateNamedClient(someUser); // become someUser
DeleteFile(fileName);
RevertToSelf();   // become Local System
\`\`\`

> Example code in Local System service in Windows. What's wrong here? What happens if ImpersonateNamedClient fails?

**Code analysis.** A classic Windows privilege bug and a fail-insecure case.

- *The intent.* This code runs in a highly privileged **Local System** service. To perform an action *on behalf of a less-privileged client*, it **impersonates** that client (\`ImpersonateNamedClient\`), does the action (\`DeleteFile\`) with the client's reduced rights, then reverts to Local System (\`RevertToSelf\`). This is correct least-privilege design: do the dangerous operation with the *client's* limited rights, not the service's god-like rights.
- *The bug.* The **return value of \`ImpersonateNamedClient\` is never checked.** If impersonation **fails**, the thread keeps running as **Local System**, and \`DeleteFile(fileName)\` then executes with *full system privileges*. So a client who can make impersonation fail can delete *any* file on the system, a privilege escalation. The code **fails open** (to higher privilege) instead of failing closed.
- *Fix.* Check the result and **abort if impersonation fails**, never proceed with the privileged identity:

\`\`\`c
if (!ImpersonateNamedClient(someUser)) {
    // impersonation failed: do NOT run as Local System
    log_error(); return;
}
DeleteFile(fileName);
RevertToSelf();
\`\`\`

This is the same "check the return value and fail securely" lesson as the impersonation CVEs that have hit Windows services.

### Slide 37 · Failing insecurely example (one broad catch)

\`\`\`java
try {... // (1) Load XML file f from disk
     ... // (2) Use some data from f to get URI
     ... // (3) get X509 certificate
     ... // (4) access URI with certificate
} catch (Exception ex) {
   ....
}
\`\`\`

> What's wrong here? - one catch block to handle SecurityException, XMLException, IOException, FileNotFoundException, SocketException, ......

**Code analysis.** The *handling-all-exceptions* anti-pattern.

- *The flaw.* A single \`catch (Exception ex)\` wraps **four very different operations** (file load, parsing, certificate retrieval, network access), each of which can fail in **security-relevant but distinct** ways: a \`SecurityException\` (a certificate problem, a real attack signal) is caught and handled *identically* to a benign \`FileNotFoundException\`. The code cannot tell a security failure from a routine one, so it almost certainly handles the dangerous case wrongly, likely treating a failed certificate check as a recoverable glitch and proceeding insecurely.
- *Fix.* Catch **specific** exceptions and handle each appropriately, especially security exceptions, which should fail closed (deny and alert), not be swallowed with the rest:

\`\`\`java
try { ... }
catch (SecurityException ex) { denyAndAlert(ex); }   // treat as attack
catch (XMLException | IOException ex) { handleDataError(ex); }
\`\`\`

Keep \`try\` blocks small and catch narrowly, so each failure gets the response it needs.

### Slide 38 · Failing insecurely example (empty catch)

\`\`\`java
try {...
      ...
    } catch (Exception ex) {
     // do nothing
    }
\`\`\`

> What's possibly/probably wrong here? - empty catch block is suspicious... - overly broad catches is suspicious

**Code analysis.** The worst error-handling anti-pattern: the **empty catch block that swallows all exceptions**.

- *The flaw.* \`catch (Exception ex) { }\` catches *everything* and does *nothing*, the error is silently discarded and execution continues as if nothing happened. This combines two sins: **overly broad** catching (\`Exception\` catches all) and **ignoring the error entirely** (the "ignoring errors" of Slide 34). A failed security check, a failed write, a corrupted parse, all vanish, and the program proceeds in an unknown, possibly compromised state. It is also a nightmare to debug.
- *Why it's flagged by tools.* Empty and overly broad catches are exactly what static analysers (Lecture 6) warn about, because they so often hide real (including security) bugs.
- *Fix.* Never swallow exceptions. At minimum log them; preferably handle each specific exception and **fail securely** (deny, roll back, abort) rather than continuing blindly.

### Slide 39 · Failing insecurely example (OpenSSL/OpenSSH PRNG)

> Security Flaw in OpenSSL and OpenSSH (CVE CAN-2000-0535)
>
> - PRNG (Pseudo Random Number Generator) in OpenSSH and OpenSSL seeded with /dev/random
> - But failure to check for the presence of /dev/random which did not exist on FreeBSD-Alpha...
> - /dev/random stops reading randomness when the entropy source is exhausted. Use /dev/urandom instead!

**Code analysis.** A real fail-insecure bug with severe cryptographic consequences.

- *What happened.* OpenSSL/OpenSSH seeded their random-number generator from \`/dev/random\`. On the FreeBSD-Alpha platform, \`/dev/random\` **did not exist**, and the code **failed to check** that the seeding actually succeeded. So the PRNG was seeded with **predictable or no entropy**, making the "random" values (session keys, nonces, the cookies/tokens of Lecture 1, Slide 14) predictable, catastrophic for cryptography (a predictable key is no key).
- *Two lessons.* (1) **Fail securely**: always check that a security-critical operation (here, obtaining entropy) *succeeded*; failing to seed the PRNG should **abort**, never proceed with a weak one (the \`getrandom\` advice of Lecture 1, Slide 14). (2) **\`/dev/random\` vs \`/dev/urandom\`**: \`/dev/random\` *blocks* (stops yielding bytes) when its estimated entropy is "exhausted", which can hang a program or tempt developers into unsafe fallbacks; on modern systems \`/dev/urandom\` (or the \`getrandom()\` syscall) is cryptographically secure and does not block after initial seeding, so it is the recommended source.

### Slide 40 · Failing securely example (input validation)

> When scrubbing user input - i.e. validating input -
>
> - don't reject input with illegal words - eg. webforum input containing \\<javascript>
> - don't reject input with illegal characters - eg. input containing characters < > ;
> - but only allow input with legal characters - eg. only input containing 0...9 a...z
> - So user validation will err on the side of caution

**Expansion.** Fail-securely applied to **input validation**, which is just the white-list vs black-list lesson (Lecture 4, Slides 36-38; Lecture 5, Slide 27) restated as a design principle. Rejecting *illegal* words or characters (a **black list**) fails insecurely: whatever the blacklist forgot gets through (the phf newline). Instead, **allow only legal characters** (a **white list**): anything not explicitly permitted is rejected, so an input the designers never anticipated is denied *by default*, the validation **"errs on the side of caution"** (fails closed). This is secure defaults + fail securely + white-listing, three principles converging on the same rule.

## Promote privacy (pages 41-43)

### Slide 41 · Promote privacy

> - Privacy of users, but also of systems
> - Counterexamples: \`> telnet somemachine\` → \`Trying 123.1.2.3 ... Connected to somemachine (123.1.2.3). Red Hat Linux release 7.0 (Hedwig). Kernel 2.2.16 on an i686. login:\` - Smartcard chips still do this

**Expansion.** **Promote privacy** means minimising the information the system reveals, both the *users'* personal data **and** the *system's own* details. The counterexample is a **banner leak**: connecting to a machine (here by \`telnet\`) and being greeted with the exact OS distribution (Red Hat 7.0) and kernel version (2.2.16 on i686). This is a gift to an attacker, they can immediately look up known vulnerabilities for that precise version (a "pedigree"/fingerprinting step). Smartcards similarly leak their type/version. This is an **information-disclosure** weakness (the "minimise attack surface" and "fail securely / don't leak" principles): services should reveal as little as possible about themselves (suppress or genericise version banners) and about their users.

### Slides 42-43 · Blind SQL injection

> (42) Suppose \`http://newspaper.com/items.php?id=2\` results in SQL injection-prone query \`SELECT title, body FROM items WHERE ID=2\`. Will we see different response to URLs below? \`...?id=2 AND 1=1\` / \`...?id=2 AND 1=2\`. We can use this to find out things about the database structure & content: \`../items.php?id=2 AND SUBSTRING(user,1,1) = 'a'\`. Blind SQL injection: result to an SQL injection not visible, but leaks information.
>
> (43) Even if all SQL errors report an identical, standard error page, without any further info, errors may still leak information: \`IF <some condition> SELECT 1 ELSE 1/0\`. Worse still, response time may still leak information: \`.. IF(SUBSTRING(user,1,1) = 'a', BENCHMARK(50000, …), null)..\`

**Code analysis.** This is placed under "promote privacy" because it shows that information leaks **even when the application seems to reveal nothing** - **blind SQL injection** (CWE-89, the inference variant).

- *The setup.* The URL parameter \`id\` is injected into \`WHERE ID=2\`. Even if the page never prints query results or errors, the attacker can still extract data by **asking true/false questions** and watching for *any* observable difference.
- *Boolean-based blind injection.* \`id=2 AND 1=1\` keeps the condition true (page returns the item normally); \`id=2 AND 1=2\` makes it false (item not returned, page looks different). If the two responses differ, the application is injectable and the attacker has a **truth oracle**. They then ask data-revealing questions one bit at a time: \`id=2 AND SUBSTRING(user,1,1) = 'a'\` is true iff the first character of the DB user is \`'a'\`. Iterating over each position and character, they **reconstruct any value in the database** (table/column names, data, password hashes) purely from the true/false responses.
- *Error-based inference (Slide 43).* Even if all errors return an *identical* generic page, the attacker can force a **detectable error** conditionally: \`IF <condition> SELECT 1 ELSE 1/0\`, the \`1/0\` (division by zero) throws an error only when the condition is false, so "error vs no error" becomes the truth oracle.
- *Time-based (blind) injection (Slide 43).* When there is **no** visible difference at all, the attacker makes the database *delay* conditionally: \`IF(SUBSTRING(user,1,1)='a', BENCHMARK(50000,…), null)\` runs an expensive \`BENCHMARK\` (or \`WAITFOR DELAY\`, Lecture 9, Slide 10) only when the guess is right, so the attacker reads the answer from the **response time**. This works even against a completely silent application.
- *The lesson for "promote privacy".* Hiding output and genericising errors is **not** a sufficient defence against injection, information leaks through side channels (differential responses, errors, timing). The *only* real fix is to remove the injection itself (parameterized queries, Lecture 9, Slide 14); suppressing output merely slows the attacker.

## The remaining principles (pages 44-53)

### Slide 44 · It's hard to keep secrets

> - Don't rely on security by obscurity \\[Kerckhoffs principle\\]
> - Don't assume attackers don't know the application source code, and can't reverse-engineer binaries - Don't hardcode secrets in code - Don't rely on code obfuscation
> - Example - DVD encryption - webpages with hidden URLs - passwords in javascript code - this happens!

**Expansion.** **Hiding secrets is hard; don't rely on security by obscurity.** By **Kerckhoffs's principle** (1883), a system must stay secure even if everything about it *except the key* is public, security must rest on secret *keys*, not on secret *designs*. Assume the attacker **has the source code** (open source, leaks, insiders) and **can reverse-engineer binaries** (disassemblers/decompilers, Lecture 6). Consequences: never **hardcode secrets** (keys, passwords, API tokens) in code or binaries, they *will* be extracted; never rely on **code obfuscation** as a security control (it only slows reversing). The examples are famous failures: **DVD CSS encryption** (its key-handling was reverse-engineered, yielding DeCSS), **"hidden" URLs** (security by not-linking, trivially found/guessed, forced browsing), and, astonishingly common, **passwords checked in client-side JavaScript** (the user's browser has the code *and* the password, so the check is worthless). The secret must be a real cryptographic key held server-side, not a hidden design.

### Slides 45-46 · Use community resources

> (45) Never design your own cryptography. Never implement your own cryptography. Don't repeat known mistakes: If you're making an application of kind X using programming language Y on platform Z and operating system W, look for known threats for application of kind X; known vulnerabilities in language Y and platform Z; existing countermeasures.
>
> (46) Use google, books, webfora, etc. to learn & reuse: learn about vulnerabilities (and avoid making the same mistakes); learn about solutions and countermeasures (and reuse them).

**Expansion.** **Use community resources**, don't reinvent, especially security-critical wheels.

- **"Never design or implement your own cryptography."** The single most repeated rule in the field. Correct cryptography is extraordinarily hard to get right (subtle maths, side channels, protocol pitfalls); home-made crypto is almost always broken. Use well-vetted, widely-reviewed libraries and standard algorithms (Lecture 2, Slide 24). The same caution applies to other hard-to-get-right code: parsers, authentication, session management.
- **Don't repeat known mistakes.** For your specific combination (application kind X, language Y, platform Z, OS W), look up the *known* threats, vulnerabilities and countermeasures, OWASP, CWE/CVE, CERT, vendor guidance, books (the Lecture-3 reading list). Most vulnerabilities are re-instances of well-documented patterns (Lecture 1, Slide 61), so learning from the community avoids re-making the field's known mistakes and lets you reuse proven defences. This is the "knowledge" half of Lecture 1's "awareness and knowledge".

### Slide 47 · Principle of psychological acceptability

> - If security mechanism is too cumbersome, users will switch it off, or find clever ways around it
> - User education may improve the situation, but only up to a point
> - How many security pop-ups can we expect the user to cope with, if any?

**Expansion.** **Psychological acceptability** (another Saltzer & Schroeder principle): a security mechanism that is **too cumbersome will be bypassed**, users disable it, work around it, or make errors, so usability *is* a security property. Over-strict password rules breed password reuse and sticky notes; too many confirmation pop-ups train users to click "OK" reflexively (alert fatigue), so the warnings become worthless. Education helps "only up to a point": you cannot train away a fundamentally unusable design. The implication: **design security to be as transparent and low-friction as possible** (secure defaults, single sign-on, passkeys, minimal prompts), because the most secure mechanism is the one users actually keep using correctly. This connects to "security theatre" and the human factor (Lecture 2, Slide 17; Lecture 1, Slide 6).

### Slide 48 · Don't mix data & code

> This is the cause of many problems, eg
>
> - traditional buffer overflow attacks, which rely on mixing data and code on the stack
> - javascript in webpages - leads to XSS (cross site scripting attacks)
> - SQL injection relies on use data (user input!) as part of SQL query

**Expansion.** **Don't mix data and code**, the single master principle unifying most of the course (Lecture 3, Slide 54; Lecture 4, Slide 23). When data and executable instructions share a channel, an attacker can smuggle code in through the data:

- **Buffer overflow**: on the stack, *data* (the buffer) sits next to *control information* (the return address), so writing data overwrites code-flow (Lecture 3).
- **XSS**: a web page mixes *content* (data) with *scripts* (code); user data echoed into the page without separation is executed as JavaScript in the victim's browser (Lecture 5).
- **SQL injection**: user *data* is concatenated into a SQL *command* and parsed as code (Lectures 5, 9).

The cure is always the same: **keep data and code strictly separate**, non-executable data memory + canaries (buffer overflow), output encoding / Content-Security-Policy (XSS), parameterized queries (SQL). When you cannot avoid mixing them, treat all embedded data as untrusted and encode/escape it for its destination context.

### Slide 49 · Clearly assign responsibilities

> At organizational level: eg. make one person responsible for something rather than two persons - or a whole group.
>
> At coding level: make one module/class responsible for input validation, access control, ... For a method \`public void process(String str)\` is the caller or callee responsible for checking if for instance \`str != null && !(str.equals(""))\`? But still practice defence in depth...

**Expansion.** **Clearly assign responsibilities** so that security tasks are not dropped through the gaps between parties ("everyone's responsibility is no one's responsibility").

- *Organisationally*: make **one** person accountable for each security concern, not two and not a committee, so there is a clear owner.
- *In code*: designate **one module/class** as responsible for each cross-cutting concern (input validation, access control), the centralised choke-point idea (Lecture 5, Slide 27). At the method level, make the **contract explicit**: is the *caller* or the *callee* responsible for checking that \`str\` is non-null and non-empty? If both assume the other does it, the check is missing (a precondition gap); if both do it, it is redundant but safe. The slide's balancing note: even with clear ownership, **still practise defence in depth**, a validated input re-checked at a deeper layer is cheap insurance against a mistaken assumption.

### Slide 50 · Identify your assumptions

> Including obvious, implicit assumptions - these may be sources of vulnerability, and may change in long run. Examples:
>
> - laptops invalidate implicit assumption that computers don't move past the company firewall
> - assumption that user is a human may cause you to ignore possibility of brute-force password guessing
> - TCP SYN flood attack exploits implicit assumptions in the spec "If we receive a TCP packet with the SYN flag set, it means the sender wants to start a dialog with us"
> - assumption that new LoginContext() won't throw an OutOfMemoryException
> - assumption that a Java applet won't use all CPU time

**Expansion.** **Identify your assumptions**, especially the *implicit* ones, because vulnerabilities live in unstated, unexamined assumptions, and those assumptions **change over time** (environmental creep, Slide 9). The examples are all broken implicit assumptions:

- "Computers don't leave the firewalled perimeter", broken by **laptops** (and now cloud/remote work).
- "The user is a human", broken by **automated brute-force** password guessing (so add rate limiting, CAPTCHAs).
- "A SYN packet means a genuine connection request", exploited by the **TCP SYN flood** DoS (half-open connections exhaust the server's table; fixed with SYN cookies).
- "\`new LoginContext()\` won't throw \`OutOfMemoryException\`" and "a Java applet won't hog all CPU", resource-exhaustion assumptions an attacker deliberately violates (DoS).

The practice: **write down your assumptions, treat them as part of the threat model, and re-check them as the environment evolves.** An assumption that is true today may be the vulnerability of tomorrow.

### Slide 51 · Be reluctant to trust

> - Understand and respect the chain of trust
> - NB trust is transitive
> - NB trust is not a good thing
> - NB "trusted" is not the same as "trustworthy"
> - Minimize Trusted Computing Base (TCB), ie that part of the system (software and hardware) that has to be trusted

**Expansion.** **Be reluctant to trust.** Several sharp points:

- **Trust is transitive**: if A trusts B and B trusts C, then A effectively trusts C, so every dependency you trust drags in *its* dependencies (the supply-chain concern, Lecture 2, Slide 8). Map the whole **chain of trust**.
- **"Trust is not a good thing."** In security, *trusting* a component means you are *relying* on it and therefore *exposed* if it fails, trust is a liability to be minimised, not a virtue.
- **"Trusted" ≠ "trustworthy."** A *trusted* component is one you *have to* rely on (if it fails, you are compromised); a *trustworthy* one is one that actually deserves that reliance. The danger is trusting something that is not trustworthy.
- **Minimise the Trusted Computing Base (TCB)**: the set of hardware/software that *must* be correct for security to hold (Lecture 1, Slide 59; Lecture 6, Slide 27). The smaller the TCB, the less there is to get wrong and the easier it is to verify, so shrink what must be trusted (small critical modules, Slide 27).

### Slide 52 · Ken Thompson (Reflections on Trusting Trust)

> Backdoor in UNIX and Trojan in C-compiler revealed during Turing award lecture
>
> 1. backdoor in login.c of UNIX: \`if (name == "ken") {don't check password; log in as root}\`
> 2. code in C compiler to add backdoor when recompiling login.c
> 3. code in C compiler to add code (2 & 3!) when (re)compiling a compiler

**Expansion.** The ultimate illustration of "be reluctant to trust", Ken Thompson's self-propagating compiler backdoor, already covered in detail in **Lecture 2, Slide 8** (*Reflections on Trusting Trust*). The three stages: (1) a backdoor in \`login.c\` that logs "ken" in as root without a password; (2) compiler code that *re-inserts* that backdoor whenever \`login.c\` is compiled, even from clean source; (3) compiler code that re-inserts *both* (2) and (3) whenever the compiler itself is compiled, so the backdoor survives in the binary with no trace in any source. The moral: you cannot fully trust code you did not build yourself, all the way down to the compiler and hardware, which is exactly why the TCB (Slide 51) and the supply chain (Lecture 2) matter.

### Slide 53 · Be reluctant to trust (user input)

> - All user input is evil! - Eg unchecked user input leads to buffer overflows; SQL injection; XSS on websites - User input includes cookies, environment variables, ...
> - User input should not be trusted, and subjected to strong input validation checks before being used
> - Don't trust third-party software

**Expansion.** The most practical application of "be reluctant to trust": **all user input is evil** (Lecture 5, Slide 26). Untrusted input is the root of buffer overflows, SQL injection and XSS, and "user input" is **broader than form fields**, it includes cookies, HTTP headers, environment variables, filenames, uploaded files, API payloads, anything crossing the trust boundary. All of it must pass **strong input validation** before use (white-list, canonicalize, type-check; Lectures 4-5). And **don't trust third-party software** either, libraries and components are part of your attack surface and TCB (vulnerable dependencies, Lecture 6's pedigree analysis). This slide ties the whole design-principles lecture back to the course's central vulnerability lesson.

### Slide 54 · Security principles (recap)

> - secure the weakest link
> - defence in depth
> - principle of least privilege
> - minimise attack surface
> - compartmentalize
> - secure defaults
> - keep it simple
> - fail securely
> - promote privacy
> - hiding secrets is hard
> - use community resources
> - be reluctant to trust
> - ...

**Expansion.** The closing recap repeats the principle list of Slide 3. Taken together these are the designer's checklist: apply them at every level (Slide 4), accept that they overlap and sometimes conflict (resolve tensions with judgement, e.g., compartmentalization reconciling least privilege with simplicity), and use them both to *review* a design for weaknesses and to *guide* the choice of countermeasures. They are the "do's" that prevent the "don'ts" catalogued in the rest of the course.
`;export{e as default};
