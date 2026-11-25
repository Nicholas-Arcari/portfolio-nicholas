const e=`Lecture 1 sets the scene for the whole course: why software is the weakest link in the security chain, how a flaw differs from an exploitable vulnerability, and the core vocabulary (assets, threats, risks, countermeasures, CIA) used in every later lecture. The slide deck has 63 pages.

## Course logistics (pages 1-3)

### Slide 1 · Course website

> Google Classroom code: **xupdavne**
>
> Slides, course info, projects and communications will appear here

**Figure.** A QR code that opens the course's Google Classroom.

**Expansion.** Google Classroom is the single channel for course material: slides, announcements, the (possible) fuzzing project and exam communications. Join with the code above, preferably with your institutional Sapienza account, and keep e-mail notifications on so that project deadlines and exam-session announcements are not missed.

### Slide 2 · About Me

> **Daniele Friolo**
>
> - Ph.D. in **Cryptography**
> - Research Interests:
>   - Secure Multi-Party Computation
>   - Zero-Knowledge
>   - Blockchain Applications
>   - Advanced Encryption Schemes
>
> **Hours:** By appointment

**Figure.** A photo of the lecturer and a cartoon of symmetric encryption: the plaintext "Hello!" is locked with a key into unreadable ciphertext (a string of random symbols), sent across, and unlocked with a key back into "Hello!".

**Expansion.** The research topics on the slide are all areas of modern cryptography:

- **Secure Multi-Party Computation (MPC)**: protocols that let several parties jointly compute a function of their private inputs (for example, the average of their salaries) while revealing nothing beyond the result. Classic constructions are Yao's garbled circuits and the GMW protocol.
- **Zero-Knowledge (ZK) proofs**: a prover convinces a verifier that a statement is true ("I know the password", "this transaction is valid") without revealing anything else. A ZK proof must be *complete* (an honest prover convinces), *sound* (a cheating prover does not) and *zero-knowledge* (the verifier learns nothing more). Succinct non-interactive variants (zk-SNARKs, zk-STARKs) are widely used in blockchains.
- **Blockchain applications**: smart contracts and decentralised protocols, a domain where software bugs translate directly into stolen money (see Slides 16-17 and 29-31).
- **Advanced encryption schemes**: primitives beyond plain encryption, such as homomorphic encryption (computing on encrypted data) and attribute-based or functional encryption (fine-grained decryption rights).

The picture is the textbook model of **symmetric encryption**: the same secret key encrypts and decrypts. Cryptography protects data in transit and at rest, but, as this course stresses, it is only as strong as the software that implements and uses it. Office hours are by appointment.

### Slide 3 · About the Exam

> The *exam* is divided into
>
> - A written exam
> - (maybe) a project on fuzzing tools + oral discussion
> - (optional) oral exam -- can influence the final grade positively or negatively

**Expansion.**

- The **written exam** checks both theory (definitions, principles and classifications given on the slides) and practice: reading C, SQL or web code, spotting the vulnerability, explaining how it is exploited and proposing a fix. Every code snippet in these notes is analysed in exactly that format.
- **Fuzzing** is an automated testing technique that feeds a program with huge numbers of malformed, unexpected or random inputs and watches for crashes, hangs, failed assertions or sanitizer reports. Modern fuzzers (AFL/AFL++, libFuzzer, honggfuzz) are *coverage-guided*: they keep and further mutate the inputs that reach new code paths. Fuzzing tools are covered in Lecture 6 (Tools).
- The **optional oral exam** can move the grade in either direction, so it is worth taking only when the material is fully mastered.

## Introduction to Software Security (pages 4-6)

### Slide 4 · Title slide

> **Security in Software Applications**
>
> Introduction to Software Security

### Slide 5 · What is Software Security?

> Understanding the role that software plays
>
> - in providing *security*
> - as source of *insecurity*
>
> *Principles, methods & technologies* to make software more secure
>
> - Typical *threats* & *vulnerabilities* that make software less secure, and how to avoid them

**Expansion.** Software security has a double face, and the course deals with both.

1. **Software as a provider of security.** Almost every security mechanism is implemented in software: authentication and access control in operating systems and databases, TLS in network libraries, cryptographic libraries, firewalls, antivirus engines, sandboxes, password managers.
2. **Software as a source of insecurity.** The same software can be wrong. A bug in the implementation of a security mechanism can disable the protection completely: Heartbleed (CVE-2014-0160) was a missing bounds check in OpenSSL's TLS heartbeat code that leaked private keys and passwords from server memory. A bug in any other program can give an attacker a foothold.

The second half of the slide states the goal of the discipline: the *principles* (least privilege, defence in depth, secure defaults; Lecture 10), the *methods* (secure development life cycle, threat modelling, code review, security testing) and the *technologies* (type-safe languages, static analysis, fuzzing, compiler and OS protections) that make software more secure, together with knowledge of the typical *threats* and *vulnerabilities* (buffer overflows, format strings, injection, race conditions) and of how to avoid them.

A useful working definition, due to Gary McGraw: **software security is the idea of engineering software so that it continues to function correctly under malicious attack.** The key word is *malicious*: ordinary testing checks behaviour on normal or random inputs, whereas security assumes an intelligent adversary who deliberately chooses the worst possible input.

### Slide 6 · Why study Software Security?

> Software plays a major role in providing security, and is a major source of security problems.
>
> Software is the weakest link in the security chain, with the possible exception of "the human factor"
>
> Software security does not get much attention
>
> - in other security courses, or
> - in programming courses, or indeed, in much of the security literature!

**Expansion.**

- **Weakest link.** Security is a chain: an attacker does not break the strongest component (for example AES-256) but the weakest one. In practice cryptographic algorithms are rarely broken; what gets broken is the software around them: key handling, protocol implementations, input parsing, memory management, access-control checks. The only serious competitor for "weakest link" is the **human factor**: phishing, social engineering, weak or reused passwords, misconfiguration.
- **Why software is weak.** Software is huge (tens of millions of lines of code in an operating system or a browser), complex, written under time pressure, assembled from third-party libraries, and constantly changing. Steve McConnell (*Code Complete*) reports an industry average of about 1 to 25 errors per 1,000 lines of delivered code; even if only a small fraction is exploitable, large programs contain many vulnerabilities.
- **A neglected topic.** Classic security courses focus on cryptography and network security; programming courses teach how to make programs *work*, not how to make them resist *misuse*. As a result, developers keep producing well-known vulnerability patterns. This course fills that gap.

## The problem (pages 7-17)

Page 7 is the section divider "The problem".

### Slide 8 · The problem

> *Internet worms and viruses*
>
> - **virus** = harmful piece of code that can infect other programs
> - **worm** = self-replicating virus; no user action required for spreading infection
>
> First worm: Nov 1988, crashed 10% of internet
>
> - More recently
>   - *email viruses:* I Love You, Kournikova, …
>   - *Worms*: Slammer, Blaster, ...
> - More recently still: attackers have gone underground & commercial (deep web)

**Expansion.**

- **Virus vs worm.** A *virus* attaches itself to a host (an executable, a boot sector, a document macro) and spreads only when the infected host is run or shared, so it needs a user action. A *worm* is a standalone program that spreads by itself across the network, typically by exploiting a vulnerability in a network service: no user action is needed, which is why worms spread exponentially. Other malware families: *Trojan horse* (malicious code disguised as a useful program), *ransomware* (encrypts data and demands a ransom), *rootkit* (hides the attacker's presence), *botnet* (a network of compromised machines under remote control).
- **The Morris worm (2 November 1988).** Written by Robert T. Morris, then a Cornell graduate student, it infected about 6,000 of the roughly 60,000 hosts on the Internet at the time (the "10%" on the slide). It used three vectors:
  1. a **stack buffer overflow** in the \`fingerd\` daemon, which read its input with \`gets()\`, a function that never checks the buffer size (exactly the bug of Lecture 3);
  2. the \`DEBUG\` command of \`sendmail\`, which allowed remote command execution;
  3. trust relationships between hosts (\`rsh\`/\`rexec\`, \`.rhosts\` files) and password guessing.

  A bug in its re-infection logic made machines run many copies of the worm until they ground to a halt: a de facto denial of service. Consequences: the first conviction under the US Computer Fraud and Abuse Act, and the creation of CERT/CC at Carnegie Mellon University to coordinate incident response.
- **ILOVEYOU (May 2000).** A VBScript e-mail worm whose attachment \`LOVE-LETTER-FOR-YOU.TXT.vbs\` relied on Windows hiding the real \`.vbs\` extension. Once opened, it overwrote files and mailed itself to every contact in the Outlook address book; it reportedly infected more than ten million computers within days.
- **Anna Kournikova (February 2001).** Same mechanism: an attachment \`AnnaKournikova.jpg.vbs\` promising a picture of the tennis player. It was produced with a point-and-click "virus construction kit", showing that attackers no longer needed much skill.
- **Slammer (January 2003)** and **Blaster (August 2003)**: network worms exploiting buffer overflows in Microsoft SQL Server and in the Windows DCOM RPC service respectively (see the next slides).
- **Underground and commercial.** Since the mid-2000s attacks have moved from noisy, fame-seeking worms to silent, profit-driven operations: botnets rented out for spam and DDoS, credential theft, banking trojans, ransomware-as-a-service, and marketplaces that sell exploits, stolen data and access to compromised networks. Strictly speaking, the *deep web* is any content not indexed by search engines (including your webmail), while these markets live on the *dark web*, overlay networks such as Tor that require special software.

### Slides 9-10 · Slammer Worm (Jan 2002)

> Pictures taken from *The Spread of the Sapphire/Slammer Worm*, by David Moore, Vern Paxson, Stefan Savage, Colleen Shannon, Stuart Staniford, Nicholas Weaver

**Figure.** Two world maps from CAIDA (www.caida.org). The first, timestamped Sat Jan 25 05:29:00 2003 (UTC), reads "Number of hosts infected with Sapphire: 0". The second, half an hour later (Sat Jan 25 06:00:00 2003 UTC), reads 74,855 infected hosts, drawn as blue circles all over North America, Europe, East Asia, Australia and South America.

**Expansion.**

- **Date.** The slide title says January 2002, but the maps and all sources date the outbreak to **25 January 2003**, at about 05:30 UTC.
- **Vulnerability exploited.** A stack-based **buffer overflow** in the *Resolution Service* of Microsoft SQL Server 2000 and MSDE 2000, listening on **UDP port 1434**. Microsoft had published the patch (bulletin MS02-039) six months earlier, in July 2002: most victims had simply not applied it.
- **Why it was so fast.** The whole worm fitted in a single 376-byte UDP payload (404 bytes with headers). UDP needs no handshake, so each infected host sent copies to random IP addresses as fast as its network link allowed. The infected population doubled about every **8.5 seconds**, and about **90% of vulnerable hosts were infected within 10 minutes**: the fastest-spreading worm ever observed.
- **Effects.** The worm had no destructive payload, but its scanning traffic saturated networks: thousands of ATMs of a large US bank went offline, airline check-in systems failed, and 911 emergency services in Seattle were disrupted. It lived only in memory, so a reboot removed it (until the next reinfection).
- **Lessons.** (1) A single memory-safety bug in a network-facing service can be catastrophic. (2) Patches are useless if they are not applied. (3) Services should not be reachable from the Internet unless necessary: UDP 1434 had no reason to be exposed.

### Slide 11 · Famous Vulnerabilities: Cisco Router

> *Cisco Router* (source US-CERT)
>
> Published: 2011-01-24
>
> Vulnerability No: CVE-2011-0352
>
> CVSS Severity Score: 7.88
>
> Vendor/Product: cisco -- linksys\\_wrt54gc\\_router\\_firmware
>
> *Buffer overflow* in the *web-based management interface* on the Cisco Linksys WRT54GC router with firmware before 1.06.1 allows remote attackers to cause a denial of service (device crash) via a long string in a POST request.

**Expansion.**

- **How to read these reports.** Each entry in this series follows the format of the US-CERT / NIST National Vulnerability Database (NVD):
  - **CVE ID** (Common Vulnerabilities and Exposures, maintained by MITRE): a unique public name \`CVE-<year>-<number>\` for one vulnerability in one product.
  - **CVSS score** (Common Vulnerability Scoring System): severity from 0.0 to 10.0, computed from metrics such as attack vector, attack complexity, privileges required, user interaction and impact on confidentiality, integrity and availability. CVSS v3 ranges: Low 0.1-3.9, Medium 4.0-6.9, High 7.0-8.9, Critical 9.0-10.0 (CVSS v2, used in 2011, had High = 7.0-10.0). Scores have one decimal: the NVD lists **7.8** for this CVE.
  - **Vendor/product** string identifying the affected software.
- **The bug.** The embedded web server copies data from an HTTP POST request into a fixed-size buffer without checking its length. A long string overflows the buffer, corrupts adjacent memory and crashes the firmware: a **denial of service**, i.e., a violation of availability. With a carefully crafted payload, overflows of this kind often give code execution, not just a crash.
- **Why embedded devices.** Routers, cameras and IoT devices run C code with few protections (often no ASLR, no stack canaries), are rarely updated, and their management interfaces are sometimes exposed to the Internet.
- **Typical vulnerable pattern and fix** (illustrative, not the actual firmware code):

\`\`\`c
/* Vulnerable: the POST body is copied into a fixed buffer */
void handle_post(const char *body) {
    char value[256];
    strcpy(value, body);              /* no length check: overflow if body has 256+ bytes */
    /* ... */
}

/* Fixed: reject oversized input before copying */
int handle_post(const char *body, size_t len) {
    char value[256];
    if (len >= sizeof value)
        return -1;                    /* input too long: refuse it */
    memcpy(value, body, len);
    value[len] = '\\0';
    /* ... */
    return 0;
}
\`\`\`

Operational fixes: update to firmware 1.06.1 or later, and never expose the administration interface on the WAN side.

### Slide 12 · Famous Vulnerabilities: FFmpeg

> *FFmpeg* (source US-CERT)
>
> Published: 2011-01-24
>
> Vulnerability No: CVE-2010-4705
>
> CVSS Severity Score: 9.3
>
> Vendor/Product: ffmpeg -- ffmpeg
>
> *Integer overflow* in the vorbis\\_residue\\_decode\\_internal function in libavcodec/vorbis\\_dec.c in the Vorbis decoder in FFmpeg, possibly 0.6, *has unspecified impact and remote attack vectors*, related to the sizes of certain integer data types. NOTE: this might overlap CVE-2011-0480

**Expansion.**

- **Integer overflow.** An arithmetic result does not fit in its integer type. In C, *unsigned* arithmetic wraps around modulo 2^n (for a 32-bit \`unsigned int\`, 4,294,967,295 + 1 = 0); *signed* overflow is undefined behaviour and in practice usually wraps to a negative number. On its own it is "just" a wrong number, but it becomes a memory-corruption vulnerability when the wrong number is used as a **size, length or index**: a size computation that wraps to a small value leads to a too-small allocation followed by a large copy (heap overflow); a negative index slips past an upper-bound check.
- **Why media decoders.** FFmpeg's libavcodec parses complex binary formats (here Ogg Vorbis audio) whose header fields (counts, sizes, offsets) are chosen by whoever created the file. Any media file opened by a player, a browser or a server-side thumbnail generator is untrusted input coming from the network.
- **Score 9.3 (critical).** Remote attack vector, no authentication, complete impact on confidentiality, integrity and availability: a crafted audio file can potentially execute code inside the decoding process.
- **Typical vulnerable pattern and fix:**

\`\`\`c
/* count and size are read from the file header: attacker-controlled */
uint32_t count = read_u32(f);
uint32_t size  = read_u32(f);
uint8_t *buf = malloc(count * size);      /* 32-bit product can wrap around to a small value */
for (uint32_t i = 0; i < count; i++)
    fread(buf + (size_t)i * size, 1, size, f);   /* writes far beyond the allocation */
\`\`\`

\`\`\`c
/* Fixed: check BEFORE multiplying, and compute the size in size_t */
if (size != 0 && count > SIZE_MAX / size)
    return AVERROR_INVALIDDATA;           /* product would overflow: reject the file */
uint8_t *buf = calloc(count, size);       /* calloc also checks count * size internally */
if (buf == NULL)
    return AVERROR(ENOMEM);
\`\`\`

### Slide 13 · Famous Vulnerabilities: Linux/Windows/MACOS

> *Linux/Windows/MACOS*
>
> Published: 2011-01-24
>
> Vulnerability: CVE-2011-0638 CVE-2011-0640 CVE-2011-0639
>
> CVSS Severity Score: 9.3
>
> Vendor/Product: Apple Mac OS X/Microsoft - windows/Linux - Linux kernel
>
> Microsoft Windows /Mac OS X/ Linux does not properly warn the user before enabling additional Human Interface Device (HID) functionality over USB, which allows user-assisted attackers to execute arbitrary programs via crafted USB data, as demonstrated by keyboard and mouse data sent by malware on a smartphone that the user connected to the computer.

**Expansion.**

- **What HID is.** USB devices declare a *class*. Operating systems trust devices of the HID class (keyboards, mice) automatically, with no driver installation and no confirmation, because a keyboard is assumed to be operated by the person sitting at the computer.
- **The attack.** A malware-infected smartphone, plugged in "just to charge", re-declares itself as a keyboard and mouse and *types* commands at machine speed (open a terminal, download and run a payload). The OS cannot distinguish these keystrokes from the user's own. The research was presented at Black Hat DC 2011 by Angelos Stavrou and Zhaohui Wang. It is a **design flaw** (implicit trust in a device class), not a coding bug.
- **User-assisted** means that the victim must do something (here, plug in the phone), which lowers but does not cancel the severity.
- **Descendants.** USB Rubber Ducky (a keystroke-injection stick), *BadUSB* (2014, reprogramming the firmware of ordinary USB sticks), malicious cables.
- **Countermeasures.** Ask the user to authorise new HID devices (USBGuard on Linux, device-control policies on Windows and macOS), lock unattended screens, use charge-only cables or USB data blockers, disable USB ports in sensitive environments.

### Slide 14 · Famous Vulnerabilities: Mozilla/Bugzilla

> *Mozilla/Bugzilla*
>
> Published: 2011-01-28
>
> Vulnerability: CVE-2010-4568
>
> CVSS Severity Score: 7.5
>
> Vendor/Product: Mozilla - Bugzilla
>
> Bugzilla 2.14 through 2.22.7; 3.0.x, 3.1.x, and 3.2.x before 3.2.10; 3.4.x before 3.4.10; 3.6.x before 3.6.4; and 4.0.x before 4.0rc2 does *not properly generate random values* for cookies and tokens, which allows remote attackers to obtain *access to arbitrary accounts* via unspecified vectors, related to an insufficient number of calls to the srand function

**Expansion.**

- **Session cookies and tokens must be unpredictable.** After login, a web application recognises the user by a random value (the session cookie); password-reset links and anti-CSRF tokens are random values too. Whoever guesses the value *is* the user. These values must come from a **cryptographically secure pseudo-random number generator (CSPRNG)** and carry enough entropy (at least 128 bits).
- **What went wrong.** A pseudo-random number generator (PRNG) is deterministic: given its seed and internal state, the whole output sequence is known. \`srand(seed)\` sets the seed and \`rand()\` returns the next number. Bugzilla generated its tokens with a non-cryptographic PRNG that was seeded too rarely, so the values it produced could be predicted and an attacker could compute valid login cookies for other users' accounts.
- **Lesson.** \`rand()\`/\`srand()\` (C, Perl), \`java.util.Random\`, \`Math.random()\` (JavaScript) and Python's \`random\` module are fine for simulations and games, never for security. Use \`getrandom()\` or \`/dev/urandom\`, \`java.security.SecureRandom\`, \`crypto.getRandomValues()\`, Python's \`secrets\` module.

\`\`\`c
/* Vulnerable: predictable token */
srand(time(NULL));              /* the seed is the current second: easy to guess */
unsigned token = rand();        /* small range and predictable from the seed */

/* Fixed (Linux): 256 bits from the kernel CSPRNG */
#include <sys/random.h>
unsigned char token[32];
if (getrandom(token, sizeof token, 0) != sizeof token)
    abort();                    /* never fall back to a weak generator */
\`\`\`

### Slide 15 · Famous Vulnerabilities: Tandberg videoconferencing

> *Tandberg videoconferencing*
>
> Published: Feb 2 2011
>
> Vulnerability: CVE-2011-0354
>
> Vendor/Product: Tandberg - video conferencing
>
> TANDBERG Videoconferencing Systems *Default Account* Lets *Remote Users Gain Root Access*
>
> The device includes a root administrator account with no password. A remote user can access the system with root privileges.
>
> The root user account is used for advanced debugging and is not required for normal operations.

**Expansion.**

- **Class of flaw.** A **configuration and design flaw**, not a memory bug: a passwordless root account left in the product for debugging, effectively a backdoor. In CWE terms: use of default or hard-coded credentials (CWE-1392, CWE-798).
- **Impact.** Anyone who can reach the device over the network logs in as root and controls it completely, including the camera and microphone of a boardroom: a confidentiality disaster as well as an integrity one.
- **Principles violated.** *Secure defaults* (a product must be secure out of the box), *attack surface reduction* (debug features must not ship enabled), *least privilege*. See Lecture 10 (Design Principles).
- **A large-scale repeat.** The Mirai botnet (2016) took over hundreds of thousands of IoT cameras and routers simply by trying about 60 factory-default username/password pairs over Telnet; its DDoS attack on the DNS provider Dyn made major websites unreachable.
- **Fix.** No default or hidden accounts; force the administrator to set a unique password at first boot; strip debug accounts and interfaces from production builds; install the vendor's fixed firmware.

### Slides 16-17 · Famous Vulnerabilities: are they still relevant?

> *These vulnerabilities seem pretty old, do we need to worry in more modern systems?*
>
> https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword=smart+contract

**Figure (page 17).** A screenshot of the CVE search results for the keyword "smart contract". Every row has the same description: "The mintToken function of a smart contract implementation for *token*, an Ethereum token, has an integer overflow that allows the owner of the contract to set the balance of an arbitrary user to any value."

| CVE | Ethereum token |
| --- | --- |
| CVE-2018-13780 | ESH |
| CVE-2018-13779 | YLCToken |
| CVE-2018-13778 | CGCToken |
| CVE-2018-13777 | RRToken |
| CVE-2018-13776 | AppleToken |
| CVE-2018-13775 | RCKT\\_Coin |
| CVE-2018-13774 | Bitstarti |
| CVE-2018-13773 | Enterprise Token Ecosystem (ETE) (Contract Name: NetkillerToken) |
| CVE-2018-13772 | TheFlashToken |
| CVE-2018-13771 | ExacoreContract |
| CVE-2018-13770 | UltimateCoin |
| CVE-2018-13769 | JeansToken |
| CVE-2018-13768 | ZToken |
| CVE-2018-13767 | Cornerstone |
| CVE-2018-13766 | Easticoin |
| CVE-2018-13765 | LandCoin |
| CVE-2018-13764 | BiquToken |

**Expansion.** Yes, we need to worry: the same bug classes keep reappearing in new technologies. In 2018 dozens of Ethereum tokens turned out to contain the very integer overflow of the FFmpeg entry, this time written in Solidity.

**Code analysis: integer overflow in \`mintToken\` (Solidity).** The vulnerable contracts were copied from a common token template:

\`\`\`solidity
// Solidity < 0.8: arithmetic on uint256 wraps around silently
function mintToken(address target, uint256 mintedAmount) onlyOwner public {
    balanceOf[target] += mintedAmount;   // can wrap around modulo 2^256
    totalSupply += mintedAmount;         // can wrap around too
    emit Transfer(0, this, mintedAmount);
    emit Transfer(this, target, mintedAmount);
}
\`\`\`

- **Vulnerability.** Before Solidity 0.8, \`+\`, \`-\` and \`*\` on \`uint256\` wrap around modulo 2^256 without any error. Choosing \`mintedAmount = 2^256 - balanceOf[target] + X\` sets the target's balance to *any* value X (hence "set the balance of an arbitrary user to any value"), even lower than before, and \`totalSupply\` wraps too, breaking the invariant "sum of all balances = totalSupply".
- **Who can exploit it.** The function is \`onlyOwner\`, so the attacker is the contract owner, or whoever steals the owner's key. It is still a vulnerability: token holders rely on the published code to guarantee that the owner cannot rewrite their balances or secretly inflate the supply.
- **Fix.** Use checked arithmetic and cap the supply:

\`\`\`solidity
pragma solidity ^0.8.0;   // from 0.8, overflow reverts the transaction by default

function mintToken(address target, uint256 mintedAmount) external onlyOwner {
    require(totalSupply + mintedAmount <= MAX_SUPPLY, "cap exceeded");
    balanceOf[target] += mintedAmount;   // reverts on overflow
    totalSupply += mintedAmount;
    emit Transfer(address(0), target, mintedAmount);
}
\`\`\`

With older compilers the same effect is obtained with OpenZeppelin's \`SafeMath\` library (\`balanceOf[target] = balanceOf[target].add(mintedAmount);\`, which reverts on overflow).

- **Same mistake, higher stakes.** The "BatchOverflow" bug (April 2018, CVE-2018-10299) in the BeautyChain (BEC) token computed \`uint256 amount = uint256(cnt) * _value;\`. With two receivers and \`_value = 2^255\` the product overflowed to 0, the balance check \`balances[msg.sender] >= amount\` passed, and each receiver was credited 2^255 tokens; exchanges suspended trading of many tokens. Smart contracts are public, immutable once deployed and hold money directly: a bug cannot be patched quickly and is exploited within hours.

## Superficial analysis (pages 18-24)

Page 18 is the section divider "Superficial analysis".

### Slide 19 · Observation 1

> All these problems are due to (bad) software
>
> Namely,
>
> - the Linux/Windows/Mac Operating System (OS)
> - the router software
> - the videoconferencing system software
> - the FFmpeg graphics engine
> - ...
>
> Such software bugs are why constant patching of systems is needed to keep them secure

**Expansion.**

- None of the incidents of the previous slides required breaking cryptography or defeating a firewall: each one was a defect in a program. Even the USB case is a design defect in operating-system software, and the Tandberg case is a defect in the configuration the vendor shipped. (FFmpeg is, more precisely, a multimedia framework for audio and video; libavcodec is its codec library.)
- **Patching is reactive.** Vendors fix bugs after they are disclosed and release patches (Microsoft's monthly "Patch Tuesday", Linux distribution security updates, Android security bulletins). This has three structural weaknesses:
  1. the window between disclosure and installation of the patch is exactly when attackers strike: patches are reverse-engineered (*patch diffing*) to locate the bug and build "N-day" exploits within days or hours;
  2. many systems are never patched (embedded devices, legacy servers, the SQL servers hit by Slammer);
  3. patches can themselves introduce new bugs or break functionality, which makes administrators delay them.
- Constant patching is therefore a *symptom*. The root cause is insecure software, which this course attacks at design and coding time.

### Slides 20-21 · Observation 2

> All these problems are due to (bad) software that
>
> - can be executed over the network (eg. *Slammer worm*)
> - executes on (untrusted) input obtained over the network (eg. *FFmpeg*)
>
> With ever more network connectivity, ever more software can be attacked.

(page 21)

> Traditionally, focus on operating system and network security
>
> - regular patching of OS
> - firewalls, virus scanners
>
> Increasingly, web applications and web browsers are the weak link and obvious targets to attack
>
> Also, mobile devices and embedded software are targeted.
>
> - Traditional distinction between OS, network, and application gradually disappearing anyway.

**Expansion.**

- **Two ways in which the network reaches software.**
  1. *Directly reachable services*: the program listens on a port (SQL Server's UDP 1434 for Slammer, a web server, an SSH daemon), so any host on the Internet can send it bytes.
  2. *Programs that consume network data*: the program does not listen, but processes data that came from the network (a media player decoding a downloaded video, a browser rendering a page, a PDF reader, a mail client parsing attachments). The attacker only needs the victim to open a file or visit a page.
- **Untrusted input** is any data whose content can be influenced, even partially, by someone other than the program's owner: network packets, files, URLs, form fields, cookies, environment variables, command-line arguments. The golden rule of software security is *never trust input*: validate it before using it (Lecture 5, Input Validation).
- **Attack surface** is the set of all entry points through which untrusted input reaches a system. More connectivity (cloud, mobile, IoT, public APIs) means a larger attack surface. Reducing it (closing ports, disabling unused features, validating input at every entry point) is a basic design principle.
- **Why the focus moved.** Traditional defences protect the perimeter: patch the OS, filter traffic with a firewall, scan files with an antivirus. But a firewall must let web traffic through to the web application, and a virus scanner cannot recognise an exploit for an unknown bug. The attack goes through the open door, straight to the application.
- **Why web applications and browsers.** Web applications are reachable by everybody, written quickly in many languages and frameworks, and talk to databases and operating systems (SQL injection, XSS, CSRF, command injection). Browsers execute untrusted code (JavaScript, WebAssembly) from every visited site and parse dozens of complex formats; they are among the most attacked, and therefore most hardened, programs (sandboxing, site isolation).
- **Mobile and embedded.** Smartphones hold credentials, messages, location and payment data; embedded and IoT devices (routers, cameras, cars, medical devices, industrial controllers) often run outdated C code with weak or missing update mechanisms.
- **Blurring boundaries.** Browsers run full applications like an operating system; containers, virtual machines and cloud services mix the OS and network layers; software-defined networking turns network devices into software. Security can no longer be delegated to "the OS and the firewall": every application must defend itself.

### Slide 22 · Changing the nature of attackers

> - Traditionally, hackers are amateurs motivated by fun, publishing attacks for the prestige
> - Increasingly, hackers are professional
>   - attackers go underground: zero-day exploits are worth money
> - attackers include
>   - organized crime with lots of money and (hired) expertise
> - government agencies: with even more money & in-house expertise
>
>   'Classic' example: *Stuxnet* https://www.ted.com/talks/ralph\\_langner\\_cracking\\_stuxnet\\_a\\_21st\\_century\\_cyber\\_weapon

**Expansion.**

- **Zero-day (0-day).** A vulnerability unknown to the vendor (who has had "zero days" to fix it), and the exploit that uses it. Since no patch exists, every user is exposed. Once disclosed and patched, it becomes an *N-day* vulnerability.
- **Threat actors**, in order of increasing resources:
  1. *Script kiddies*: little skill, ready-made tools, opportunistic targets.
  2. *Hacktivists*: political motivation (defacements, leaks, DDoS).
  3. *Insiders*: employees or contractors abusing legitimate access.
  4. *Organised crime*: profit-driven; ransomware (often run as "ransomware-as-a-service" with affiliates), banking trojans, botnets, fraud, theft of data for resale.
  5. *Nation-state actors*, often called APTs (Advanced Persistent Threats): intelligence and military units with large budgets, in-house exploit development, and long, stealthy campaigns of espionage or sabotage.
- **The exploit market.** *White market*: vendor bug bounty programmes and contests such as Pwn2Own. *Grey market*: brokers that buy exploits and resell them, mostly to governments (next two slides). *Black market*: criminals selling to criminals.
- **Stuxnet** (discovered in June 2010) is the "classic" state-sponsored attack. It was built to sabotage the uranium enrichment plant at Natanz, Iran:
  - it spread through USB sticks to reach networks that were not connected to the Internet (air-gapped);
  - it used **four Windows zero-days**, including the \`.LNK\` shortcut flaw (CVE-2010-2568) that executed code simply when a folder was displayed, and a print-spooler bug;
  - its drivers were signed with **stolen code-signing certificates** (from Realtek and JMicron), so Windows trusted them;
  - its payload reprogrammed **Siemens S7 PLCs** (programmable logic controllers) driving the centrifuges, making them spin at destructive speeds while replaying normal sensor values to the operators.

  It is widely attributed to a joint US-Israeli operation. Ralph Langner, speaker of the linked TED talk, was among the first to decode the PLC payload. Stuxnet shows that software vulnerabilities can cause physical damage, and that states invest heavily in them.

### Slides 23-24 · Current 0day prices

**Figure (page 23): ZERODIUM Payouts for Desktops/Servers** (price list dated 2019/01, zerodium.com). Legend: Windows, macOS, Linux/BSD, Any OS. RCE: Remote Code Execution; LPE: Local Privilege Escalation; SBX: Sandbox Escape or Bypass; VME: Virtual Machine Escape. Footnote: "All payouts are subject to change or cancellation without notice. All trademarks are the property of their respective owners."

| Payout | Exploits |
| --- | --- |
| Up to $1,000,000 | Win RCE Zero Click (Windows) |
| Up to $500,000 | Chrome RCE+LPE (Windows) · Apache RCE (Linux) · MS IIS RCE (Windows) |
| Up to $250,000 | MS Outlook RCE · MS Exchange RCE (Windows) · OpenSSL RCE · PHP RCE (Linux) |
| Up to $200,000 | VMware ESXi VME · Thunderbird RCE (Win/Linux) · Sendmail RCE · Postfix RCE · Dovecot RCE · Exim RCE · nginx RCE (Linux) |
| Up to $100,000 | Safari RCE+LPE (Mac) · Edge RCE+LPE · Firefox RCE+LPE · Word/Excel RCE (Windows) · WordPress RCE · cPanel/WHM RCE · Plesk RCE · Webmin RCE (Linux) |
| Up to $80,000 | VMware WS VME (Win/Linux) · Adobe PDF RCE+SBX · WinRAR RCE · 7-Zip RCE · Windows LPE/SBX (Windows) |
| Up to $50,000 | USB LPE (Win/Mac) · Antivirus RCE · WinZip RCE (Windows) · tar RCE · Linux LPE (Linux) · macOS LPE/SBX (Mac) · BSD LPE (BSD) |
| Up to $10,000 | Routers RCE · Antivirus LPE (Windows) · phpBB RCE · vBulletin RCE · MyBB RCE · Joomla RCE · Drupal RCE · Roundcube RCE · Horde RCE (Linux) |

**Figure (page 24): ZERODIUM Payouts for Mobiles** (price list dated 2019/09). Legend: iOS, Android, Any OS. FCP: Full Chain with Persistence; RCE: Remote Code Execution; LPE: Local Privilege Escalation; SBX: Sandbox Escape or Bypass.

| Payout | Exploits |
| --- | --- |
| Up to $2,500,000 | Android FCP Zero Click |
| Up to $2,000,000 | iOS FCP Zero Click |
| Up to $1,500,000 | WhatsApp RCE+LPE Zero Click (iOS/Android) · iMessage RCE+LPE Zero Click (iOS) |
| Up to $1,000,000 | WhatsApp RCE+LPE · SMS/MMS RCE+LPE (iOS/Android) |
| Up to $500,000 | Persistence (iOS) · WeChat RCE+LPE · iMessage RCE+LPE (iOS) · FB Messenger RCE+LPE · Signal RCE+LPE · Telegram RCE+LPE · Email App RCE+LPE (iOS/Android) · Chrome RCE+LPE (Android) · Safari RCE+LPE (iOS) |
| Up to $200,000 | Baseband RCE+LPE · LPE to Kernel/Root · Media Files RCE+LPE · Documents RCE+LPE (iOS/Android) · SBX for Chrome · Chrome RCE w/o SBX (Android) · SBX for Safari · Safari RCE w/o SBX (iOS) |
| Up to $100,000 | Code Signing Bypass · WiFi RCE · RCE via MitM · Information Disclosure · \\[k\\]ASLR Bypass (iOS/Android) · LPE to System · PIN Bypass (Android) · Passcode Bypass · Touch ID Bypass (iOS) |

**Expansion.**

- **Who Zerodium is.** An exploit-acquisition company, founded in 2015, that buys zero-day exploits from researchers and resells them, mainly to government customers. Its public price list is a good indicator of what vulnerabilities are worth on the grey market.
- **Reading the tables.**
  - *RCE* runs attacker code on the target remotely; *LPE* turns limited access into administrator, root or kernel privileges; *SBX* escapes a sandbox (browsers and messaging apps process content in restricted processes, so an RCE alone is not enough); *VME* escapes from a virtual machine to the host.
  - A real attack needs a **chain**: RCE, then SBX, then LPE, often plus persistence. *FCP* (full chain with persistence) is the complete chain, surviving reboots.
  - *Zero click* means no user interaction at all (no link to click, no file to open): the exploit fires when a message is received. These are the most valuable.
- **What drives the price.** (1) The number of potential targets (Windows, Chrome, WhatsApp, iOS, Android); (2) how hard the target is to exploit, i.e., how hardened it is (mobile systems combine code signing, sandboxing, ASLR and more, so working chains are rare); (3) whether user interaction is required; (4) reliability and stealth of the exploit.
- In the 2019 mobile list an Android full chain ($2.5M) was priced above an iOS one ($2M), a sign that at that time Android exploits were harder to obtain or iOS exploits more plentiful.
- **Implications.** Vulnerabilities are a commodity: one memory-safety bug in a widely used program can be worth millions of dollars. Software security is an economic arms race, and safer code raises the attacker's cost. Real-world use: commercial spyware such as NSO Group's Pegasus used zero-click iMessage chains; FORCEDENTRY (2021, CVE-2021-30860) began with an integer overflow in an image decoder, the same bug class as the FFmpeg entry on Slide 12.

## Causes of the problem (pages 25-45)

Page 25 is the section divider "Causes of the problem".

### Slides 26-28 · Quick poll

> how many of you learned to program in C or C++?
>
> - how many of you have built a web-application?
>
> \\- in which languages?
>
> Major causes of problems are
>
> - lack of *awareness*
> - lack of *knowledge*

**Expansion.** The poll makes a point: most programmers learn C or C++ (languages without memory safety, home of buffer overflows and format string bugs) and build web applications (home of injection and XSS), but almost nobody is taught how these languages and platforms fail under attack.

- **Lack of awareness**: developers do not realise that their code can be attacked, or which parts of it are exposed ("who would ever send a 10,000-character username?").
- **Lack of knowledge**: even developers who care do not know the dangerous APIs (\`gets\`, \`strcpy\`, \`sprintf\`, \`system\`, SQL built by string concatenation), the attack techniques, or the safe alternatives.

Both causes are curable by education, which is why "First Step: Awareness" follows shortly. The numbers confirm the diagnosis: about 70% of the vulnerabilities Microsoft fixes every year are memory-safety bugs (Microsoft, 2019), with a similar share among serious Chromium bugs; injection and XSS have been in the OWASP Top 10 of web risks since its first edition (2003).

### Slides 29-31 · Functionality vs Security

> Security is a secondary concern
>
> - Security is always a secondary concern
> - primary goal of software is to provide some functionality or services; managing associated risks is a derived/secondary concern
>
> There is often a trade-off/conflict between
>
> - security
> - functionality & convenience
>
> *where security typically loses out*
>
> However, due to recent attacks due to wrong usage of smart contracts code (causing loss of billions of dollars), awareness in software security is increasing
>
> (at least for blockchains and the underlying VMs…)

**Expansion.**

- **Why security is secondary.** Nobody buys software *for* its security: users buy features, and vendors compete on time-to-market. Security is a *non-functional* requirement, like performance or reliability, whose value is noticed only when it fails, while its costs (development time, testing, reduced convenience) are paid up front.
- **Typical trade-offs.**
  - *Usability vs security*: passwords, two-factor authentication, confirmation dialogs and session timeouts annoy users; "remember me" and auto-login are convenient but risky.
  - *Features vs attack surface*: every plug-in, file format, macro language or remote-management interface is new attack surface (Office macros, Flash, Java applets).
  - *Performance vs checks*: C omits array bounds checks for speed; developers skip validation or encryption "to go faster".
  - *Compatibility vs security*: legacy protocols (SSLv3, SMBv1, NTLM) kept alive for old clients.
- **Smart contracts as a turning point.** On a blockchain, code *is* money: a contract holds funds, anyone can call it, its code is public, and an exploit is instant and irreversible. Examples: **The DAO** (2016, about $60M drained through a *reentrancy* bug, which led to the Ethereum / Ethereum Classic split), the **Parity multisig wallet** (2017: $30M stolen in July, then hundreds of millions of dollars frozen forever in November when a user accidentally destroyed a shared library contract), and cross-chain bridges such as **Poly Network** (2021, about $611M, a contract logic flaw) and **Wormhole** (2022, about $325M, a signature-verification bug). Cumulative losses run into billions of dollars, so the blockchain world invests heavily in audits, formal verification and safer languages and virtual machines.

### Slide 32 · Functionality vs Security

> *Functionality* is about what an application **does**.
>
> *Security* is about what an application should **not** do.
>
> Unless you think like an attacker, you will be unaware of any potential threats.

**Expansion.** This is one of the key ideas of the course.

- Functional requirements are *positive* ("the user can transfer money to another account") and can be checked with a finite set of test cases: exercise the feature, compare the output with the expected one.
- Security requirements are mostly *negative* ("nobody can transfer money out of someone else's account", "no input can make the program execute attacker code"). Checking a negative property means considering *all* possible inputs, action sequences and environments, including absurd ones that no legitimate user would ever produce. Testing can show the presence of vulnerabilities, never their absence.
- Hence the need to **think like an attacker** (the adversarial mindset): for every feature, ask "how could this be abused?" (abuse cases, threat modelling, penetration testing). A program can be perfectly correct on all normal inputs and still be insecure because of what it *also* does on malicious inputs: a login form can work flawlessly for honest users and also accept \`' OR '1'='1\` as a password (SQL injection, Lecture 9).

### Slide 33 · Functionality vs Security: Lost battles?

> Lost battles?
>
> - operating systems
>   - huge OS, with huge attack surface (API).
> - programming languages
>   - buffer overflows, format strings, ... in C
>   - public fields in Java
>   - ...
> - web browsers
>   - plug-ins for various formats, javascript, ajax, …
> - email clients
>
> Some programming languages are not designed well enough to minimize the developer's burden of assessing security.
>
> - A desperate case: PHP

**Expansion.** The slide lists areas where functionality has historically beaten security so badly that the battle seems lost.

- **Operating systems.** Linux offers hundreds of system calls and Windows thousands of API functions, plus drivers and file systems; the Linux kernel alone has more than 30 million lines of code. Every interface reachable by an unprivileged process is a potential privilege-escalation path. Mitigations: minimal installations, system-call filtering (seccomp), microkernels.
- **Programming languages.**
  - *C and C++*: no bounds checks, manual memory management and unchecked variadic functions such as \`printf\` give buffer overflows (Lecture 3), format string bugs (Lecture 4), use-after-free and integer overflows. The programmer must get every single memory access right.
  - *Public fields in Java*: breaking encapsulation lets any code, including untrusted code running in the same JVM, read or change internal state and bypass validation (example below).
- **Web browsers.** For years, plug-ins (Adobe Flash, Java applets, ActiveX controls, PDF readers) ran with the full privileges of the user and were the main vector of "drive-by downloads". JavaScript and AJAX turned the browser into an application platform that runs untrusted code from every website. Flash reached its end of life on 31 December 2020, and the old plug-in interfaces have been removed from modern browsers.
- **E-mail clients** render HTML, run scripts and macros and preview attachments in complex formats (Office documents, PDFs, images): ILOVEYOU and Kournikova were e-mail-borne.
- **PHP, "a desperate case".** Many of its historical design choices made insecure code the default:
  - \`register_globals\` (removed in PHP 5.4) turned every request parameter into a global variable, so \`?authorized=1\` could set an uninitialised \`$authorized\` flag (example below);
  - \`magic_quotes\` gave a false sense of protection against SQL injection;
  - the old \`mysql_*\` API encouraged building SQL queries by string concatenation;
  - \`include\`/\`require\` accepting remote URLs enabled remote file inclusion;
  - loose comparison \`==\` with type juggling: \`"0e1234" == "0e5678"\` is true, because both strings are read as 0 in scientific notation, which breaks hash comparisons ("magic hashes");
  - \`unserialize()\` on user data enables object injection.

  Modern PHP has removed or deprecated most of these, but legacy code is everywhere.

**Code analysis: public fields in Java.**

\`\`\`java
public class Account {
    public int balance;                                   // anyone can write: acc.balance = 1_000_000;
    public static final String[] ADMINS = {"alice"};      // final reference, but mutable contents!
}
\`\`\`

- *Vulnerability.* Any class can read or write \`balance\`, so no invariant (balance never negative, changes only through authorised operations) can be enforced. \`final\` only freezes the reference: \`Account.ADMINS[0] = "mallory";\` still works.
- *Fix.* Encapsulate the state: private fields, validated methods, immutable collections.

\`\`\`java
public final class Account {
    private int balance;
    private static final List<String> ADMINS = List.of("alice");   // truly immutable

    public int getBalance() { return balance; }

    public void deposit(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        balance = Math.addExact(balance, amount);                  // throws on overflow
    }

    public static List<String> admins() { return ADMINS; }
}
\`\`\`

**Code analysis: \`register_globals\` in PHP.**

\`\`\`php
<?php
// With register_globals = On, the request "page.php?authorized=1" creates $authorized = "1"
if (check_password($_POST['user'], $_POST['pass'])) {
    $authorized = true;
}
if ($authorized) {          // never initialised: controlled by the attacker
    show_admin_panel();
}
\`\`\`

- *Vulnerability.* The attacker sets \`$authorized\` from the URL and skips the password check entirely.
- *Fix.* Always initialise variables (\`$authorized = false;\` at the top), read input only explicitly from \`$_GET\`/\`$_POST\`, and never run with \`register_globals\` (the option no longer exists since PHP 5.4).

### Slide 34 · First Step: Awareness

> - that there might be a problem
> - of what needs protecting, from which threats
> - of the fact that you might lack knowledge

**Expansion.** Awareness has three levels, one per bullet:

1. *There might be a problem*: accept that your software can and will be attacked. "Nobody would bother attacking us" is false: automated scanners probe every Internet-facing host within minutes of it going online.
2. *What needs protecting, from which threats*: identify assets and threats before choosing countermeasures. This is threat modelling (see "Security concepts" at the end of this lecture).
3. *You might lack knowledge*: know the limits of your own expertise; use vetted libraries instead of home-made cryptography or parsers, ask for reviews, keep up to date (OWASP, CWE Top 25, SEI CERT secure coding standards).

### Slides 35-36 · Weakness in depth

**Figure (page 35).** A layered picture of the environment an application runs in. At the top, an orange box, "**interpretable** or **executable** input data, eg paths, filenames, .doc, .xls, .pdf, .js, ...", with a thick black arrow pointing into the **application**. The application sits inside a green cloud labelled **programming languages**, which also contains **middleware**, **webbrowser with plugins**, **platform (eg Java or .NET)**, **libraries**, an **sql database** (drawn as a cylinder), the **operating system** and the **system APIs**. Underneath everything lies the **hardware (incl network card & peripherals)**.

> Software
>
> - runs on a huge, complicated infrastructure
>   - OS, platforms, webbrowser, lots of libraries & APIs, ...
> - is built using complicated languages
>   - programming languages, but also SQL, HTML, XML, ...
> - using various tools
>   - compilers, IDEs, preprocessors, dynamic code downloads
>
> These may have security holes, and may make the introduction of security holes very easy & likely

**Expansion.**

- The title plays on **defence in depth** (several independent layers of protection, so that a single failure is not fatal). Here the situation is reversed: **weakness in depth**. Every layer below the application can contain vulnerabilities, and the application inherits all of them. A perfect application on a vulnerable library, OS or CPU is not secure: Heartbleed (the OpenSSL library, 2014), Log4Shell (the Log4j logging library, CVE-2021-44228), Spectre and Meltdown (the processor itself, 2018).
- **Input that is interpreted or executed.** The orange box is the crucial point: input is not "just data". Paths and filenames are interpreted by the file system (\`../../etc/passwd\`, path traversal); documents (.doc, .xls, .pdf) can contain macros and scripts; \`.js\` *is* code. Whenever input reaches an interpreter (SQL engine, shell, HTML/JavaScript engine, XML parser), an attacker can try to make it treat part of the data as commands. This is the root of every **injection attack** (Lecture 5, Input Validation; Lecture 9, SQL Injection).
- **Complicated languages.** A typical web application mixes C (the web server), Java, PHP or Python, SQL, HTML, JavaScript, CSS, XML or JSON, shell scripts and regular expressions. Each language has its own special characters and parsing rules, and mistakes happen at the boundaries between them.
- **Tools.** Compilers can remove security code: an optimiser may delete a \`memset\` that wipes a password (the buffer is never read again) or an overflow check that relies on undefined behaviour. Build tools and dependencies can be compromised (*supply-chain attacks*: SolarWinds Orion in 2020, the xz-utils backdoor in 2024). "Dynamic code downloads" (plug-ins, auto-updates, scripts loaded from third-party servers) run code nobody reviewed. Ken Thompson's Turing Award lecture *Reflections on Trusting Trust* (1984) describes a compiler that inserts a backdoor into the programs it compiles, and into new versions of itself.

### Slide 37 · Flaw or Vulnerability?

> Confusing terminology
>
> Security weakness, flaw, vulnerability, bug, error, coding defect …
>
> Important distinction
>
> - Security weakness / flaw:
>   - Something that is wrong or could be better ...
> - Security vulnerability
>   - Flaw that can be exploited by an attacker to violate a policy
>
> So, a flaw must be
>
> - Accessible: an attacker must have access to it
> - Exploitable: an attacker must be able to use it to compromise the system

**Expansion.**

- **A precise vocabulary.**
  - *Error* (mistake): the human action that produces an incorrect result (the programmer types \`<=\` instead of \`>=\`).
  - *Defect* (bug, fault): the resulting incorrect code.
  - *Failure*: the observable wrong behaviour when the defective code runs.
  - *Weakness* (flaw): a defect, design choice or configuration that *could* contribute to a security problem. MITRE's **CWE** (Common Weakness Enumeration) catalogues weakness *types*, e.g. CWE-787 Out-of-bounds Write, CWE-89 SQL Injection, CWE-79 Cross-site Scripting.
  - *Vulnerability*: a weakness in a specific product that an attacker can actually reach and exploit to violate the security policy. MITRE's **CVE** list names individual vulnerabilities: CVE-2011-0352 (Slide 11) is one concrete buffer overflow, an instance of the weakness type CWE-120, Buffer Copy without Checking Size of Input.
  - *Exploit*: the input, code or procedure that triggers a vulnerability to achieve the attacker's goal.
- **Accessible and exploitable.** A buffer overflow in a function that only ever processes a constant string is a flaw but not a vulnerability: the attacker cannot reach it. A bug that needs a 10 GB input in a service that accepts at most 1 KB is not exploitable. But reachability changes over time: code that is safe today becomes vulnerable when someone later connects it to network input. Hence weaknesses should be fixed even when no exploit is known.
- **Policy.** "To violate a policy" ties the definition to the security goals: a vulnerability is always relative to what the system is supposed to guarantee (confidentiality, integrity, availability; see the end of this lecture).

### Slide 38 · Software Flaws

> Software flaws can be introduced at two levels
>
> 1. Design flaw - the flaw is introduced during the design
> 2. Bug / code-level flaw - the flaw is introduced during implementation
>
> *Equally common*
>
> Vulnerabilities can also arise from other levels
>
> - Configuration flaws - when installing the SW
> - "User" flaws
> - Unforeseen consequences of intended functionality (e.g., spam …)

**Expansion.**

- **Design flaws** (architectural): the specification or architecture is itself insecure, so even a perfect implementation is vulnerable. Examples: a protocol without authentication (Telnet; WEP Wi-Fi encryption with reused initialisation vectors), trusting the client (a price computed in the browser and sent to the server), passwords stored in plain text, the implicit trust in USB keyboards of Slide 13, missing authorisation checks by design. Fixing a design flaw often means redesigning, which is expensive; finding it requires architectural risk analysis and threat modelling.
- **Implementation bugs** (code level): the design is sound but the code is wrong: a missing bounds check (buffer overflow), a forgotten input check, string concatenation in a SQL query, a race condition. They can often be found by code review, static analysis, testing and fuzzing.
- *Equally common*: Gary McGraw (*Software Security: Building Security In*) estimates that roughly half of all security problems are design flaws and half are bugs. Automated tools are good at finding bugs and poor at finding design flaws.
- **Other sources.**
  - *Configuration flaws*: secure software deployed insecurely: default passwords, debug mode left on in production, overly permissive file permissions or cloud storage buckets open to the world, unnecessary services enabled, outdated TLS settings. "Security misconfiguration" is a category of the OWASP Top 10.
  - *"User" flaws*: users choosing weak passwords, clicking through certificate warnings, falling for phishing, switching off security features. Good design reduces them (secure defaults, usable security).
  - *Unforeseen consequences of intended functionality*: the feature works exactly as designed, but is abused. E-mail was designed for open delivery, and spam is the consequence. Other examples: a "forgot password" page that reveals which usernames exist (account enumeration), open URL redirects used in phishing, "send this page to a friend" turned into a spam relay, open DNS resolvers used to amplify DDoS attacks.

### Slide 39 · Coding Flaws

> Software flaws that can be introduced during implementation can be roughly distinguished into
>
> 1. Flaws that can be understood by looking at the program
>
>    e.g., typos, confusing program variables, off-by-one, access to array, error in program logic, …
> 2. Flaws due to the interaction with the underlying platform or with other systems
>    - Buffer overflow in C(++) code
>    - Integer overflow/underflow in most programming languages
>    - SQL injection, XSS, CSRF, … in web applications

**Expansion.**

- **Type 1: flaws visible in the program text.** Logic errors: the source code alone shows that the program does the wrong thing, independently of the machine it runs on. A classic off-by-one:

\`\`\`c
char buf[10];
for (int i = 0; i <= 10; i++)   /* off-by-one: the loop runs 11 times */
    buf[i] = 'A';               /* buf[10] is one element past the end */

/* Fix: for (int i = 0; i < 10; i++), or better i < sizeof buf */
\`\`\`

Other type 1 examples: inverted conditions, the wrong variable used, a missing \`break\` in a \`switch\`, \`=\` written instead of \`==\`. Code review and ordinary testing find them.

- **Type 2: flaws due to the interaction with the platform or with other systems.** The program looks correct at the abstract level ("copy the name into the buffer", "add the two amounts", "look up the user in the database"), but the underlying platform does not behave like the abstraction:
  - *Buffer overflow in C/C++*: C arrays carry no bounds, and writing past the end silently overwrites adjacent memory (other variables, saved return addresses). Understanding it requires knowing the memory layout of a process (Lecture 3).
  - *Integer overflow/underflow*: mathematical integers are unbounded, machine integers are not (32 or 64 bits, two's complement). Java and C# wrap around silently by default; Python has unbounded integers; Rust panics on overflow in debug builds and wraps in release builds unless checked operations are used.
  - *SQL injection, XSS (Cross-Site Scripting) and CSRF (Cross-Site Request Forgery) in web applications*: the problem appears at the boundary between the application and another system. In injection, user data crosses into another language (SQL for the database, HTML/JavaScript for the browser) and is interpreted as code. CSRF abuses the fact that browsers attach cookies automatically: a malicious site makes the victim's browser send an authenticated request to another site where the victim is logged in.

  These flaws are "lower level" and harder to see: one must understand the semantics of the platform, not just the program.

### Slides 40-42 · Spot the security flaws

The code on page 40, transcribed from the slide image:

\`\`\`c
int balance;

void decrease(int amount)
{   if (balance <= amount)
        { balance = balance - amount; }
    else { printf("Insufficient funds\\n"); }
}

void increase(int amount)
{   balance = balance + amount;
}
\`\`\`

(On the slide the string uses typographic quotes and the minus sign is an en dash; in real C they must be the ASCII characters \`"\` and \`-\`.)

The professor's annotations on page 41:

> - on \`if (balance <= amount)\`: *should be >=*
> - on \`decrease(int amount)\`: *what if amount is negative?*
> - on \`balance = balance + amount;\`: *what if the sum is too large for an int?*

The professor's classification on page 42 (the first bubble reads "should be >)" on the slide, a typo for ">="):

> - *should be >=*: 1. Logic error. *Can be found by code inspection only*
> - *what if amount is negative?*: 2. Lack of input validation of (untrusted) user. *Design flaw or implementation flaw?*
> - *what if the sum is too large for a 64 bit int?*: 3. Problem with interaction with underlying platform. *lower level than previous ones*

**Code analysis.**

*What the code does.* A global variable \`balance\` models a bank account; \`decrease\` should withdraw \`amount\` when the funds are sufficient, \`increase\` deposits \`amount\`.

*Flaw 1: logic error (inverted condition).* The withdrawal runs only when \`balance <= amount\`, i.e., exactly when the account does **not** have enough money, and is refused when it does. With \`balance = 100\`, \`decrease(500)\` leaves a balance of -400, while \`decrease(50)\` prints "Insufficient funds". The condition must be \`balance >= amount\`. The error is visible just by reading the code (a type 1 flaw of Slide 39): a code review or a single unit test finds it.

*Flaw 2: missing input validation (negative amounts).* Nothing checks that \`amount > 0\`. Even with flaw 1 fixed:

- \`decrease(-1000)\`: the test \`balance >= -1000\` passes and \`balance - (-1000)\` *adds* 1000. A "withdrawal" that creates money.
- \`increase(-1000)\`: a "deposit" that silently withdraws, bypassing the funds check and driving the balance below zero.

If \`amount\` comes from a user (a web form, an API call), the attacker controls it. Design flaw or implementation flaw? Both answers are defensible, which is the point of the slide's question: it is a *design* flaw if the specification never said that amounts must be positive (a missing requirement); it is an *implementation* flaw if the specification said so and the programmer forgot the check. Simply switching to an unsigned type is no cure: negative inputs would turn into huge positive values that wrap around.

*Flaw 3: integer overflow (interaction with the platform).* \`int\` has a fixed size: 32 bits on all mainstream platforms, so \`INT_MAX\` is 2,147,483,647, and even a 64-bit integer has a maximum, as the slide stresses. If \`balance + amount\` exceeds the maximum, signed overflow is **undefined behaviour** in C; in practice the result wraps around to a large negative number. A big deposit can thus turn a rich account into a debt, and \`balance - amount\` with a negative \`amount\` can overflow too. The source code is mathematically correct; the flaw only appears once you know how machine integers behave (a type 2 flaw, "lower level").

*Further issues (beyond the slide).*

- **No error reporting**: \`decrease\` returns \`void\`, so the caller cannot know whether the withdrawal happened.
- **Race condition**: \`balance\` is a shared global variable. If two threads run \`decrease\` at the same time, both can pass the check before either subtracts (a *check-then-act* race), spending the same money twice; \`balance = balance + amount\` is not atomic either. See Lecture 11 (Race Conditions).
- **Money in \`int\`**: amounts need a well-defined unit (e.g., cents in a 64-bit integer) or a decimal type, never floating point.
- The \`printf\` is safe because its format string is a constant (compare Lecture 4, Format Strings).

*Fixed version.*

\`\`\`c
#include <limits.h>
#include <stdbool.h>
#include <stdio.h>

static long long balance = 0;       /* in cents; not visible outside this file */

/* Returns true on success, false if the request is rejected. */
bool decrease(long long amount)
{
    if (amount <= 0) {              /* flaw 2: validate the untrusted input */
        fprintf(stderr, "Invalid amount\\n");
        return false;
    }
    if (balance < amount) {         /* flaw 1: proceed only if balance >= amount */
        printf("Insufficient funds\\n");
        return false;
    }
    balance -= amount;              /* safe: 0 < amount <= balance, no underflow */
    return true;
}

bool increase(long long amount)
{
    if (amount <= 0) {              /* flaw 2 */
        fprintf(stderr, "Invalid amount\\n");
        return false;
    }
    if (balance > LLONG_MAX - amount) {   /* flaw 3: test BEFORE adding */
        fprintf(stderr, "Amount too large\\n");
        return false;
    }
    balance += amount;
    return true;
}
\`\`\`

Notes on the fix:

- The overflow test is rearranged as \`balance > LLONG_MAX - amount\` rather than \`balance + amount > LLONG_MAX\`, because the latter would overflow before the comparison is made. GCC and Clang also offer \`__builtin_add_overflow(balance, amount, &result)\`, which performs the addition and reports whether it overflowed.
- In a multi-threaded program both functions must also hold a lock (e.g., a \`pthread_mutex_t\`) around the check and the update, so that check and update happen atomically.

### Slide 43 · Tackling software security

> To prevent standard mistakes, knowledge is crucial
>
> - mistakes may depend on the programming language, on the platform (Op.Sys., DB, Web app, ...) and on the (type of) application
>
> but knowledge alone is not enough: security must be taken into account from the beginning and throughout the software development life cycle

**Expansion.**

- **Knowledge is context-specific.** A C programmer must know buffer overflows and format strings; a Java programmer deserialisation and reflection; a web developer injection, XSS, CSRF and session management; a mobile developer insecure data storage and inter-app communication; a smart-contract developer reentrancy and integer overflow. Reference sources: the CWE Top 25 Most Dangerous Software Weaknesses, the OWASP Top 10 (web) and OWASP Mobile Top 10, the SEI CERT coding standards for C, C++ and Java.
- **Why knowledge is not enough.** A developer who knows every pitfall can still build an insecure system if security was never designed in: missing requirements (who may access what?), an architecture without trust boundaries, no testing of abuse cases. Security is a property of the whole system and of the whole process.
- **Cost of late fixes.** The later a defect is found, the more it costs: a flaw caught in design costs a fraction of one found after release, which brings patches, incident response and reputation damage. Hence "**shift left**": move security activities as early as possible in the **SDLC** (Software Development Life Cycle: requirements, design, implementation, testing, deployment, maintenance).

### Slide 44 · Evolution in tackling software security

> Organizations tackle security at the end of the SDLC and with time have moved the concern to earlier stages, for example, chronologically:
>
> 1. First, *do nothing*
>    - Some problem may happen and then we patch
> 2. then implement support for *regular patching*
> 3. Products are *pen-tested* pre-emptively
> 4. Use *static analysis* tools on code produced
> 5. then *train* programmers to know about common problems
> 6. then think about *abuse cases* and develop security tests for them
> 7. then start thinking about security *before* starting the development

**Expansion.** The seven steps describe the maturity path that large vendors actually followed. Microsoft is the textbook case: after the worms of 2001-2003 (Code Red, Nimda, Slammer, Blaster), Bill Gates's *Trustworthy Computing* memo (January 2002) led to the **Microsoft Security Development Lifecycle (SDL)**, mandatory for its products from 2004.

1. *Do nothing, patch when broken* ("penetrate and patch"): purely reactive; customers act as testers.
2. *Regular patching*: an organised patch process (Patch Tuesday, automatic updates). Still reactive.
3. *Penetration testing*: security experts attack the finished product before release. Useful, but it comes late, is expensive and finds only a sample of the problems.
4. *Static analysis*: tools scan the source code for known bug patterns (Lecture 6, Tools; Lecture 7, Program Analysis). It scales and can run on every commit, at the price of false positives and false negatives.
5. *Training*: fewer bugs get written in the first place.
6. *Abuse cases and security tests*: thinking, at requirements level, about how each feature can be misused, and turning that into tests.
7. *Security before development*: security requirements, threat modelling and secure design (Lecture 12, Secure Software Design; Lecture 13, Security Engineering for Software).

Each step moves security earlier in the life cycle; mature organisations do all seven at once. Maturity models such as **BSIMM** (Building Security In Maturity Model) and **OWASP SAMM** (Software Assurance Maturity Model) measure how far an organisation has progressed.

### Slide 45 · Security in Software Development Life Cycle

**Figure.** Six development artefacts drawn as boxes along a line, in development order: **Requirements and use cases**, **Architecture and design**, **Test plans**, **Code**, **Tests and test results**, **Feedback from the field**. A large circular arrow behind them shows that the cycle repeats. Arrows from above attach a security activity to each artefact:

| Artefact | Security activities pointing at it |
| --- | --- |
| Requirements and use cases | Abuse cases, Security requirements |
| Architecture and design | Risk analysis (from the requirements/design boundary onwards), External review |
| Test plans | Risk-based security tests |
| Code | Code review (tools) |
| Tests and test results | Risk analysis, Penetration testing |
| Feedback from the field | Penetration testing, Security operations |

**Expansion.** This is Gary McGraw's model of the **seven touchpoints** (*Software Security: Building Security In*, 2006). Instead of a separate security process, a small set of security activities is attached to artefacts that every development process already produces, whether waterfall or agile. McGraw ranks the touchpoints by effectiveness:

1. **Code review (tools)**: static analysis plus manual review, to find implementation bugs.
2. **Architectural risk analysis**: find design flaws by analysing threats against the architecture and their impact.
3. **Penetration testing**: attack the running system as an attacker would, guided by the risk analysis.
4. **Risk-based security testing**: test plans aimed at the highest risks (white-box), not just at functionality.
5. **Abuse cases**: describe how an attacker can misuse the system ("as an attacker, I want to ..."), the dark side of use cases.
6. **Security requirements**: explicit requirements such as "passwords are stored with a slow, salted hash" or "every access to a medical record is logged".
7. **Security operations**: monitoring, logging and incident response, feeding the lessons of real attacks back into development.

*External review* (analysis by people outside the design team) is an extra touchpoint, because an internal team shares the same blind spots. The circular arrow conveys that what is learnt in operation feeds the next iteration.

## Security concepts (pages 46-63)

Page 46 is the section divider "Security concepts".

### Slide 47 · Security and software

> - Security is about regulating access to assets
>
> \\- eg. information or functionality
>
> - Software provides functionality
>
> \\- eg on-line exam results
>
> - This functionality comes with certain risks
>
> \\- eg what are risks of on-line exam results?
>
> - Software security is about managing these risks

**Expansion.**

- **Asset**: anything of value to a stakeholder that must be protected: data (grades, personal data, credentials), functionality (the ability to publish grades), resources (CPU time, bandwidth, storage), and also reputation.
- **Risks of on-line exam results** (the slide's question), organised by security goal:
  - *Confidentiality*: other people see your grade (a privacy breach, and a GDPR violation); all students' results can be enumerated by changing the student ID in the URL (an *insecure direct object reference*).
  - *Integrity*: a student or an outsider changes grades (SQL injection in a form, stolen professor credentials, a forged "publish grade" request via CSRF).
  - *Availability*: the site is down on the day results are published (a DoS attack, or simply overload).
  - *Accountability*: who entered or changed a grade, and can they deny it afterwards?
- **Managing risk** does not mean eliminating it. Risk is usually estimated as likelihood × impact, and the goal is to bring it down to an acceptable level at an acceptable cost (Slide 50).

### Slide 48 · Security concepts (diagram)

**Figure.** A concept map of how the security notions relate to each other. The defending side is written in black (**owners**, **countermeasures**, **availability/usefulness**, **assets**), the attacking or negative side in red (**attackers**, **threats**, **vulnerabilities**, **risks**). Every arrow of the diagram:

| From | Relation | To |
| --- | --- | --- |
| owners | want to maximise | availability/usefulness |
| owners | want to minimise | risks |
| owners | impose | countermeasures |
| countermeasures | reduce | risks |
| countermeasures | may have | vulnerabilities |
| vulnerabilities | require | countermeasures |
| availability/usefulness | increase | risks |
| availability/usefulness | of | assets |
| attackers | give rise to | threats |
| attackers | want to abuse | assets |
| threats | exploit | vulnerabilities |
| threats | increase | risks |
| threats | to | assets |
| vulnerabilities | lead to | risks |
| risks | to | assets |

An orange "cycle" icon sits between countermeasures and vulnerabilities, marking the loop: countermeasures may have vulnerabilities, which require new countermeasures.

**Expansion.** The diagram adapts the security-concepts model of the **Common Criteria** (ISO/IEC 15408), the international standard for the security evaluation of IT products. Read as a story:

- **Owners** value their **assets** and want them to be as available and useful as possible. But usefulness itself *increases risk*: the more a system is reachable, connected and feature-rich, the more it can be abused. A computer switched off and buried in concrete is perfectly secure and perfectly useless.
- **Attackers** want to abuse the assets and *give rise to* **threats** (potential harmful actions). Threats *exploit* **vulnerabilities**, and thereby create **risks** for the assets.
- Owners *impose* **countermeasures** to reduce risks. But countermeasures are themselves (usually software) systems and *may have* vulnerabilities, which *require* further countermeasures: an endless loop. Antivirus engines, for instance, parse every untrusted file with high privileges and have themselves been exploited (note the "Antivirus RCE/LPE" rows in the Zerodium table of Slide 23).
- **Risk** combines the likelihood that a threat exploits a vulnerability with the impact on the asset. A vulnerability no threat can reach, or an asset of no value, carries little risk.

Security is therefore a **balance**: maximising usefulness and minimising risk pull in opposite directions (Slides 29-31).

### Slide 49 · Security concepts (inventory)

> Any discussion of security should start with an inventory of
>
> - the *stakeholders*,
> - their *assets*, and
> - the *threats* to these assets by possible attackers
> - employees, clients, script kiddies, criminals
>
> Any discussion of security without understanding these issues is *meaningless*

**Expansion.**

- **Stakeholders**: everyone with an interest in the system: owners, users, customers, administrators, developers, regulators, and third parties whose data is processed. Different stakeholders have different, sometimes conflicting, goals: a bank wants to log every transaction, its customers want privacy.
- **Assets** of each stakeholder (Slide 47).
- **Threats and attackers.** The last bullet lists possible attackers, each with different capabilities and motivations:
  - *employees* (insiders): they already have access and knowledge, and are often the most dangerous;
  - *clients*: legitimate users trying to obtain more than they are entitled to (tampering with prices, quotas, other users' data);
  - *script kiddies*: unskilled and opportunistic, using ready-made tools;
  - *criminals*: skilled and profit-driven.

  Stating which of them we defend against is the **attacker model** (or threat model).
- *Meaningless*: "Is this system secure?" has no answer without "secure **against whom**, protecting **what**, **for whom**?". A system secure against script kiddies may fall to a nation-state; encryption that protects data from outsiders does nothing against a malicious administrator. This inventory is the first step of **threat modelling** (e.g., STRIDE, Slide 56; attack trees), developed in the design lectures.

### Slide 50 · Security concepts (policy and mechanisms)

> Security is about imposing countermeasures to reduce risks to assets to acceptable levels
>
> - A *security policy* is a specification of what *security requirements/goals* the countermeasures are intended to achieve
>   - secure against what and from whom?
> - *Security mechanisms* to enforce the policy
> - Bottlenecks:
>   - expressing what we (don't) want in a policy
>   - enforcing this, dynamically or statically

**Expansion.**

- **Acceptable levels.** Perfect security does not exist, and approaching it would be unaffordable. The four classic ways to treat a risk: *reduce* it (countermeasures), *transfer* it (insurance, outsourcing), *avoid* it (drop the risky feature), *accept* it (consciously, when protection would cost more than the expected loss).
- **Policy vs mechanism.** The *policy* states **what** must hold ("only the account owner can read the account statements", "students read their own grades, professors write grades for their own courses"). The *mechanism* states **how** it is enforced (passwords, access-control lists, encryption, type checking, sandboxing). Keeping them separate lets one mechanism enforce many policies and makes policies auditable. Classic formal policies: Bell-LaPadula for confidentiality ("no read up, no write down"), Biba for integrity ("no read down, no write up"), Chinese Wall for conflicts of interest.
- **Bottleneck 1: expressing the policy.** Policies are often implicit, incomplete or contradictory, and writing down everything that must *not* happen is hard (recall Slide 32: security is about what an application should not do).
- **Bottleneck 2: enforcing it.**
  - *Dynamically*, at run time: checks executed while the program runs (access-control checks, array bounds checks in Java, stack canaries, runtime monitors). They are precise for the actual execution, but cost performance and catch a problem only when it happens.
  - *Statically*, before running: type systems, static analysis and formal verification establish properties for *all* possible executions without running the program, but must approximate (producing false alarms), because most interesting properties of programs are undecidable (Rice's theorem). See Lecture 7 (Program Analysis).

### Slide 51 · Security Objectives: CIA

> - **Confidentiality**
>   - unauthorized users cannot *read* information
> - **Integrity**
>   - unauthorised users cannot *alter* information
> - **Availability**
>   - authorised users can *access* information
>
> But also
>
> - **Non-repudiation** (for accountability)
>   - authorised users cannot deny actions

**Expansion.**

- **Confidentiality**: information is disclosed only to authorised parties. Mechanisms: access control, encryption. Violations: data breaches, eavesdropping, side channels. Confidentiality can also concern *metadata* (who talks to whom, and when).
- **Integrity**: information and systems are modified only by authorised parties, in authorised ways; unauthorised modification is prevented or at least detected. Mechanisms: access control, checksums and MACs, digital signatures, input validation. The integrity of *code* and of the program's control flow matters as much as that of data: a buffer overflow that overwrites a return address is an integrity violation.
- **Availability**: authorised users get timely access to information and services. Violations: DoS and DDoS attacks, crashes (the Cisco overflow of Slide 11), ransomware, resource exhaustion. Mechanisms: redundancy, rate limiting, robust input handling, backups.
- **Non-repudiation**: a party cannot later deny having performed an action (sending a message, signing a contract, approving a payment). It requires strong authentication plus tamper-evident evidence, typically **digital signatures** (only the holder of the private key can produce them) and protected audit logs. It supports **accountability**: every action can be traced back to a responsible individual.
- Other models extend the triad: some textbooks add *authenticity* (data really comes from its claimed sender); the Parkerian hexad adds *possession/control*, *authenticity* and *utility*.

### Slide 52 · Security Objectives

> Integrity is nearly always more important than confidentiality
>
> E.g. think of
>
> - your bank account information
> - your medical records
> - all your software, incl. entire OS
>
> Availability may be undesirable for privacy
>
> - you want certain data to be or become unavailable

**Expansion.**

- **Why integrity usually wins.** If someone *reads* your bank balance, it is embarrassing; if someone *changes* it, you lose money. If someone reads your medical record, your privacy is violated; if someone *alters* it (blood group, allergies, dosages), you may be harmed or killed. If someone reads your software, little happens (much software is open source anyway); if someone *modifies* it (malware, backdoors, a tampered OS), they control everything, confidentiality included, since a compromised OS can read all your data. The integrity of software is the foundation of every other property.
- **Availability vs privacy.** Availability is usually desirable, but sometimes the goal is the opposite: data should *not* be available, or should stop being available after a while:
  - the GDPR's *right to erasure* (the "right to be forgotten", Art. 17);
  - data-retention limits (logs deleted after a fixed period);
  - ephemeral messages and *forward secrecy* (session keys are destroyed, so past traffic cannot be decrypted later even if long-term keys leak);
  - wiping passwords and keys from memory as soon as they are no longer needed.

### Slide 53 · Security goals

> The well-known trio
>
> - *confidentiality, integrity, authentication* (CIA)
>
> but there are more "concrete" goals
>
> - *traceability* and *auditing* (forensics)
> - *monitoring* (real-time auditing)
> - *multi-level security*
> - *privacy* & *anonymity*
> - ...
>
> and meta-property
>
> - *assurance* - that the goals are met

**Expansion.**

- **Note on the acronym.** Here the "A" of CIA is written as *authentication*, while Slide 51 uses *availability*. In standard terminology (ISO/IEC 27000, NIST) **CIA = Confidentiality, Integrity, Availability**; authentication is a separate goal and mechanism (the first "A" of AAAA, Slide 54). Know both versions, since the slide text may be quoted.
- **Traceability and auditing (forensics)**: actions are recorded (who did what, when) in tamper-resistant logs, so that incidents can be investigated afterwards and attributed.
- **Monitoring (real-time auditing)**: logs and events are analysed while the system runs (intrusion detection systems, SIEM platforms), so that attacks are spotted and stopped as they happen.
- **Multi-level security (MLS)**: data and users carry classification levels (Unclassified < Confidential < Secret < Top Secret), and the system controls information flows between levels (Bell-LaPadula). Typical of military and government systems.
- **Privacy and anonymity**: privacy is control over one's personal data (what is collected and for which purpose); anonymity is the impossibility of linking an action to an identity (Tor, mix networks). Related notions: pseudonymity, unlinkability, data minimisation.
- **Assurance**: a *meta*-property, i.e., a property *about* the other properties: the justified confidence that the system really meets its security goals. It is built from evidence (design reviews, testing, code review, formal verification) and certification, e.g. the Common Criteria Evaluation Assurance Levels EAL1 to EAL7.

### Slide 54 · How to realise security objectives? AAAA

> - **Authentication**
>   - who are you?
> - **Access control/Authorisation**
>   - control who is allowed to do what
>   - this requires a specification of who is allowed to do what
> - **Auditing**
>   - check if anything went wrong
> - **Action**
>   - if so, take action

**Expansion.**

- **Authentication** verifies a claimed identity. Factors: something you *know* (password, PIN), something you *have* (smart card, phone, hardware token), something you *are* (fingerprint, face). Multi-factor authentication combines factors of different kinds. It applies to people, but also to machines and messages (TLS certificates, MACs).
- **Authorisation (access control)** decides whether an authenticated subject may perform an operation on an object. The "specification of who is allowed to do what" is the **access-control policy**, expressed with models such as access-control lists (ACLs), capabilities, role-based (RBAC) or attribute-based (ABAC) access control. It is enforced by a *reference monitor*, which must be always invoked (*complete mediation*), tamper-proof, and small enough to be verified. A classic bug is authentication without authorisation: checking *that* a user is logged in, but not *which* user owns the requested resource.
- **Auditing** records security-relevant events and reviews them, to find out whether something went wrong (policy violations, intrusions).
- **Action** is the response: block an account, revoke credentials, patch, restore from backups, prosecute.
- Do not confuse this with the networking acronym *AAA*: Authentication, Authorization and Accounting (RADIUS, Diameter).

### Slide 55 · How to realise security objectives?

> Other names for the last three A's
>
> - **Prevention**
>   - measures to stop breaches of security goals
> - **Detection**
>   - measures to detect breaches of security goals
> - **Reaction**
>   - measures to recover assets, repair damage, and prosecute (and deter) offenders
>
> **NB** don't be tempted into thinking that good prevention makes detection & reaction superfluous.
>
> Eg. breaking into any house with windows is trivial; despite this absence of prevention, detection & reaction still deter burglars.

**Expansion.**

- **Mapping.** Access control/authorisation is **prevention**; auditing is **detection**; action is **reaction**. (The slide writes "persecute"; the intended word is *prosecute*, i.e., take legal action against the offenders.)
- *Prevention* in software: input validation, type-safe languages, least privilege, encryption, stack canaries and non-executable memory (Lecture 8, Buffer Overflow Defences).
- *Detection*: intrusion detection systems, log monitoring, file-integrity checkers, anomaly detection, crash reports, honeypots.
- *Reaction*: incident-response plans, backups and recovery, patching, key revocation, legal action.
- **The house analogy.** Window glass offers almost no prevention, yet most houses are never burgled, because burglars fear being *detected* (alarms, neighbours, cameras) and the *reaction* (police, prison). Deterrence works as well as barriers. In software, prevention is never perfect (there is always one more unknown bug), so systems must also be able to detect a compromise and recover from it. This is part of **defence in depth** and of the modern "assume breach" mindset.

### Slide 56 · Threats vs security requirements

> Threats vs security requirements
>
> - information disclosure
>   - *confidentiality*
> - tampering with information
>   - *integrity*
> - denial-of-service (DoS)
>   - *availability*
> - spoofing
>   - *authentication*
> - unauthorised access
>   - *access control*

**Expansion.** Each threat is the violation of a security requirement, and the requirement is what the countermeasures must guarantee. The mapping is essentially Microsoft's **STRIDE** classification of threats (Loren Kohnfelder and Praerit Garg, 1999), widely used in threat modelling:

| STRIDE threat | Property violated | Example |
| --- | --- | --- |
| **S**poofing | Authentication | logging in with stolen credentials, forged e-mail sender, IP or ARP spoofing |
| **T**ampering | Integrity | changing a price in an HTTP request, SQL injection that updates rows, memory corruption |
| **R**epudiation | Non-repudiation | a user denies having made a payment and there is no log or signature to prove it |
| **I**nformation disclosure | Confidentiality | data breach, verbose error messages, path traversal reading \`/etc/passwd\` |
| **D**enial of service | Availability | flooding, crashing a service with an overlong input, algorithmic-complexity attacks |
| **E**levation of privilege | Authorisation (access control) | buffer overflow in a setuid program giving root, admin pages without checks |

The slide's "unauthorised access" corresponds to elevation of privilege. Repudiation, the violation of non-repudiation (Slide 51), is the one STRIDE category the slide does not list.

### Slide 57 · Countermeasures

> Countermeasures can be non-IT related
>
> - physical security of building
> - screening of personnel
> - legal framework to deter criminals
> - police to catch criminals
> - ...
>
> but we won't consider these
>
> Also, they can lead to new vulnerabilities
>
> - eg. if we only allow three incorrect logins, as a countermeasure to brute-force password guessing attacks, which new vulnerability do we introduce?
>
> If a countermeasure relies on software, bugs in this software may mean that it is ineffective, or worse still, that it introduces more weaknesses

**Expansion.**

- **Answer to the slide's question.** Locking an account after three failed logins introduces a **denial-of-service vulnerability**: anyone who knows or guesses a username can lock its legitimate owner out on purpose, just by typing three wrong passwords. At scale, an attacker can lock out *every* account (usernames are often predictable: e-mail addresses, student IDs), or a specific victim at a critical moment (just before an online auction closes, or a trading deadline). If the lockout message differs for non-existent accounts, it also enables *user enumeration*.
- **Better alternatives**: progressively longer delays after each failure (exponential back-off), temporary lockouts that expire automatically, CAPTCHAs after a few failures, rate limiting per source IP *and* per account, multi-factor authentication, notifying the user, and rejecting passwords that appear in lists of breached passwords.
- **Countermeasures with bugs.** Security software is software: it often runs with high privileges and processes untrusted input, so its bugs are especially dangerous. Examples: antivirus engines exploited through the very files they scan; vulnerabilities in VPN gateways and firewalls exploited on a large scale; Heartbleed in OpenSSL, the library that provides TLS confidentiality, which leaked private keys and passwords; the faulty CrowdStrike Falcon update of July 2024, which crashed about 8.5 million Windows machines, an availability disaster caused by a security product.

### Slide 58 · Countermeasures (security technologies)

> Security technologies we can use
>
> - cryptography
>   - for threats related to insecure communication and storage
> - access control
>   - for threats related to misbehaving users
>
>     e.g. *role-based access control*
> - language-based security
>   - for threats related to misbehaving programs
>     - *typing*, memory-safety
>     - *sandboxing*
>     - eg Java, .NET/C#

**Expansion.**

- **Cryptography** protects data *in transit* (TLS, SSH, VPNs) and *at rest* (disk encryption, encrypted databases, password hashing with bcrypt, scrypt or Argon2). It provides confidentiality (encryption) and integrity and authenticity (MACs, digital signatures). It does not help when the endpoint software is compromised: data must be decrypted where it is used.
- **Access control** limits what users and processes can do. *Role-based access control* (RBAC) assigns permissions to roles (student, professor, administrator) and roles to users, which simplifies administration and supports least privilege and separation of duties. Other models: discretionary (DAC, e.g. Unix file permissions), mandatory (MAC, e.g. SELinux), attribute-based (ABAC).
- **Language-based security** protects against misbehaving *programs* (buggy or malicious code) through guarantees given by the programming language and its runtime:
  - *type safety*: operations are applied only to values of the right type, so for instance an integer can never be used as a pointer;
  - *memory safety*: no out-of-bounds accesses, no use-after-free, no dangling pointers (Java, C#, Python, Go and Rust check bounds and manage memory). Memory safety alone eliminates buffer overflows (Lecture 3), the most common vulnerability class of C and C++;
  - *sandboxing*: running code with restricted permissions, so that even malicious code cannot touch files, the network or other resources (the Java applet sandbox, .NET Code Access Security, browser sandboxes, WebAssembly).

  The Java Security Manager has been deprecated (Java 17) and .NET Code Access Security is not supported in .NET Core, so today's sandboxing relies mainly on OS processes, containers and WebAssembly. The current push towards memory-safe languages (Rust in the Linux kernel, Android and Windows; the 2024 report of the US Office of the National Cyber Director recommending memory-safe languages) is language-based security in action.

### Slide 59 · Security technologies

> May be provided by the infrastructure/platform an application builds on, for instance
>
> - networking infrastructure
>   - which may eg. use SSL
> - operating system or database system
>   - providing eg. access control
> - programming platform
>   - for instance Java or .NET sandboxing
>
> Of course, software in such infrastructures implementing security has to be secure

**Expansion.**

- Applications seldom implement security mechanisms from scratch; they reuse those of the platform: TLS from libraries such as OpenSSL (TLS is the successor of SSL; SSL 2.0/3.0 and TLS 1.0/1.1 are deprecated, so use TLS 1.2 or 1.3), access control from the OS (accounts, file permissions) or the DBMS (\`GRANT\`/\`REVOKE\`, row-level security), sandboxing from the runtime (JVM, CLR, browser).
- Reusing a well-tested mechanism is good practice ("do not write your own crypto"), but it means *trusting* it: the platform becomes part of the **Trusted Computing Base (TCB)**, the set of components on whose correctness the security of the system depends. The TCB should be as small as possible. The slide's "of course, ... has to be secure" is the crucial caveat: Heartbleed (OpenSSL, 2014), Log4Shell (Log4j, 2021) and the Java sandbox escapes exploited by drive-by malware around 2012-2013 hit every application built on those platforms.
- Applications must also *use* platform mechanisms correctly. For instance, disabling TLS certificate validation (a common shortcut during development that ends up in production) silently removes all protection against man-in-the-middle attacks.

### Slide 60 · Software infrastructure

> Applications are built on top of "infrastructure" consisting of
>
> - operating system
> - programming language/platform/middleware
>   - programming language itself
>     - interface to CPU & RAM
>   - libraries and APIs
>     - interface to peripherals
>     - provider of building blocks
> - other applications & utilities
>   - eg database
>
> This infrastructure provides security mechanisms, but is also a source of insecurity

**Expansion.** The infrastructure has two faces, like software in general (Slide 5):

- *Provider of security*: process isolation and permissions in the OS, memory protection (virtual memory, non-executable pages, ASLR), type and memory safety in the language, secure libraries (cryptography, parsers), access control in the database.
- *Source of insecurity*:
  - the **programming language** as the interface to CPU and RAM: C exposes raw memory (pointers, no bounds), which is where buffer overflows and format string bugs come from; even safe languages have unsafe escape hatches (JNI in Java, \`unsafe\` in Rust and C#);
  - **libraries and APIs**: dangerous functions (\`gets\`, \`strcpy\`, \`system\`), complex APIs that are easy to misuse (cryptographic APIs, XML parsers that resolve external entities by default, leading to XXE attacks), and vulnerable third-party dependencies (software composition analysis tools and SBOMs, software bills of materials, keep track of them);
  - **other applications** such as the database: SQL injection exists because the application talks to the database by building strings in another language.

### Slide 61 · Threats & vulnerabilities

> - Knowledge about threats & vulnerabilities is crucial
> - Vulnerabilities can be specific to programming language, operating system, database, the type of application... and are continuously evolving
>   - we cannot hope to cover all vulnerabilities in this course
> - "Fortunately", people keep making the same mistakes and some old favourites never seem to die,
>   - esp. public enemy number 1: *the buffer overflow*
>
>   and some patterns keep re-emerging

**Expansion.**

- **Old favourites.** The buffer overflow was described as early as 1972 (the Anderson report for the US Air Force), exploited by the Morris worm in 1988, popularised by Aleph One's *Smashing the Stack for Fun and Profit* (Phrack 49, 1996), and still sits at the top of MITRE's **CWE Top 25**: CWE-787 (Out-of-bounds Write) was number 1 in 2021, 2022 and 2023, and number 2 in 2024. SQL injection, publicly described in 1998, is still in the top three.
- **Patterns that re-emerge.** The same root causes reappear in every new technology: injection moved from SQL to NoSQL, LDAP, XPath, template engines and now to prompts of large language models (*prompt injection*); integer overflows moved from C to smart contracts (Slides 16-17); race conditions moved from Unix file systems (TOCTOU, Lecture 11) to web applications and smart contracts (reentrancy). Learning the underlying *patterns* (mixing data and code, missing validation, unchecked arithmetic, check-then-use races) lasts longer than memorising individual bugs, and the rest of the course is organised around them.

### Slide 62 · Sources of software vulnerabilities

> - Bugs in the application or its infrastructure
>   - i.e. doesn't do what it should do
> - Inappropriate features in the infrastructure
>   - i.e. does something that it shouldn't do
>     - functionality winning over security
> - Inappropriate use of features provided by the infrastructure.
>
>   Main causes:
>   - complexity of these features
>   - functionality winning over security, again
>   - ignorance of developers

**Expansion.** Three different sources, with examples:

1. **Bugs**: the software does not do what it should. A missing bounds check in the application, or in a library it uses (Heartbleed).
2. **Inappropriate features**: the software does something it should not, *by design*, because a convenient feature is also dangerous. Examples: \`gets()\` in the C library (it cannot limit the input length; it was removed in C11), the \`%n\` conversion of \`printf\`, which *writes* to memory and is the key to format string attacks (Lecture 4), XML external entities, Office macros enabled by default, \`register_globals\` in PHP, Java deserialisation of arbitrary classes.
3. **Inappropriate use of features**: the feature is fine, the developer uses it wrongly. Examples: building SQL queries by string concatenation instead of prepared statements; passing user input to \`system()\`; using \`strncpy\` without ensuring the string is terminated; using a correct AES library in ECB mode or with a fixed IV; disabling certificate checks. The three main causes map onto the slide: the features are complex and poorly documented (*complexity*), the insecure way is easier or faster (*functionality winning over security*), developers do not know the risks (*ignorance*).

### Slide 63 · Topics in rest of this course

> - Awareness & knowledge of vulnerabilities (**don'ts**)
>   - general (input validation, ...)
>   - specific to a kind of application (SQL injection, XSS, ...), or
>   - specific to a kind of programming language (buffer overflows, ...)
> - Awareness & knowledge of countermeasures (**do's**)
>   - at different points in the development lifecycle
>   - at level of application, programming language, or platform
>
>   E.g. security technologies (static or dynamic) such as
>   - *access control*
>   - *untrusted code security*
>     - type-safe languages, sandboxing, code-based access control
>   - *runtime monitoring*
>   - program analyses: typing, static analysis, verification, information flow

**Expansion.** Where each topic is treated, according to the lecture slides published so far:

| Topic | Lectures |
| --- | --- |
| Vulnerabilities specific to a language (C) | 3 Buffer Overflow, 4 Format Strings, 11 Race Conditions |
| General vulnerabilities | 5 Input Validation |
| Vulnerabilities specific to a kind of application (web, databases) | 9 SQL Injection |
| Countermeasures at platform and compiler level | 8 Buffer Overflow Defences |
| Static and dynamic analysis, tools | 6 Tools, 7 Program Analysis |
| Countermeasures along the development life cycle | 10 Design Principles, 12 Secure Software Design, 13 Security Engineering for Software |

- *Code-based access control*: permissions are granted to *code* according to its origin (where it was loaded from, who signed it) rather than to the user running it, as in Java's stack inspection.
- *Runtime monitoring*: checking properties during execution and stopping the program on a violation (reference monitors, control-flow integrity, sanitizers).
- *Information flow*: tracking how data propagates through a program, to guarantee that secret inputs never influence public outputs (confidentiality) and that untrusted inputs never reach sensitive operations unchecked (integrity; this is *taint analysis*).
`;export{e as default};
