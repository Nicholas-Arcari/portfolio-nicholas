const e=`La Lezione 10 è il catalogo del corso dei **principi di progettazione sicura**, i "da fare" al livello della progettazione, che completano i "da non fare" sulle vulnerabilità delle lezioni precedenti. Ogni principio viene enunciato, motivato e illustrato con esempi e controesempi (diversi in codice): proteggere l'anello più debole, difesa in profondità, privilegio minimo, compartimentazione, ridurre la superficie d'attacco, impostazioni predefinite sicure, fallire in modo sicuro, promuovere la privacy, nascondere i segreti è difficile, usare le risorse della comunità, accettabilità psicologica, non mescolare dati e codice, assegnare le responsabilità, identificare le ipotesi, ed essere restii a fidarsi. Le slide sono 54. Diversi esempi di codice sono importanti per l'esame.

## Introduzione (pagine 2-4)

### Slide 2 · Security Principles

> - Variations of lists of security principles appear in literature & on-line
> - Security vulnerabilities often exploit violations of these principles
> - Good security solutions or countermeasures follow these principles
> - Some overlap & some tension between principles
> - More generally, checklists are useful for security

**Approfondimento.** Questi principi sono euristiche distillate da decenni di esperienza (la fonte classica è l'articolo di Saltzer e Schroeder del 1975, "The Protection of Information in Computer Systems"). Due inquadramenti li rendono utili: **le vulnerabilità di solito sono violazioni di un principio**, e **le buone contromisure ne seguono uno**. Non sono regole indipendenti: alcuni si **sovrappongono** (ridurre la superficie d'attacco e il privilegio minimo spingono nella stessa direzione) e alcuni sono in **tensione** (privilegio minimo contro semplicità). Funzionano come una **checklist**: passare un progetto al vaglio dell'elenco fa emergere le debolezze in modo sistematico, ed è già di per sé una pratica di sicurezza preziosa.

### Slide 3 · Security Principles (l'elenco)

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

**Approfondimento.** L'insieme completo trattato in questa lezione (più alcuni principi aggiunti in seguito: accettabilità psicologica, non mescolare dati e codice, assegnare le responsabilità, identificare le ipotesi). La slide è ripetuta come riepilogo alla fine (slide 54). Ognuno è sviluppato più avanti.

### Slide 4 · Security Principles (i livelli)

> These principles can be applied at many levels, eg.
>
> - in source code of an application
> - between applications on a machine
> - at OS level
> - at network level
> - within an organisation
> - between organisations
> - ...

**Approfondimento.** I principi sono **invarianti di scala**: la stessa idea (per esempio il privilegio minimo o la compartimentazione) si applica nel codice (campi privati, moduli piccoli), fra processi (account separati), al livello del sistema operativo (sandbox, permessi), al livello della rete (segmentazione, firewall) e nell'organizzazione (separazione dei ruoli, need-to-know). Una buona sicurezza li applica in modo coerente a ogni livello, perché un attaccante colpisce il livello più debole (il principio successivo).

## Proteggere l'anello più debole (pagine 5-8)

### Slide 5 · Secure the weakest link

> - Spend your efforts on improving the security of the weakest part of a system, as this is where attackers will attack
> - NB this requires a good risk analysis

**Approfondimento.** La sicurezza è una **catena**, e un attaccante rompe l'**anello più debole**, non il più forte (Lezione 1, slide 6). Quindi lo sforzo va diretto dove il sistema è più debole, non dove è già forte (irrobustire un componente già forte non rende nulla, mentre il vero buco resta aperto). Per individuare l'anello più debole serve l'**analisi del rischio** (quali sono gli asset, le minacce e i percorsi d'attacco probabili, Lezione 1, slide 49). Un corollario: non ha senso mettere una serratura più forte su una porta accanto a una finestra aperta.

### Slide 6 · Secure the weakest link (esempi)

> - educating users may be best investment to improve security - eg think of phishing attacks, weak passwords
> - web application visible through firewall may be easier to break than the firewall - improve web application security, not the firewall

**Approfondimento.** Due casi concreti di ricerca dell'anello più debole:

- **Il fattore umano è spesso l'anello più debole** (Lezione 1, slide 6), quindi la *formazione degli utenti* contro il phishing e le password deboli può dare più sicurezza per euro speso di qualunque controllo tecnico. (È anche l'origine della formazione anti-phishing moderna e dell'autenticazione a più fattori.)
- **Il bersaglio facile di solito è l'applicazione esposta, non il firewall.** Un firewall *deve* lasciare che il traffico web raggiunga l'applicazione web, quindi l'attaccante passa *attraverso* il firewall fino all'applicazione (Lezione 1, slide 20). Comprare un firewall più forte è uno sforzo sprecato; il rischio vero sta nel mettere in sicurezza l'applicazione web.

### Slide 7-8 · Example: using credit cards on the internet

> (7) Internet folklore: don't use your credit card online, or only over SSL-encrypted connection; …
>
> NB threats vs risk:
>
> - Threats to credit card numbers include: me losing my wallet; eavesdropping on the network; stealing from customer database
> - The last poses a bigger risk: end-points of SSL connection are the weak points (Also, the risk to card holder is small)
>
> (8) "Using encryption on the Internet is the equivalent of arranging an armored car to deliver credit card information from someone living in a cardboard box to someone living on a park bench." -- Gene Spafford

**Approfondimento.** Un'illustrazione classica della differenza fra **minaccia** e **rischio** (probabilità × impatto). Tre minacce a un numero di carta di credito: perdere il portafoglio, l'intercettazione in rete, e il furto dal **database dei clienti** del commerciante. La credenza popolare si fissa sulla *rete* ("usa solo SSL"), ma raramente è quello l'anello più debole: SSL/TLS rende molto difficile l'intercettazione sul filo, quindi il rischio vero sta alle **estremità**, soprattutto nel database del commerciante che contiene milioni di carte (le grandi violazioni, Lezione 2, slide 22). La famosa battuta di Spafford lo rende chiaro: cifrare il trasporto (il "furgone blindato") non serve a nulla quando entrambe le estremità sono insicure (la "scatola di cartone" e la "panchina del parco"). Le lezioni pratiche: fare una vera analisi del rischio prima di spendere in difese, e proteggere i dati a riposo (il database), non solo in transito.

## Praticare la difesa in profondità (pagine 9-14)

### Slide 9 · Practice defence in depth

> - have several layers of security - two controls are better than one.
> - no single point of failure
> - A typical violation: having a firewall, and only having firewall - a user bringing in a laptop circumvents firewall - this is an example of environmental creep

**Approfondimento.** **Difesa in profondità** significa usare *più livelli indipendenti* di protezione, così che se uno cede gli altri reggano ancora: **nessun singolo punto di rottura**. È l'atteggiamento opposto al "un solo muro perfetto" e completa il "proteggere l'anello più debole" (non affidarsi a un solo controllo). La **violazione tipica** è affidarsi soltanto a un firewall *perimetrale*: protegge solo il confine, quindi un portatile portato dentro (o una VPN, un collegamento cloud, un dispositivo USB) **lo aggira completamente**. È l'**environmental creep**: l'ambiente reale del sistema si allontana dalle ipotesi su cui era stata costruita l'unica difesa (il principio "identifica le tue ipotesi", slide 50). La difesa in profondità è anche la mentalità moderna "assume breach" / zero trust (Lezione 1, slide 55).

### Slide 10-11 · Practice defence in depth (esempi a strati)

> (10) have a firewall AND secure web application software AND run web application with minimal privileges
>
> (11) use OS access control to restrict access to sensitive files AND encrypt them - Esp. when files are written to removable media such as USB sticks (another example of environmental creep), to laptops, or PCs which might be disposed of

**Approfondimento.** Due stratificazioni concrete:

- *Applicazione web*: un firewall **e** codice applicativo sicuro **e** esecuzione con il privilegio minimo. Ogni livello copre un guasto diverso: il firewall blocca gli accessi di rete non necessari, il codice sicuro resiste agli attacchi che riescono a passare, e il privilegio minimo limita i danni se il codice viene comunque compromesso.
- *File sensibili*: controllo degli accessi del sistema operativo (permessi) **e** cifratura. Il controllo degli accessi cede appena il supporto esce dal controllo del sistema operativo, una chiavetta USB (di nuovo l'environmental creep), un portatile perso, un disco buttato o rivenduto, ma la cifratura protegge ancora i dati a riposo. I livelli sono indipendenti, quindi devono cedere entrambi perché i dati escano. (Per questo la cifratura dell'intero disco e dei supporti rimovibili è standard.)

### Slide 12 · Practice defence in depth (la citazione di Spafford)

> "The only system which is truly secure is one which is switched off and unplugged, locked in a titanium-lined safe, buried in a concrete bunker, and surrounded by nerve gas and very highly paid armed guards. Even then, I wouldn't stake my life on it." -- Gene Spafford

**Approfondimento.** Il famoso aforisma: **la sicurezza perfetta è irraggiungibile** (Lezione 2, slide 17). Anche difese fisiche estreme e a strati non danno certezze, quindi l'obiettivo non è mai la "sicurezza assoluta" ma ridurre il rischio a un livello accettabile a un costo accettabile (Lezione 1, slide 50), accettando che utilità e sicurezza si scambiano (un computer spento è sicuro e inutile). Fa anche, con ironia, il punto sulla difesa in profondità: tanti livelli, e comunque nessuna garanzia.

### Slide 13 · Defence in depth: counterexample

> - on UNIX systems, the password file, /etc/passwd, which contains hashed passwords, was world readable.
> - better - hash passwords AND enforce tight access control to the file

**Approfondimento.** Un controesempio in cui si usava **un solo** livello. Il primo UNIX si affidava a un'unica difesa per le password: erano **trasformate con un hash**, quindi \`/etc/passwd\` poteva tranquillamente essere leggibile da tutti (chiunque poteva leggere gli hash ma non il testo in chiaro). Ma un hash da solo non basta: una volta in possesso degli hash, gli attaccanti facevano **attacchi offline a dizionario o a forza bruta** (famoso lo strumento Crack) per recuperare le password deboli, senza alcun limite di tentativi e senza essere rilevati. La correzione con la difesa in profondità: hash delle password **e** accesso agli hash limitato. È proprio per questo che lo UNIX moderno ha spostato gli hash in \`/etc/shadow\`, leggibile solo da root, e ha aggiunto il salt e gli hash lenti. Due livelli indipendenti (hash segreti + controllo degli accessi) sono molto più forti di ciascuno preso da solo.

### Slide 14 · Sun tarball problem (1993)

> - Every tarball (zip-file) produced on Solaris 2.0 contained fragments of the password file /etc/password
> - How did this happen? - tar looked up some user info directly prior to producing tarball: password file was loaded in heap memory for this; this heap memory was then released - then tar allocated memory for constructing the tarball: allocated memory was always the memory just released; memory not zeroed out on allocation by program or OS...
> - Solution: replacing \`char *buf = (char*)malloc(BUFSIZE)\` by \`char *buf = (char*)calloc(BUFSIZE)\`

**Analisi del codice.** Un bug reale e istruttivo di **divulgazione di informazioni** causato da memoria non inizializzata (e una lezione di difesa in profondità sull'igiene dei dati).

- *Che cosa è successo.* Il \`tar\` di Solaris 2.0 leggeva prima il file delle password in un **buffer sullo heap** (per cercare le informazioni sugli utenti), poi faceva \`free\` di quel buffer. Subito dopo faceva \`malloc\` di un buffer per costruire l'archivio, e l'allocatore restituiva **proprio lo stesso blocco di memoria appena liberato**, che conteneva ancora frammenti del file delle password. Poiché \`malloc\` **non azzera** la memoria che restituisce (Lezione 3, slide 26), e \`tar\` non sovrascriveva l'intero buffer prima di scriverlo, **ogni tarball faceva uscire pezzi di \`/etc/passwd\`** (password con hash) verso chiunque ricevesse l'archivio.
- *La causa di fondo*: contare sul fatto che la memoria ottenuta con \`malloc\` sia pulita. Non lo è; contiene qualunque cosa ci fosse prima (un *uso di memoria non inizializzata*, CWE-457, e un'*esposizione di informazioni*, CWE-200). È la stessa classe di Heartbleed e della lettura oltre i limiti di \`using_pointer_arithmetic\` della Lezione 2.
- *La correzione (nella slide).* Sostituire \`malloc\` con **\`calloc\`**, che **inizializza a zero** la memoria allocata. (A rigore la vera firma di \`calloc\` è \`calloc(count, size)\`, quindi il \`calloc(BUFSIZE)\` della slide è un'abbreviazione; il punto è che \`calloc\` restituisce memoria azzerata.) Una correzione più robusta inoltre **cancella i dati sensibili appena non servono più** (\`explicit_bzero\` dopo l'uso), invece di affidarsi all'allocazione successiva per fare pulizia: il consiglio "zero-out arrays with sensitive information" della slide 30. È la difesa in profondità per i dati: non lasciare che i segreti restino nella memoria riutilizzabile.

## Il principio del privilegio minimo (pagine 15-19)

### Slide 15 · Principle of least privilege

> - be stingy with privileges - only grant permissions that are really needed - resource permissions (eg memory limits, CPU priorities), network permissions, file permissions, ....
> - typical violations - logging in as root/administrator - device drivers having to run in kernel mode
> - important cause of violations: laziness

**Approfondimento.** Il **principio del privilegio minimo (PoLP)**: ogni componente (utente, processo, modulo) deve girare con i **privilegi minimi necessari per fare il suo lavoro, e non di più**. Così un componente compromesso o difettoso può fare solo danni limitati. I privilegi riguardano molte risorse: limiti di memoria e CPU, accesso alla rete, permessi sui file, chiamate di sistema. **Violazioni tipiche**: far girare tutto come *root/amministratore* (così ogni bug diventa una compromissione completa), e architetture che costringono il codice nella modalità più privilegiata (i driver dei dispositivi in modalità kernel, così un bug di un driver fa cadere o conquista l'intero sistema, ed è per questo che i microkernel spingono i driver nello spazio utente). La causa onesta della maggior parte delle violazioni è la **pigrizia**: è più facile concedere tutti i permessi che capire qual è l'insieme minimo. Il PoLP è il principio singolo più importante per limitare i danni e ritorna in tutto il corso (il controllo degli accessi basato sui ruoli della Lezione 1; gli account del database con pochi privilegi delle Lezioni 5 e 9).

### Slide 16 · Principle of least privilege (organizzazione e computer)

> - in organisation - don't give everyone access to root passwords - don't give everyone administrator rights
> - on computer - run process with minimal set of privileges - Eg, don't run web application as root or administrator

**Approfondimento.** Il PoLP a due livelli (l'invarianza di scala della slide 4): *nell'organizzazione*, limitare chi ha le password di root e i diritti di amministratore (need-to-know, separazione dei compiti); *su una macchina*, eseguire ogni processo solo con i privilegi di cui ha bisogno, e mai un'applicazione web come root/amministratore, così che la compromissione dell'applicazione web (SQL injection, buffer overflow) non consegni all'attaccante l'intera macchina. La pratica moderna: account di servizio dedicati, rinuncia ai privilegi dopo l'avvio (\`setuid\` verso il basso), capability al posto di root completo, container.

### Slide 17 · Principle of least privilege (l'esempio della policy Java)

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

**Analisi del codice.** Un esempio di PoLP con una policy di sicurezza Java (la policy usata dal vecchio Security Manager di Java / \`AccessController\`).

- *La versione con troppi privilegi* concede \`AllPermission\` al codice, cioè **ogni permesso esistente**: leggere e scrivere qualunque file, aprire qualunque socket, terminare la VM, caricare codice nativo. È l'anti-pattern del privilegio massimo: qualunque difetto in quel codice (o codice malevolo caricato al suo interno) può fare qualunque cosa.
- *La versione con il privilegio minimo* concede solo \`FilePermission\` per **leggere e scrivere file sotto \`/home/forumcontent/*\`**, e solo al codice caricato da \`./forum/*\`. L'applicazione del forum può toccare esattamente la directory dei contenuti che le serve e nient'altro: niente rete, nessun altro file, nessun controllo sulla VM. Se viene compromessa, il raggio dei danni è quella sola directory.
- *Nota*: il Security Manager di Java è **deprecato (Java 17) e in via di rimozione**, quindi questo meccanismo preciso è storico; il *principio* che illustra, concedere permessi stretti e specifici per risorsa invece di permessi generalizzati, oggi si realizza con sandbox del sistema operativo, container, seccomp e sistemi di capability.

### Slide 18 · Principle of least privilege (nel codice)

> - in code - not \`public int x;\` but \`private int x;\` - not \`public void m()\` but \`package void m()\`
> - Expose minimal functionality in interfaces of objects, classes, packages, applications

**Approfondimento.** Il PoLP si applica *dentro* il codice come **visibilità minima / incapsulamento**: dichiarare ogni campo e metodo con il **modificatore di accesso più stretto** che funziona, \`private\` invece di \`public\`, package-private invece di \`public\` (Lezione 1, slide 33; Lezione 2, slide 5). Esporre solo il minimo in ogni interfaccia (oggetto, classe, package, applicazione) significa meno superficie che altro codice, compreso codice difettoso od ostile nello stesso processo, può usare male. È insieme privilegio minimo (chi chiama ottiene solo l'accesso che gli serve) e riduzione della superficie d'attacco (slide 29). La regola più ampia: progettare interfacce strette e ben definite.

### Slide 19 · Principle of least privilege (perché è difficile)

> - NB applying the principle of least privilege in code is tricky & hard and requires work & discipline. - this is true just for plp in general, not just in code
> - Why? - compiler complains about private field that should be public, not the other way around - compiler complains about missing import, not about superfluous import.
> - Can this be improved? - tool support in compilers & IDEs, eg or separate source code analyzers, eg FindBugs and JAMIT tool for tightening visibility modifiers

**Approfondimento.** Un'avvertenza onesta: il PoLP è **difficile da applicare perché le impostazioni predefinite e gli strumenti spingono nella direzione sbagliata**. Linguaggi e compilatori segnalano un accesso *insufficiente* (un campo \`private\` usato da fuori, un import mancante) ma **non avvisano mai di un accesso *eccessivo*** (un campo \`public\` usato solo all'interno, un import superfluo). Così dare troppi privilegi è silenzioso e facile, mentre darne troppo pochi è rumoroso e viene corretto: esattamente il contrario di ciò che serve alla sicurezza. Il rimedio sono gli **strumenti**: analizzatori statici che rilevano e restringono la visibilità troppo ampia (la slide cita FindBugs e **JAMIT**, il "Java Access Modifier Inference Tool"), e il supporto degli IDE. Si ricollega ai temi del "fool with a tool" e dell'adozione degli strumenti della Lezione 6: gli strumenti giusti rendono la buona pratica la strada più facile.

## Compartimentare (pagine 20-27)

### Slide 20 · Compartmentalize

> - Principle of least privilege works best if access control is all or nothing for large chunks - compartments - of a system
> - Motivations: simplicity; containing attacker in case of failure
> - Analogy: compartments on a ship
> - Counterexample: OS that crashes if an application crashes

**Approfondimento.** La **compartimentazione** divide un sistema in **compartimenti** isolati, ciascuno con un accesso grossolano, tutto o niente, così una violazione in uno non si propaga agli altri. Due motivazioni: la **semplicità** (i confini grossolani sono più facili da capire e da far rispettare dei permessi a grana fine per oggetto; si veda la tensione nella slide successiva) e il **contenimento** (un attaccante che entra in un compartimento resta bloccato lì). L'**analogia della nave** è esatta: le paratie stagne fanno sì che un compartimento allagato non affondi la nave. Il **controesempio** è un sistema *senza* isolamento, un sistema operativo che va in crash quando va in crash una sola applicazione (i classici sistemi a multitasking cooperativo), dove un guasto butta giù tutto. Le incarnazioni moderne: isolamento dei processi, container, VM, microservizi, isolamento dei siti nei browser.

### Slide 21 · Compartmentalize (la tensione con KISS)

> NB the fundamental conflict between
>
> - principle of least privilege and
> - kiss principle - keep it simple, stupid - plp requires very fine-grained control with expressive policies - ... which leads to more complexity - ... which people then get wrong
> - Compartmentalization can provide a solution using defence in depth

**Approfondimento.** Un'importante **tensione fra due principi**. Il *privilegio minimo* spinge verso un controllo **a grana fine** (dare a ogni cosa esattamente i suoi diritti minimi), ma le politiche a grana fine sono **complesse ed espressive**, e la complessità è a sua volta un rischio di sicurezza: le persone configurano male le politiche complicate (il principio "keep it simple", e la categoria OWASP "security misconfiguration"). **La compartimentazione risolve la tensione**: l'isolamento grossolano di pochi grandi compartimenti dà la maggior parte del beneficio del privilegio minimo (il contenimento) con molta meno complessità, un livello di difesa in profondità abbastanza semplice da fare bene. La lezione: preferire pochi confini ben capiti a un labirinto di permessi a grana fine che nessuno capisce fino in fondo.

### Slide 22 · Compartmentalize (esempi)

> - Use different machines for different tasks - eg run web application on a different machine from employee salary database
> - Use different user accounts on one machine for different tasks - unfortunately, security breach under one account may compromise both... - compartmentalization provided by typical OSs is poor!
> - Partition hard disk and install OS twice

**Approfondimento.** La forza della compartimentazione varia con il confine:

- **Macchine separate** = isolamento forte (il web server e il database degli stipendi su host diversi, così compromettere l'applicazione web pubblica non raggiunge direttamente il database sensibile).
- **Account utente separati sulla stessa macchina** = più debole: un bug di escalation dei privilegi locale (abbondanti nei sistemi operativi) permette a un attaccante di saltare da un account all'altro, quindi "the compartmentalization provided by typical OSs is poor". Gli account sono un confine di comodità, non un confine di sicurezza forte.
- **Installazioni separate del sistema operativo / partizioni del disco** (dual boot) = forte ma scomodo.

La conclusione: sapere quanto è davvero *forte* il confine di ogni compartimento, e commisurarlo al rischio. Questo motiva i meccanismi più forti delle slide successive.

### Slide 23 · Improved compartmentalization: chroot jail

> - chroot jail restricts access of a process to subset of file system, ie. changes the root of file system for that process
> - Eg run an application you just downloaded with \`chroot /home/sos/paperino/trial;/tmp\`
> - Nice idea, but hard to get working, and hard to get working correctly.

**Approfondimento.** Una **chroot jail** cambia la radice del file system vista da un processo in una sottodirectory scelta, così il processo non può nominare né raggiungere file fuori da quel sottoalbero: un compartimento del file system (utile per la difesa dal directory traversal e dall'injection nei nomi di file della Lezione 5, slide 24). L'avvertenza è importante: chroot è **difficile da configurare correttamente** (bisogna copiarci dentro ogni libreria, dispositivo e file di configurazione di cui il programma ha bisogno) e **non è un confine di sicurezza completo**: un processo che gira come root spesso riesce a uscire da una chroot, e confina solo il file system (non la rete, i processi o i privilegi). Equivalenti moderni più forti: container (namespace + cgroup), jail di FreeBSD, sandbox con seccomp.

### Slide 24-26 · Improved compartmentalization: macchine virtuali e hypervisor

> (24) Examples in operating system world:
>
> - virtual machines - VMWare - very popular these days, but mainly for reasons of convenience & costs, not security
> - operating system hypervisors (true microkernels): small, lightweight kernel, which partitions hard disk & memory, to concurrently run several copies of the OS, in different compartments

![Lezione 10, pagina 25](L10_p25.webp "38% 684x834")

**Figura (slide 25): virtualizzazione ospitata.** Uno schema a strati: in fondo l'**Hardware**, poi l'**OS 1** (il sistema operativo host), su cui gira il **process A** e anche un **Hardware Simulator** (hypervisor ospitato); sopra il simulatore gira l'**OS 2**, su cui gira il **process B**. Didascalia: "We simulate the hardware in an OS process. Similar to Java VM, except that we simulate the real hardware, and don't provide some abstract VM. This is the solution proposed by VMware.com."

![Lezione 10, pagina 26](L10_p26.webp "48% 862x647")

**Figura (slide 26): virtualizzazione con hypervisor (bare-metal).** Uno schema a strati: in fondo l'**Hardware**, poi l'**hypervisor** direttamente sopra, poi due guest affiancati, l'**OS 1** (che esegue il **process A**) e l'**OS 2** (che esegue il **process B**). Didascalia: "We simulate the hardware below the operating system, in a so-called hypervisor aka micro-kernel."

**Approfondimento.** La **virtualizzazione** dà una compartimentazione forte eseguendo interi sistemi operativi in **macchine virtuali** isolate:

- **Virtualizzazione ospitata (tipo 2, per esempio VMware Workstation, VirtualBox)**: un *simulatore dell'hardware* gira come normale processo su un sistema operativo host, e ogni sistema operativo guest gira su quel simulatore (slide 25). È come una Java VM, ma simula hardware *reale* invece di una macchina astratta, così dentro girano sistemi operativi non modificati. La slide nota che le VM sono diffuse soprattutto per **comodità e costi** (consolidamento, snapshot), non in primo luogo per la sicurezza.
- **Virtualizzazione bare-metal (tipo 1, hypervisor / microkernel, per esempio Xen, VMware ESXi, KVM)**: un **hypervisor** sottile sta *direttamente sull'hardware*, sotto tutti i sistemi operativi guest, e suddivide l'hardware reale (disco, memoria, CPU) fra più sistemi operativi guest isolati (slide 26). Essendo piccolo, è più facile renderlo affidabile (l'idea della "TCB piccola"), e l'isolamento è forte.

Le VM sono il confine di compartimento pratico più forte dopo le macchine fisiche separate (il multi-tenancy del cloud si basa su di esse), anche se le vulnerabilità di evasione dalle VM, le righe "VME" del listino di Zerodium della Lezione 1, mostrano che anche questo confine può essere violato.

### Slide 27 · Compartmentalize (nel codice)

> - in code, aka modularisation - using objects, classes, packages, etc.
> - Restrict sensitive operations to small modules, with small interfaces - so that you can concentrate efforts on quality of these modules - so that only these have to be subjected to code reviews

**Approfondimento.** La compartimentazione nel codice è la **modularizzazione**: confinare le operazioni sensibili (crittografia, autenticazione, controlli di accesso, gestione dei segreti) in **moduli piccoli con interfacce piccole e ben definite**. Il guadagno per la sicurezza è la concentrazione dello sforzo: solo quei moduli piccoli e critici richiedono la revisione, i test e la verifica più rigorosi, mentre il resto del codice non può eseguire direttamente le operazioni sensibili. È l'analogo software di una **Trusted Computing Base** piccola (Lezione 1, slide 59; slide 51 più sotto): ridurre la parte di cui ci si deve fidare, poi spendere lì il proprio budget di garanzia. Realizza anche il "non spargere i controlli di sicurezza ovunque" (centralizzarli, Lezione 5, slide 27).

## Ridurre la superficie d'attacco (pagine 28-30)

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

**Approfondimento.** La **superficie d'attacco** è la somma di tutti i punti in cui un attaccante può interagire con il sistema (Lezione 1, slide 20). Ogni socket aperto, servizio in esecuzione, pagina dinamica, account di amministrazione e file protetto male è un potenziale punto d'ingresso, quindi **ciascuno va ridotto al minimo**. Meno servizi significa meno vulnerabilità raggiungibili; servizi disattivati per impostazione predefinita significa che non si possono attaccare finché non vengono attivati di proposito; meno servizi con privilegi alti significa meno a cui una compromissione può arrivare. È l'idea della "riduzione della superficie d'attacco" della Lezione 3, slide 52, applicata come disciplina di progettazione: se non serve, non va eseguito, non va installato, non va esposto.

### Slide 29 · Minimize attack surface (nel codice)

> - in code - not \`public int x;\` but \`private int x;\` - not \`public void m()\` but \`package void m()\`
> - This is applying principle of least privilege, and also reduces attack surface, from buggy or hostile code

**Approfondimento.** La stessa pratica di visibilità minima della slide 18, vista con la lente della superficie d'attacco: un membro \`public\` è raggiungibile da *tutto* l'altro codice, uno \`private\` solo dall'interno della classe. Restringere la visibilità riduce la superficie che il **codice difettoso od ostile (nello stesso processo)** può toccare, quindi serve *sia* al privilegio minimo (chi chiama ottiene solo ciò che gli serve) *sia* alla riduzione della superficie d'attacco (meno punti d'ingresso raggiungibili). È per questo che i due principi si sovrappongono (slide 2).

### Slide 30 · Minimize attack surface in time (nel tempo)

> Examples
>
> - Automatically log off users after n minutes
> - Automatically lock screen after n minutes
> - Unplug network connection if you don't use it
> - Switch off computer if you don't use it
> - On smartcards, it's good practice to zero-out arrays that contains sensitive information (usually, decrypted information) as soon as it's no longer needed

**Approfondimento.** La superficie d'attacco ha una **dimensione temporale**: la *finestra* durante la quale qualcosa è attaccabile. Va accorciata: il logout automatico e il blocco dello schermo chiudono una sessione incustodita, scollegarsi o spegnere toglie del tutto l'esposizione quando non si lavora. L'esempio della smart card è la versione sulla durata dei dati e si ricollega al bug del tarball di Sun (slide 14): **cancellare dalla memoria i dati sensibili (segreti decifrati, chiavi) appena non servono più** (\`explicit_bzero\`), così la finestra in cui un bug di divulgazione della memoria potrebbe farli uscire è la più breve possibile. È anche il "la disponibilità può essere indesiderabile" / la forward secrecy della Lezione 1, slide 52.

## Usare impostazioni predefinite sicure (pagina 31)

### Slide 31 · Use secure defaults

> - By default, security should be switched on; permissions turned off
> - This will ensure that we apply principle of least privilege
> - Counterexample: on bluetooth connection on mobile phone is by default on, but can be abused

**Approfondimento.** **Impostazioni predefinite sicure** (secure by default): la configurazione *appena installata* deve essere quella sicura, con le protezioni **attive** e i permessi **spenti (default-deny)**, perché la maggior parte degli utenti non cambia mai le impostazioni predefinite. Questo impone in automatico il privilegio minimo (si attiva solo ciò che serve davvero) ed è l'atteggiamento white list / default-deny (Lezione 4, slide 38). Il **controesempio**, il Bluetooth lasciato *attivo* per impostazione predefinita sui telefoni, ha esposto gli utenti ad attacchi (BlueBorne, Bluesnarfing) che non avevano mai scelto. È anche la lezione del root senza password di Tandberg (Lezione 1, slide 15): i prodotti devono uscire sicuri, perché un'impostazione predefinita insicura è un'insicurezza per ogni utente che non tocca mai le impostazioni.

## Fallire in modo sicuro (pagine 32-40)

### Slide 32 · Fail securely

> - Incorrect handling of unexpected errors is a major cause of security breaches
> - Counterexamples: fallback to unsafe(r) modes on failure (sometimes for backward compatibility; asking user if security settings can be lowered); crashing on failure, leading to DoS attack; leaking interesting information for an attacker
> - Of course, having exceptions in a programming language has a big impact

**Approfondimento.** **Fallire in modo sicuro (fail-safe defaults)**: quando qualcosa va storto, il sistema deve finire in uno stato **sicuro**, di solito **negando** l'accesso, non concedendolo. Una gestione degli errori fatta male è una delle cause principali di violazione. I controesempi sono i modi in cui il fallimento diventa *insicuro*:

- **Ripiegare su una modalità meno sicura**: in caso di errore, scendere a una sicurezza più debole "per compatibilità all'indietro" (un attaccante allora *forza* l'errore per far scattare il declassamento, per esempio gli attacchi di downgrade di TLS come POODLE), o chiedere all'utente di abbassare le impostazioni di sicurezza (cosa che farà).
- **Andare in crash**: un fallimento non gestito che fa cadere il servizio è un **denial of service** (e può saltare controlli successivi).
- **Far uscire informazioni**: messaggi di errore che rivelano dettagli interni aiutano l'attaccante (il problema degli errori SQL verbosi della Lezione 9, slide 13).

La presenza di **eccezioni** in un linguaggio conta moltissimo: le eccezioni rendono più difficile *ignorare* un errore (le slide successive confrontano gli errori come codici di ritorno del C con la gestione delle eccezioni), ma le eccezioni gestite male creano i loro propri modi di fallire in modo insicuro. La regola guida: **in caso di errore, per impostazione predefinita negare / stare sul sicuro.**

### Slide 33 · Fail securely example (il bug di isAdmin)

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

**Analisi del codice.** Un bug da manuale di *fallimento insicuro*.

- *Il difetto.* \`isAdmin\` viene impostato a \`true\` **prima** dell'operazione rischiosa, "entrando in modalità amministratore" con ottimismo, e viene rimesso a \`false\` solo *dentro il blocco catch* se avviene un'eccezione. È al contrario. Se l'operazione lancia **un'eccezione diversa** da \`SomeException\` (una non catturata qui), o se il percorso del codice in qualche modo salta il catch, \`isAdmin\` resta \`true\`: il programma **fallisce aperto**, concedendo i diritti di amministratore in caso di errore. Anche il tentativo di recupero è fragile: conta sul fatto che venga lanciata e catturata *esattamente* \`SomeException\`.
- *Lo schema sicuro (fallire chiuso / default-deny).* Partire dallo stato *negato* e concedere solo in caso di successo esplicito:

\`\`\`java
boolean isAdmin = false;          // default deny
try {
    doPrivilegedCheck();          // throws if not allowed
    isAdmin = true;               // granted ONLY after the check succeeds
} catch (Exception ex) {
    log.write(ex.toString());     // isAdmin remains false on ANY failure
}
\`\`\`

Ora qualunque errore, di qualunque tipo, lascia \`isAdmin == false\`. La regola: **inizializzare le decisioni di sicurezza a "nega" e passare ad "ammetti" solo dopo un successo verificato**, mai il contrario.

### Slide 34 · Variants of failing insecurely

> - information leakage - about cause of error, which can be exploited - more on that later
> - ignoring errors - Easier in a programming language without exceptions! (eg forgetting to check for -1 return value in C)
> - misinterpreting errors
> - useless errors - why does strncopy return an error value at all?
> - handling wrong exceptions
> - handling all exceptions

**Approfondimento.** Una tassonomia dei fallimenti nella gestione degli errori:

- **Fuga di informazioni**: il messaggio di errore stesso rivela dettagli sfruttabili (stack trace, SQL, percorsi, versioni, i controesempi di "promote privacy" delle slide 41 e 44, e la SQL injection cieca delle slide 42-43).
- **Ignorare gli errori**: non controllare affatto i fallimenti, *facile in C* dove gli errori sono codici di ritorno (dimenticare di controllare un ritorno \`-1\`/\`NULL\`) e il programma prosegue alla cieca con un risultato non valido. Le eccezioni lo rendono più difficile (un'eccezione non gestita almeno ferma il thread), ed è questo il "big impact" delle eccezioni.
- **Interpretare male gli errori**: gestire un errore ma trarne la conclusione sbagliata (trattare un fallimento temporaneo come un successo).
- **Errori inutili**: un segnale di errore che non porta alcuna informazione utile (la domanda retorica "perché mai \`strncpy\` restituisce un valore?", slide successiva).
- **Gestire le eccezioni sbagliate / gestire tutte le eccezioni**: catturare eccezioni che non si intendeva catturare, o catturare *tutto* con un unico gestore ampio (slide 37-38), il che nasconde i problemi veri.

### Slide 35 · Failing insecurely example (il valore restituito da strncpy)

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

**Analisi del codice.** Un bug di *errore interpretato male* nato da un valore di errore *inutile*.

- *L'errore.* Il programmatore controlla con diligenza il valore restituito \`p\` di \`strncpy\`, presumendo che un ritorno diverso da \`NULL\` significhi successo. Ma **\`strncpy\` restituisce sempre \`dest\`** (il suo primo argomento), esattamente come \`strcpy\`; **non restituisce mai \`NULL\`** e **non ha alcuna indicazione di errore**. Quindi \`if (p)\` è *sempre* vero, il "controllo" non ha senso, e i veri modi di fallire di \`strncpy\` (troncamento, terminatore NUL mancante, i bug della Lezione 3, slide 18-21) passano del tutto inosservati.
- *Il punto più profondo.* Il valore restituito da \`strncpy\` è **inutile** (ripete solo un argomento), eppure *sembra* un codice di errore, attirando il programmatore in un falso controllo. È per questo che conoscere il contratto esatto di ogni API conta, ed è per questo che i linguaggi con le **eccezioni** (che costringono i fallimenti veri a emergere) riducono questa classe di bug.
- *Correzione.* Non affidarsi al valore restituito da \`strncpy\`; controllare le vere postcondizioni: che la sorgente ci stesse e che il risultato sia terminato (Lezione 3, slide 21), oppure usare \`snprintf\`/\`strlcpy\` e controllare i *loro* risultati (che hanno senso). Si noti anche che \`dest[19]\` con un conteggio di 19 non lascia posto per aggiungere un terminatore: l'off-by-one della Lezione 3.

### Slide 36 · Failing insecurely example (ImpersonateNamedClient)

\`\`\`c
ImpersonateNamedClient(someUser); // become someUser
DeleteFile(fileName);
RevertToSelf();   // become Local System
\`\`\`

> Example code in Local System service in Windows. What's wrong here? What happens if ImpersonateNamedClient fails?

**Analisi del codice.** Un classico bug di privilegi di Windows e un caso di fallimento insicuro.

- *L'intenzione.* Questo codice gira in un servizio con privilegi altissimi, **Local System**. Per eseguire un'azione *per conto di un client con meno privilegi*, **impersona** quel client (\`ImpersonateNamedClient\`), esegue l'azione (\`DeleteFile\`) con i diritti ridotti del client, poi torna a Local System (\`RevertToSelf\`). È un progetto corretto secondo il privilegio minimo: fare l'operazione pericolosa con i diritti limitati del *client*, non con quelli quasi divini del servizio.
- *Il bug.* **Il valore restituito da \`ImpersonateNamedClient\` non viene mai controllato.** Se l'impersonazione **fallisce**, il thread continua a girare come **Local System**, e \`DeleteFile(fileName)\` viene poi eseguita con *tutti i privilegi di sistema*. Così un client che riesce a far fallire l'impersonazione può cancellare *qualunque* file del sistema: un'escalation dei privilegi. Il codice **fallisce aperto** (verso privilegi più alti) invece di fallire chiuso.
- *Correzione.* Controllare il risultato e **interrompere se l'impersonazione fallisce**, senza mai proseguire con l'identità privilegiata:

\`\`\`c
if (!ImpersonateNamedClient(someUser)) {
    // impersonation failed: do NOT run as Local System
    log_error(); return;
}
DeleteFile(fileName);
RevertToSelf();
\`\`\`

È la stessa lezione, "controlla il valore restituito e fallisci in modo sicuro", delle CVE sull'impersonazione che hanno colpito i servizi di Windows.

### Slide 37 · Failing insecurely example (un solo catch troppo ampio)

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

**Analisi del codice.** L'anti-pattern del *gestire tutte le eccezioni*.

- *Il difetto.* Un solo \`catch (Exception ex)\` avvolge **quattro operazioni molto diverse** (caricamento del file, parsing, recupero del certificato, accesso alla rete), ognuna delle quali può fallire in modi **rilevanti per la sicurezza ma distinti**: una \`SecurityException\` (un problema di certificato, un vero segnale di attacco) viene catturata e gestita *esattamente* come un'innocua \`FileNotFoundException\`. Il codice non sa distinguere un fallimento di sicurezza da uno di routine, quindi quasi certamente gestisce male il caso pericoloso, probabilmente trattando un controllo del certificato fallito come un intoppo recuperabile e proseguendo in modo insicuro.
- *Correzione.* Catturare eccezioni **specifiche** e gestire ciascuna nel modo appropriato, soprattutto quelle di sicurezza, che devono fallire chiuse (negare e dare l'allarme), non essere ingoiate con le altre:

\`\`\`java
try { ... }
catch (SecurityException ex) { denyAndAlert(ex); }   // treat as attack
catch (XMLException | IOException ex) { handleDataError(ex); }
\`\`\`

Tenere piccoli i blocchi \`try\` e catturare in modo stretto, così ogni fallimento riceve la risposta di cui ha bisogno.

### Slide 38 · Failing insecurely example (il catch vuoto)

\`\`\`java
try {...
      ...
    } catch (Exception ex) {
     // do nothing
    }
\`\`\`

> What's possibly/probably wrong here? - empty catch block is suspicious... - overly broad catches is suspicious

**Analisi del codice.** Il peggior anti-pattern di gestione degli errori: il **blocco catch vuoto che ingoia tutte le eccezioni**.

- *Il difetto.* \`catch (Exception ex) { }\` cattura *tutto* e non fa *niente*: l'errore viene scartato in silenzio e l'esecuzione prosegue come se nulla fosse. Combina due peccati: catturare in modo **troppo ampio** (\`Exception\` cattura tutto) e **ignorare del tutto l'errore** (il caso "ignorare gli errori" della slide 34). Un controllo di sicurezza fallito, una scrittura fallita, un parsing corrotto, tutto sparisce, e il programma prosegue in uno stato sconosciuto, forse compromesso. È anche un incubo da correggere.
- *Perché gli strumenti lo segnalano.* I catch vuoti e troppo ampi sono proprio ciò su cui avvisano gli analizzatori statici (Lezione 6), perché così spesso nascondono bug veri (anche di sicurezza).
- *Correzione.* Non ingoiare mai le eccezioni. Come minimo registrarle; meglio gestire ogni eccezione specifica e **fallire in modo sicuro** (negare, annullare le modifiche, interrompere) invece di proseguire alla cieca.

### Slide 39 · Failing insecurely example (il PRNG di OpenSSL/OpenSSH)

> Security Flaw in OpenSSL and OpenSSH (CVE CAN-2000-0535)
>
> - PRNG (Pseudo Random Number Generator) in OpenSSH and OpenSSL seeded with /dev/random
> - But failure to check for the presence of /dev/random which did not exist on FreeBSD-Alpha...
> - /dev/random stops reading randomness when the entropy source is exhausted. Use /dev/urandom instead!

**Analisi del codice.** Un vero bug di fallimento insicuro con gravi conseguenze crittografiche.

- *Che cosa è successo.* OpenSSL/OpenSSH inizializzavano il loro generatore di numeri casuali da \`/dev/random\`. Sulla piattaforma FreeBSD-Alpha \`/dev/random\` **non esisteva**, e il codice **non controllava** che l'inizializzazione fosse davvero riuscita. Così il PRNG veniva inizializzato con un'entropia **prevedibile o nulla**, rendendo prevedibili i valori "casuali" (chiavi di sessione, nonce, i cookie e i token della Lezione 1, slide 14): una catastrofe per la crittografia (una chiave prevedibile non è una chiave).
- *Due lezioni.* (1) **Fallire in modo sicuro**: controllare sempre che un'operazione critica per la sicurezza (qui, ottenere entropia) sia *riuscita*; un'inizializzazione fallita del PRNG deve **interrompere** il programma, mai proseguire con un generatore debole (il consiglio su \`getrandom\` della Lezione 1, slide 14). (2) **\`/dev/random\` e \`/dev/urandom\`**: \`/dev/random\` *si blocca* (smette di fornire byte) quando la sua entropia stimata è "esaurita", il che può bloccare un programma o tentare gli sviluppatori con ripieghi insicuri; sui sistemi moderni \`/dev/urandom\` (o la chiamata di sistema \`getrandom()\`) è crittograficamente sicuro e non si blocca dopo l'inizializzazione iniziale, quindi è la fonte raccomandata.

### Slide 40 · Failing securely example (validazione dell'input)

> When scrubbing user input - i.e. validating input -
>
> - don't reject input with illegal words - eg. webforum input containing \\<javascript>
> - don't reject input with illegal characters - eg. input containing characters < > ;
> - but only allow input with legal characters - eg. only input containing 0...9 a...z
> - So user validation will err on the side of caution

**Approfondimento.** Il fallire in modo sicuro applicato alla **validazione dell'input**, che è semplicemente la lezione white list contro black list (Lezione 4, slide 36-38; Lezione 5, slide 27) riformulata come principio di progettazione. Rifiutare parole o caratteri *illegali* (una **black list**) fallisce in modo insicuro: passa tutto ciò che la black list ha dimenticato (l'a capo di phf). Invece si **ammettono solo i caratteri legali** (una **white list**): tutto ciò che non è permesso esplicitamente viene rifiutato, quindi un input che i progettisti non avevano previsto viene negato *per impostazione predefinita*, e la validazione **"errs on the side of caution"** (fallisce chiusa). Sono le impostazioni predefinite sicure + il fallire in modo sicuro + la white list, tre principi che convergono sulla stessa regola.

## Promuovere la privacy (pagine 41-43)

### Slide 41 · Promote privacy

> - Privacy of users, but also of systems
> - Counterexamples: \`> telnet somemachine\` → \`Trying 123.1.2.3 ... Connected to somemachine (123.1.2.3). Red Hat Linux release 7.0 (Hedwig). Kernel 2.2.16 on an i686. login:\` - Smartcard chips still do this

**Approfondimento.** **Promuovere la privacy** significa ridurre al minimo le informazioni che il sistema rivela: sia i dati personali degli *utenti* **sia** i dettagli del *sistema stesso*. Il controesempio è un **banner che fa uscire informazioni**: collegarsi a una macchina (qui con \`telnet\`) ed essere accolti con la distribuzione esatta del sistema operativo (Red Hat 7.0) e la versione del kernel (2.2.16 su i686). È un regalo per un attaccante, che può subito cercare le vulnerabilità note di quella precisa versione (un passo di "pedigree" / fingerprinting). Anche le smart card fanno uscire in modo simile il loro tipo e la loro versione. È una debolezza di **divulgazione di informazioni** (i principi "riduci la superficie d'attacco" e "fallisci in modo sicuro / non far uscire informazioni"): i servizi dovrebbero rivelare il meno possibile su se stessi (togliere o rendere generici i banner di versione) e sui loro utenti.

### Slide 42-43 · Blind SQL injection

> (42) Suppose \`http://newspaper.com/items.php?id=2\` results in SQL injection-prone query \`SELECT title, body FROM items WHERE ID=2\`. Will we see different response to URLs below? \`...?id=2 AND 1=1\` / \`...?id=2 AND 1=2\`. We can use this to find out things about the database structure & content: \`../items.php?id=2 AND SUBSTRING(user,1,1) = 'a'\`. Blind SQL injection: result to an SQL injection not visible, but leaks information.
>
> (43) Even if all SQL errors report an identical, standard error page, without any further info, errors may still leak information: \`IF <some condition> SELECT 1 ELSE 1/0\`. Worse still, response time may still leak information: \`.. IF(SUBSTRING(user,1,1) = 'a', BENCHMARK(50000, …), null)..\`

**Analisi del codice.** Sta sotto "promuovere la privacy" perché mostra che le informazioni escono **anche quando l'applicazione sembra non rivelare nulla**: la **SQL injection cieca** (CWE-89, la variante per inferenza).

- *La situazione.* Il parametro \`id\` dell'URL viene iniettato in \`WHERE ID=2\`. Anche se la pagina non stampa mai i risultati della query né gli errori, l'attaccante può comunque estrarre dati **facendo domande vero/falso** e osservando *qualunque* differenza visibile.
- *Injection cieca booleana.* \`id=2 AND 1=1\` lascia vera la condizione (la pagina restituisce l'elemento normalmente); \`id=2 AND 1=2\` la rende falsa (l'elemento non viene restituito, la pagina appare diversa). Se le due risposte differiscono, l'applicazione è vulnerabile all'injection e l'attaccante ha un **oracolo di verità**. Poi fa domande che rivelano i dati un bit alla volta: \`id=2 AND SUBSTRING(user,1,1) = 'a'\` è vera se e solo se il primo carattere dell'utente del database è \`'a'\`. Ripetendo per ogni posizione e ogni carattere, **ricostruisce qualunque valore del database** (nomi di tabelle e colonne, dati, hash delle password) solo dalle risposte vero/falso.
- *Inferenza basata sugli errori (slide 43).* Anche se tutti gli errori restituiscono una pagina generica *identica*, l'attaccante può provocare un **errore rilevabile** in modo condizionale: \`IF <condition> SELECT 1 ELSE 1/0\`, dove \`1/0\` (la divisione per zero) lancia un errore solo quando la condizione è falsa, così "errore o nessun errore" diventa l'oracolo di verità.
- *Injection (cieca) basata sui tempi (slide 43).* Quando non c'è **alcuna** differenza visibile, l'attaccante fa *ritardare* il database in modo condizionale: \`IF(SUBSTRING(user,1,1)='a', BENCHMARK(50000,…), null)\` esegue un costoso \`BENCHMARK\` (o \`WAITFOR DELAY\`, Lezione 9, slide 10) solo quando l'ipotesi è giusta, così l'attaccante legge la risposta dal **tempo di risposta**. Funziona anche contro un'applicazione completamente silenziosa.
- *La lezione per "promuovere la privacy".* Nascondere l'output e rendere generici gli errori **non** basta come difesa dall'injection: le informazioni escono attraverso canali laterali (risposte diverse, errori, tempi). L'*unica* vera correzione è togliere l'injection stessa (query parametrizzate, Lezione 9, slide 14); sopprimere l'output rallenta soltanto l'attaccante.

## Gli altri principi (pagine 44-53)

### Slide 44 · It's hard to keep secrets

> - Don't rely on security by obscurity \\[Kerckhoffs principle\\]
> - Don't assume attackers don't know the application source code, and can't reverse-engineer binaries - Don't hardcode secrets in code - Don't rely on code obfuscation
> - Example - DVD encryption - webpages with hidden URLs - passwords in javascript code - this happens!

**Approfondimento.** **Nascondere i segreti è difficile; non affidarsi alla security by obscurity.** Per il **principio di Kerckhoffs** (1883), un sistema deve restare sicuro anche se tutto ciò che lo riguarda *tranne la chiave* è pubblico: la sicurezza deve basarsi su *chiavi* segrete, non su *progetti* segreti. Si presume che l'attaccante **abbia il codice sorgente** (open source, fughe, insider) e **possa fare reverse engineering dei binari** (disassembler e decompilatori, Lezione 6). Le conseguenze: non **scrivere mai segreti nel codice** (chiavi, password, token delle API), perché *verranno* estratti; non affidarsi mai all'**offuscamento del codice** come controllo di sicurezza (rallenta soltanto il reverse engineering). Gli esempi sono fallimenti famosi: la **cifratura CSS dei DVD** (la sua gestione delle chiavi fu ricostruita a ritroso, da cui DeCSS), gli **URL "nascosti"** (sicurezza basata sul non mettere link, banalmente trovati o indovinati, forced browsing) e, sorprendentemente comuni, le **password controllate in JavaScript lato client** (il browser dell'utente ha il codice *e* la password, quindi il controllo non vale nulla). Il segreto deve essere una vera chiave crittografica conservata lato server, non un progetto nascosto.

### Slide 45-46 · Use community resources

> (45) Never design your own cryptography. Never implement your own cryptography. Don't repeat known mistakes: If you're making an application of kind X using programming language Y on platform Z and operating system W, look for known threats for application of kind X; known vulnerabilities in language Y and platform Z; existing countermeasures.
>
> (46) Use google, books, webfora, etc. to learn & reuse: learn about vulnerabilities (and avoid making the same mistakes); learn about solutions and countermeasures (and reuse them).

**Approfondimento.** **Usare le risorse della comunità**, senza reinventare la ruota, soprattutto quella critica per la sicurezza.

- **"Never design or implement your own cryptography."** La regola più ripetuta del settore. La crittografia corretta è straordinariamente difficile da fare bene (matematica sottile, canali laterali, trappole nei protocolli); la crittografia fatta in casa è quasi sempre rotta. Si usano librerie ben verificate e ampiamente revisionate e algoritmi standard (Lezione 2, slide 24). La stessa cautela vale per altro codice difficile da fare bene: parser, autenticazione, gestione delle sessioni.
- **Non ripetere gli errori noti.** Per la propria combinazione specifica (tipo di applicazione X, linguaggio Y, piattaforma Z, sistema operativo W), cercare le minacce, le vulnerabilità e le contromisure *note*: OWASP, CWE/CVE, CERT, indicazioni dei produttori, libri (la bibliografia della Lezione 3). La maggior parte delle vulnerabilità sono nuove istanze di schemi ben documentati (Lezione 1, slide 61), quindi imparare dalla comunità evita di rifare gli errori noti del settore e permette di riusare difese collaudate. È la metà "conoscenza" della "consapevolezza e conoscenza" della Lezione 1.

### Slide 47 · Principle of psychological acceptability

> - If security mechanism is too cumbersome, users will switch it off, or find clever ways around it
> - User education may improve the situation, but only up to a point
> - How many security pop-ups can we expect the user to cope with, if any?

**Approfondimento.** L'**accettabilità psicologica** (un altro principio di Saltzer e Schroeder): un meccanismo di sicurezza **troppo scomodo verrà aggirato**, gli utenti lo disattivano, lo scavalcano o commettono errori, quindi l'usabilità *è* una proprietà di sicurezza. Regole sulle password troppo rigide producono riuso delle password e foglietti adesivi; troppe finestre di conferma abituano gli utenti a cliccare "OK" per riflesso (l'assuefazione agli avvisi), così gli avvisi non valgono più nulla. La formazione aiuta "solo fino a un certo punto": non si può eliminare con la formazione un progetto fondamentalmente inusabile. La conseguenza: **progettare la sicurezza in modo che sia il più trasparente e meno faticosa possibile** (impostazioni predefinite sicure, single sign-on, passkey, richieste minime), perché il meccanismo più sicuro è quello che gli utenti continuano davvero a usare correttamente. Si collega al "security theatre" e al fattore umano (Lezione 2, slide 17; Lezione 1, slide 6).

### Slide 48 · Don't mix data & code

> This is the cause of many problems, eg
>
> - traditional buffer overflow attacks, which rely on mixing data and code on the stack
> - javascript in webpages - leads to XSS (cross site scripting attacks)
> - SQL injection relies on use data (user input!) as part of SQL query

**Approfondimento.** **Non mescolare dati e codice**, il principio cardine che unifica la maggior parte del corso (Lezione 3, slide 54; Lezione 4, slide 23). Quando dati e istruzioni eseguibili condividono un canale, un attaccante può far entrare di nascosto del codice attraverso i dati:

- **Buffer overflow**: sullo stack i *dati* (il buffer) stanno accanto alle *informazioni di controllo* (il return address), quindi scrivere dati sovrascrive il flusso del codice (Lezione 3).
- **XSS**: una pagina web mescola *contenuto* (dati) e *script* (codice); i dati dell'utente ripetuti nella pagina senza separazione vengono eseguiti come JavaScript nel browser della vittima (Lezione 5).
- **SQL injection**: i *dati* dell'utente vengono concatenati in un *comando* SQL e analizzati come codice (Lezioni 5 e 9).

La cura è sempre la stessa: **tenere rigorosamente separati dati e codice**: memoria dei dati non eseguibile + canary (buffer overflow), codifica dell'output / Content-Security-Policy (XSS), query parametrizzate (SQL). Quando non si può evitare di mescolarli, trattare tutti i dati inseriti come non fidati e codificarli o farne l'escaping per il contesto di destinazione.

### Slide 49 · Clearly assign responsibilities

> At organizational level: eg. make one person responsible for something rather than two persons - or a whole group.
>
> At coding level: make one module/class responsible for input validation, access control, ... For a method \`public void process(String str)\` is the caller or callee responsible for checking if for instance \`str != null && !(str.equals(""))\`? But still practice defence in depth...

**Approfondimento.** **Assegnare chiaramente le responsabilità**, così i compiti di sicurezza non cadono nel vuoto fra le parti ("la responsabilità di tutti è la responsabilità di nessuno").

- *Nell'organizzazione*: rendere responsabile di ogni questione di sicurezza **una** persona, non due e non un comitato, così c'è un titolare chiaro.
- *Nel codice*: designare **un modulo o una classe** come responsabile di ogni questione trasversale (validazione dell'input, controllo degli accessi), l'idea del punto di passaggio centralizzato (Lezione 5, slide 27). Al livello del metodo, rendere **esplicito il contratto**: è responsabile *chi chiama* o *chi è chiamato* di controllare che \`str\` non sia null né vuota? Se ognuno dei due presume che lo faccia l'altro, il controllo manca (una lacuna nelle precondizioni); se lo fanno entrambi, è ridondante ma sicuro. La nota di equilibrio della slide: anche con titolari chiari, **continuare a praticare la difesa in profondità**: un input validato e ricontrollato a un livello più profondo è un'assicurazione economica contro un'ipotesi sbagliata.

### Slide 50 · Identify your assumptions

> Including obvious, implicit assumptions - these may be sources of vulnerability, and may change in long run. Examples:
>
> - laptops invalidate implicit assumption that computers don't move past the company firewall
> - assumption that user is a human may cause you to ignore possibility of brute-force password guessing
> - TCP SYN flood attack exploits implicit assumptions in the spec "If we receive a TCP packet with the SYN flag set, it means the sender wants to start a dialog with us"
> - assumption that new LoginContext() won't throw an OutOfMemoryException
> - assumption that a Java applet won't use all CPU time

**Approfondimento.** **Identificare le proprie ipotesi**, soprattutto quelle *implicite*, perché le vulnerabilità vivono nelle ipotesi non dette e non esaminate, e quelle ipotesi **cambiano nel tempo** (l'environmental creep, slide 9). Gli esempi sono tutti ipotesi implicite violate:

- "I computer non escono dal perimetro protetto dal firewall", smentita dai **portatili** (e ora dal cloud e dal lavoro da remoto).
- "L'utente è un essere umano", smentita dall'**indovinare automatico delle password a forza bruta** (quindi limiti di frequenza, CAPTCHA).
- "Un pacchetto SYN è una vera richiesta di connessione", sfruttata dal DoS **TCP SYN flood** (le connessioni semiaperte esauriscono la tabella del server; corretto con i SYN cookie).
- "\`new LoginContext()\` non lancerà \`OutOfMemoryException\`" e "un'applet Java non monopolizzerà la CPU": ipotesi sull'esaurimento delle risorse che un attaccante viola di proposito (DoS).

La pratica: **scrivere le proprie ipotesi, trattarle come parte del modello delle minacce, e ricontrollarle quando l'ambiente cambia.** Un'ipotesi vera oggi può essere la vulnerabilità di domani.

### Slide 51 · Be reluctant to trust

> - Understand and respect the chain of trust
> - NB trust is transitive
> - NB trust is not a good thing
> - NB "trusted" is not the same as "trustworthy"
> - Minimize Trusted Computing Base (TCB), ie that part of the system (software and hardware) that has to be trusted

**Approfondimento.** **Essere restii a fidarsi.** Alcuni punti netti:

- **La fiducia è transitiva**: se A si fida di B e B si fida di C, allora A di fatto si fida di C, quindi ogni dipendenza di cui ci si fida si porta dietro le *sue* dipendenze (la preoccupazione per la catena di fornitura, Lezione 2, slide 8). Va mappata l'intera **catena di fiducia**.
- **"Trust is not a good thing."** In sicurezza, *fidarsi* di un componente significa *dipendere* da esso ed essere quindi *esposti* se cede: la fiducia è un passivo da ridurre al minimo, non una virtù.
- **"Trusted" ≠ "trustworthy".** Un componente *trusted* è uno su cui si *deve* contare (se cede, si è compromessi); uno *trustworthy* è uno che merita davvero quella fiducia. Il pericolo è fidarsi di qualcosa che non è affidabile.
- **Ridurre al minimo la Trusted Computing Base (TCB)**: l'insieme di hardware e software che *deve* essere corretto perché la sicurezza regga (Lezione 1, slide 59; Lezione 6, slide 27). Più la TCB è piccola, meno c'è da sbagliare e più è facile verificarla, quindi va ridotto ciò di cui ci si deve fidare (moduli critici piccoli, slide 27).

### Slide 52 · Ken Thompson (Reflections on Trusting Trust)

> Backdoor in UNIX and Trojan in C-compiler revealed during Turing award lecture
>
> 1. backdoor in login.c of UNIX: \`if (name == "ken") {don't check password; log in as root}\`
> 2. code in C compiler to add backdoor when recompiling login.c
> 3. code in C compiler to add code (2 & 3!) when (re)compiling a compiler

**Approfondimento.** L'illustrazione definitiva del principio "essere restii a fidarsi", la backdoor che si propaga nel compilatore di Ken Thompson, già vista nel dettaglio nella **Lezione 2, slide 8** (*Reflections on Trusting Trust*). Le tre fasi: (1) una backdoor in \`login.c\` che fa entrare "ken" come root senza password; (2) codice nel compilatore che *reinserisce* quella backdoor ogni volta che si compila \`login.c\`, anche da un sorgente pulito; (3) codice nel compilatore che reinserisce *sia* la (2) *sia* la (3) ogni volta che si compila il compilatore stesso, così la backdoor sopravvive nel binario senza traccia in alcun sorgente. La morale: non ci si può fidare del tutto di codice che non si è costruito da sé, fino al compilatore e all'hardware, ed è proprio per questo che contano la TCB (slide 51) e la catena di fornitura (Lezione 2).

### Slide 53 · Be reluctant to trust (l'input dell'utente)

> - All user input is evil! - Eg unchecked user input leads to buffer overflows; SQL injection; XSS on websites - User input includes cookies, environment variables, ...
> - User input should not be trusted, and subjected to strong input validation checks before being used
> - Don't trust third-party software

**Approfondimento.** L'applicazione più pratica del principio "essere restii a fidarsi": **tutto l'input dell'utente è malvagio** (Lezione 5, slide 26). L'input non fidato è la radice di buffer overflow, SQL injection e XSS, e il cosiddetto "input dell'utente" è **più ampio dei campi dei moduli**: comprende cookie, intestazioni HTTP, variabili d'ambiente, nomi di file, file caricati, payload delle API, tutto ciò che attraversa il confine di fiducia. Tutto deve passare una **validazione dell'input robusta** prima dell'uso (white list, canonizzazione, controllo dei tipi; Lezioni 4-5). E **non fidarsi** nemmeno **del software di terze parti**: librerie e componenti fanno parte della propria superficie d'attacco e della propria TCB (dipendenze vulnerabili, la pedigree analysis della Lezione 6). Questa slide ricollega tutta la lezione sui principi di progettazione alla lezione centrale del corso sulle vulnerabilità.

### Slide 54 · Security principles (riepilogo)

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

**Approfondimento.** Il riepilogo finale ripete l'elenco dei principi della slide 3. Presi insieme sono la checklist di chi progetta: applicarli a ogni livello (slide 4), accettare che si sovrappongono e a volte entrano in conflitto (risolvendo le tensioni con il giudizio, per esempio con la compartimentazione che concilia privilegio minimo e semplicità), e usarli sia per *rivedere* un progetto cercandone le debolezze sia per *guidare* la scelta delle contromisure. Sono i "da fare" che prevengono i "da non fare" catalogati nel resto del corso.
`;export{e as default};
