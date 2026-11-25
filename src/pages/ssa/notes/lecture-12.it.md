La Lezione 12 rende formale la progettazione sicura: che cosa significa "progettazione" (ISO/IEC 12207), gli otto classici **principi di progettazione di Saltzer e Schroeder (1975)** (la fonte autorevole dietro l'elenco della Lezione 10), il catalogo di principi di NIST SP 800-160, e la **modellazione delle minacce e degli attacchi** (centrata sull'attaccante, sul progetto, sugli asset; STRIDE di Microsoft; gli attack tree del CERT). Le slide sono 14.

## Che cos'è la progettazione (pagine 2-3)

### Slide 2 · What is design?

> ISO/IEC 12207:2008:
>
> - "Software architectural design. For each software item …the implementer shall transform the requirements for the software item into an architecture that describes its top-level structure and identifies the software components. It shall be ensured that all the requirements for the software item are allocated to its software components and further refined to facilitate detailed design."
> - "Software detailed design process is to provide a design for the software that implements and can be verified against the requirements…"
>
> In short:
>
> - Determine components (e.g., classes, programming languages, frameworks, database systems, etc.) that you'll use, and how you'll use them (interconnections/APIs), to solve the problem

![Lezione 12, pagina 2](L12_p02.webp "27% 488x304")

**Figura.** La piccola icona di un diagramma di flusso dei dati (due nodi arrotondati e un riquadro da un lato di una linea verticale, un'entità esterna dall'altro) che suggerisce un sistema scomposto in componenti attraverso un confine.

**Approfondimento.** La **progettazione** è la fase fra i requisiti e l'implementazione in cui si decide la struttura del sistema. ISO/IEC 12207 (lo standard sul ciclo di vita del software) la divide in **progettazione architetturale** (la struttura di alto livello: quali sono i componenti principali, e assicurarsi che ogni requisito sia assegnato a qualche componente) e **progettazione di dettaglio** (raffinare ogni componente quanto basta per implementarlo e *verificarlo* rispetto ai requisiti). In parole semplici (come dice la slide, "in short"): **scegliere i componenti** (classi, linguaggi, framework, database) e **come si collegano** (API, flussi di dati) per risolvere il problema. La progettazione conta per la sicurezza perché **i difetti di progettazione sono circa metà di tutte le vulnerabilità** (Lezione 1, slide 38) e qui costano molto meno da correggere che dopo il rilascio (shift left, Lezione 1, slide 43), quindi la sicurezza va costruita dentro l'architettura, non aggiunta dopo.

### Slide 3 · Developing secure software is not new or unknown

> - Saltzer & Schroeder principles, and many specifics, publicly known since at least 1970s
> - Problem is that most software developers do not know how to do it - Attackers, of course, know this
> - Knowing various principles and rules-of-thumb ahead-of-time can avoid many problems later

**Approfondimento.** Un'importante riformulazione: la progettazione sicura **non è un'arte nuova o segreta**. I principi fondamentali furono pubblicati da **Jerome Saltzer e Michael Schroeder nel 1975** ("The Protection of Information in Computer Systems"), e gli schemi di vulnerabilità specifici sono documentati da decenni. Il vero problema è una **lacuna di conoscenza**: alla maggior parte degli sviluppatori questi principi non sono mai stati insegnati (la "mancanza di consapevolezza e di conoscenza" della Lezione 1), mentre **gli attaccanti li conoscono bene**, un'asimmetria che l'attaccante sfrutta. Il rimedio è esattamente questo corso: imparare i principi e le regole pratiche *prima* di scrivere codice evita una grossa parte delle vulnerabilità, il che costa molto meno che trovarle e correggerle dopo.

## I principi di progettazione di Saltzer e Schroeder (pagine 4-7)

### Slide 4 · Saltzer and Schroeder design principles (1)

> - **Least privilege** - Each user and program should operate using fewest privileges possible - Limits the damage from an accident, error, or attack - Reduces number of potential interactions among privileged programs (Unintentional, unwanted, or improper uses of privilege less likely) - Extend to the internals of a program: only smallest portion of program which needs those privileges should have them
> - **Economy of mechanism/Simplicity** - Protection system's design should be simple and small as possible - "techniques such as line-by-line inspection of software and physical examination of hardware that implements protection mechanisms are necessary. For such techniques to be successful, a small and simple design is essential." - Aka "KISS" principle ("keep it simple, stupid")

**Approfondimento.** I primi due degli otto principi (tutti anticipati nella Lezione 10):

- **Privilegio minimo**: ogni utente e ogni programma gira con i **minimi privilegi necessari**, il che limita i danni di qualunque errore o attacco e riduce le interazioni pericolose fra programmi privilegiati. Soprattutto, si estende **dentro** un programma: solo la parte più piccola che ha davvero bisogno di un privilegio deve possederlo (separazione dei privilegi; Lezione 10, slide 15-19).
- **Economia dei meccanismi / semplicità (KISS)**: il meccanismo di protezione deve essere **il più piccolo e semplice possibile**, perché la sicurezza si può *verificare* (con una revisione riga per riga, con un'ispezione) solo se è abbastanza semplice da essere capita del tutto. **La complessità è nemica della sicurezza**: ogni funzione in più è altro codice da sbagliare e altra superficie d'attacco. È alla base del "ridurre al minimo la TCB" (Lezione 10, slide 51) e della tensione fra KISS e privilegio minimo (Lezione 10, slide 21).

### Slide 5 · Saltzer and Schroeder design principles (2): Open design

> - **Open design** - The protection mechanism must not depend on attacker ignorance - Instead, the mechanism should be public (Depend on secrecy of relatively few (and easily changeable) items like passwords or private keys) - An open design makes extensive public scrutiny possible - Makes it possible for users to convince themselves system is adequate - Not realistic to maintain secrecy for distributed system (Decompilers/subverted hardware quickly expose implementation "secrets"; Even if you pretend that source code is necessary to find exploits (it isn't), source code has often been stolen and redistributed; This is one of the oldest and strongly supported principles, based on many years in cryptography)
>   - Kerckhoffs's Law: "A cryptosystem should be designed to be secure if everything is known about it except the key information"
>   - Claude Shannon restated Kerckhoff's Law as: "\[Assume\] the enemy knows the system"

**Approfondimento.** **Progettazione aperta**: la sicurezza **non deve dipendere dalla segretezza del progetto** (niente security by obscurity, Lezione 10, slide 44). Il meccanismo deve essere **pubblico**, con la segretezza limitata a **pochi elementi facili da cambiare**: le chiavi e le password. I vantaggi dell'apertura: permette il **controllo pubblico** (molti revisori trovano i difetti, "molti occhi") e permette agli utenti di *verificare* che il sistema sia adeguato invece di fidarsi di una scatola nera. Le giustificazioni: comunque non si può tenere segreto l'interno di un sistema distribuito (decompilatori, reverse engineering, sorgenti rubati) e, in modo decisivo, **il codice sorgente non serve per trovare gli exploit** (bastano l'analisi dei binari e il fuzzing). È il principio più antico e più solido, fondato su un secolo di crittografia:

- **La legge di Kerckhoffs (1883)**: un sistema crittografico deve restare sicuro anche se di esso si sa tutto *tranne la chiave*.
- **La riformulazione di Claude Shannon**: *"the enemy knows the system."* Progettare come se l'attaccante avesse il progetto e il sorgente completi, e affidarsi solo alla chiave segreta.

Ecco perché gli standard crittografici veri (AES, TLS) sono completamente pubblici e hanno resistito a decenni di attacchi aperti, l'opposto di un cifrario proprietario segreto.

### Slide 6 · Saltzer and Schroeder design principles (3): mediazione, impostazioni predefinite, separazione

> - **Complete mediation ("non-bypassable")** - Every access attempt must be checked; position the mechanism so it cannot be subverted. For example, in a client-server model, generally the server must do all access checking because users can build or modify their own clients
> - **Fail-safe defaults (e.g., permission-based approach)** - The default should be denial of service, and the protection scheme should then identify conditions under which access is permitted - More generally, installation should be secure by default
> - **Separation of privilege** - Ideally, access to objects should depend on more than one condition, so that defeating one protection system won't enable complete access

**Approfondimento.** Altri tre principi:

- **Mediazione completa (non aggirabile)**: **ogni** accesso a ogni oggetto deve essere controllato, **senza modo di aggirare** il controllo, e il controllo deve stare in un punto in cui non può essere sovvertito. L'esempio chiave della slide: in un sistema **client-server**, **tutto il controllo degli accessi va imposto sul server**, perché l'attaccante **controlla il client** (può modificarlo o riscriverlo; il "non fidarti del client" della Lezione 10). Non affidarsi mai a un controllo lato client (il fallimento della password in JavaScript della Lezione 10, slide 44). Si realizza con un *reference monitor* sempre invocato, a prova di manomissione e abbastanza piccolo da essere verificato (Lezione 1, slide 54).
- **Impostazioni predefinite fail-safe**: **per impostazione predefinita negare** (nessun accesso), poi elencare esplicitamente le condizioni che concedono l'accesso, uno schema **a white list / basato sui permessi**. Più in generale, consegnare il prodotto **sicuro per impostazione predefinita** (Lezione 10, slide 31 e 40). Significa anche fallire chiusi in caso di errore (Lezione 10, slide 32).
- **Separazione dei privilegi**: richiedere **più di una condizione** per concedere l'accesso (due chiavi, autenticazione a più fattori, controllo a due persone), così compromettere una *sola* protezione non dà l'accesso completo. È la difesa in profondità per l'autorizzazione; l'MFA ne è la forma quotidiana.

### Slide 7 · Saltzer and Schroeder design principles (3 cont.): meccanismo comune minimo, accettabilità psicologica

> - **Least common mechanism** - Minimize the amount and use of shared mechanisms (e.g. use of the /tmp or /var/tmp directories) - Shared objects provide potentially dangerous channels for information flow and unintended interactions
> - **Psychological acceptability / Easy to use** - The human interface must be designed for ease of use so users will routinely and automatically use the protection mechanisms correctly - Mistakes will be reduced if the security mechanisms closely match the user's mental image of his or her protection goals

**Approfondimento.** Gli ultimi due principi:

- **Meccanismo comune minimo**: **ridurre al minimo i meccanismi e lo stato condivisi** fra utenti e componenti. Tutto ciò che è condiviso (una directory `/tmp`, una variabile globale, l'istanza di una libreria condivisa, una cache comune) è un potenziale **canale** di flusso di informazioni non voluto o di interferenza fra utenti, esattamente i problemi di race condition e di link simbolici in `/tmp` della Lezione 11, slide 18 e 24, e una fonte di **canali nascosti** e canali laterali. Meglio risorse per utente e per componente (è la motivazione progettuale della compartimentazione, Lezione 10, slide 20).
- **Accettabilità psicologica** (facilità d'uso): il meccanismo di sicurezza deve essere **usabile**, così che gli utenti lo applichino **correttamente e in automatico**, e deve **corrispondere al modello mentale dell'utente** di ciò che sta proteggendo. Se la sicurezza è difficile o confusa, gli utenti sbagliano o la aggirano (Lezione 10, slide 47). L'usabilità *è* sicurezza.

### Slide 8 · Design principles... (applicabilità)

> - Any design must also consider other requirements and specific circumstances
> - Not all details apply to all systems - Web apps ≠ Local apps ≠ GUI ≠ setuid programs - But better to know the larger set of issues

**Approfondimento.** Un'avvertenza sull'applicazione dei principi: sono **euristiche generali, non una checklist meccanica**, e vanno **bilanciati con gli altri requisiti** (prestazioni, costi, usabilità) e con il **contesto specifico**. Tipi di sistema diversi affrontano minacce diverse: un'**applicazione web** (input remoto da una rete non fidata), un'**applicazione locale**, una **GUI**, un **programma setuid** (confine di privilegio locale, i problemi di mkdir e delle race della Lezione 11) mettono ciascuno l'accento su principi diversi. Ma, sottolinea la slide, è **meglio conoscere l'intero insieme** e decidere consapevolmente quali si applicano, che ignorare un'intera classe di problemi. (È il punto "conosci il tuo stack / conosci le minacce per il tuo tipo di applicazione" delle Lezioni 5-6.)

### Slide 9 · NIST SP 800-160 volume 1 Appendix F (principi di progettazione)

![Lezione 12, pagina 9](L12_p09.webp "50% 1400x931")

**Figura.** Una tabella in tre parti che elenca il catalogo NIST dei principi di progettazione per la sicurezza:

- **Security Architecture and Design**: Clear Abstractions, Least Common Mechanism, Modularity and Layering, Partially Ordered Dependencies, Efficiently Mediated Access, Minimized Sharing, Reduced Complexity, Secure Evolvability, Trusted Components, Hierarchical Trust, Inverse Modification Threshold, Hierarchical Protection, Minimized Security Elements, Least Privilege, Predicate Permission, Self-Reliant Trustworthiness, Secure Distributed Composition, Trusted Communication Channels.
- **Security Capability and Intrinsic Behaviors**: Continuous Protection, Secure Metadata Management, Self-Analysis, Accountability and Traceability, Secure Defaults, Secure Failure and Recovery, Economic Security, Performance Security, Human Factored Security, Acceptable Security.
- **Life Cycle Security**: Repeatable and Documented Procedures, Procedural Rigor, Secure System Modification, Sufficient Documentation.

**Approfondimento.** L'Appendix F di **NIST SP 800-160** ("Systems Security Engineering") estende gli otto principi di Saltzer e Schroeder in un catalogo moderno e completo di circa 30, organizzato in tre gruppi: *architettura e progettazione* (come strutturare il sistema; si noti che i principi di Saltzer e Schroeder ricompaiono qui: privilegio minimo, meccanismo comune minimo, complessità ridotta = economia dei meccanismi, ecc.), *capacità e comportamenti intrinseci* (le proprietà che il sistema deve mostrare: protezione continua, impostazioni predefinite sicure, fallimento e ripristino sicuri = fallire in modo sicuro, sicurezza a misura d'uomo = accettabilità psicologica), e *sicurezza del ciclo di vita* (il processo: procedure documentate, rigorose e ben documentate). Il punto per gli studenti: gli otto principi classici sono il nucleo, e standard come NIST SP 800-160 e le indicazioni affini di OWASP e ISO li raffinano e li estendono in una checklist ingegneristica per costruire sistemi sicuri.

## Modellazione delle minacce e degli attacchi (pagine 10-14)

### Slide 10 · Analysis approaches

> - **Attacker-centric** - Starts with an attacker - Evaluates their goals and how they might achieve them (e.g., via entry points) - Used in CERT attack modeling approach
> - **Design-centric** - Starts with the design of the system: steps through system model, looking for types of attacks against each element - Used in threat modeling in Microsoft's Security Development Lifecycle
> - **Asset-centric** - Starts from key assets entrusted to a system

**Approfondimento.** La **modellazione delle minacce** è l'attività strutturata di trovare, durante la progettazione, come un sistema potrebbe essere attaccato, così gli attacchi si possono mitigare *prima* che un attaccante li tenti. Ci sono tre **punti di partenza** complementari:

- **Centrata sull'attaccante**: partire dall'**attaccante**, dai suoi obiettivi, capacità e punti d'ingresso, e ragionare su come raggiungerebbe quegli obiettivi (usata negli attack tree del CERT, slide 12). Rispecchia il "pensa come un attaccante" (Lezione 1, slide 32).
- **Centrata sul progetto**: partire dal **progetto / dall'architettura del sistema**, percorrere ogni componente e ogni flusso di dati, e chiedersi quali attacchi si applicano a ciascuno (usata nell'SDL di Microsoft con STRIDE, slide 11).
- **Centrata sugli asset**: partire dagli **asset di valore** che il sistema protegge (dati, funzionalità) e ragionare sulle minacce a ciascuno (il cosiddetto "inventario degli asset" della Lezione 1, slide 49).

In pratica le tre si combinano: identificare gli asset, modellare il progetto ed elencare gli attacchi. Tutte rispondono alla domanda "che cosa può andare storto?" in modo sistematico invece che improvvisato.

### Slide 11 · Microsoft STRIDE Approach

> - Decompose system into relevant (design) components - Uses simple data flow diagrams, identify trust boundary
> - Analyze each component for susceptibility to threats
> - Mitigate the threats
> - Now part of the Microsoft SDL with the Threat Modeling Tool

![Lezione 12, pagina 11](L12_p11.webp "50% 1101x623")

**Figura.** La tabella STRIDE che collega ogni categoria di minaccia alla proprietà di sicurezza che viola:

| Minaccia "STRIDE" | Proprietà di sicurezza (violata) |
| --- | --- |
| **S**poofing | Autenticazione |
| **T**ampering | Integrità |
| **R**epudiation | Non ripudio |
| **I**nformation disclosure | Riservatezza |
| **D**enial of service | Disponibilità |
| **E**levation of privilege | Autorizzazione |

**Approfondimento.** **STRIDE** è il metodo di modellazione delle minacce **centrato sul progetto** di Microsoft (parte dell'SDL, con un Threat Modeling Tool gratuito), già introdotto nella Lezione 1 (slide 56). Il processo:

1. **Scomporre** il sistema in componenti con un **diagramma di flusso dei dati** (processi, archivi di dati, flussi di dati, entità esterne), e segnare i **confini di fiducia**, le linee in cui i dati passano da una zona meno fidata a una più fidata (per esempio rete → server, utente → applicazione). È sui confini di fiducia che si concentrano le minacce, perché è lì che entra l'input non fidato.
2. **Analizzare ogni elemento** rispetto alle sei categorie di minaccia STRIDE, chiedendo per ciascuno: può subire **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure, **D**enial of service o **E**levation of privilege?
3. **Mitigare** ogni minaccia individuata con la contromisura per la proprietà violata (autenticazione contro lo spoofing, controlli di integrità contro il tampering, log e firme contro la repudiation, cifratura e controllo degli accessi contro la divulgazione, ridondanza e limiti di frequenza contro il DoS, autorizzazione contro l'elevation).

L'eleganza sta nella **corrispondenza uno a uno**: ogni minaccia STRIDE è la violazione di esattamente una proprietà della CIA estesa (la tabella), quindi dare un nome alla minaccia suggerisce subito la difesa. STRIDE rende sistematica e completa l'enumerazione delle minacce, invece di affidarsi al fatto che l'analista pensi a tutto.

### Slide 12 · CERT Attack Modeling (gli attack tree)

> - Create simple design overview
> - Develop "attack trees" - top is attacker's objective, decompose down into conditions that achieve that (with AND or OR)
> - Devise methods to counterattack (build on attack patterns)
> - E.G., Buffer Overflow Attack Pattern:
>   - Goal: Exploit buffer overflow vulnerability to perform malicious function on target system
>   - Precondition: Attacker can execute certain programs on target system
>   - Attack: AND: 1. Identify executable program on target system susceptible to buffer overflow vulnerability; 2. Identify code that will perform malicious function when it executes with program's privilege; 3. Construct input value that will force code to be in program's address space; 4. Execute program in a way that makes it jump to address at which code resides
>   - Postcondition: Target system performs malicious function

**Approfondimento.** Gli **attack tree** sono la tecnica **centrata sull'attaccante** (CERT). Un attack tree è un albero la cui **radice è l'obiettivo dell'attaccante**, scomposto verso il basso nelle sottocondizioni necessarie per raggiungerlo, combinate con nodi **AND** (servono tutti i figli) e nodi **OR** (basta un figlio). Le foglie sono azioni concrete dell'attaccante. L'albero elenca in modo sistematico i modi per raggiungere l'obiettivo, così chi difende può **escogitare contromisure** per ogni percorso, idealmente tagliando un ramo **AND** (se si rompe un passo necessario, l'intero percorso fallisce) o coprendo ogni alternativa **OR**. I sottoalberi riutilizzabili vengono catturati come **attack pattern**.

Il **pattern d'attacco del buffer overflow** svolto nella slide formalizza l'exploit della Lezione 3 come un pattern con una *precondizione* (l'attaccante può eseguire programmi sul bersaglio), un **AND** di quattro passi necessari (trovare un programma vulnerabile; preparare codice malevolo da eseguire con i privilegi di quel programma; portare quel codice nello spazio di indirizzamento del programma con un input costruito ad arte; far saltare il programma su di esso) e una *postcondizione* (il bersaglio esegue la funzione malevola). Poiché i quattro passi sono in AND, rompere **uno qualunque** sventa l'attacco, ed è esattamente ciò che fanno le difese delle Lezioni 3 e 8: NX ferma i passi 3-4 (il codice iniettato non può essere eseguito), ASLR rompe il passo 4 (l'indirizzo è sconosciuto), gli stack canary rilevano l'overflow che rende possibili i passi 3-4, e correggere il bug toglie il programma vulnerabile del passo 1. Gli attack tree rendono visibile *dove* mettere ogni difesa.

### Slide 13 · CERT Attack Modeling (un esempio di attack tree)

![Lezione 12, pagina 13](L12_p13.webp "50% 1400x538")

**Figura.** Un esempio di attack tree con l'obiettivo dell'attaccante in cima e la scomposizione AND/OR sotto:

- **Radice (obiettivo dell'attaccante):** *Read confidential data*, combinata con **OR**, quindi basta uno dei due sottoalberi.
  - **Access data using an account**, combinato con **AND** (servono entrambi i figli):
    - *Obtain a valid password*, combinato con **OR**: *Successful phishing* OR *Use a previously compromised password*.
    - *Pass the MFA check*.
  - **Read an exposed backup**, combinato con **AND** (servono entrambi i figli):
    - *Locate a backup accessible without login*.
    - *Have the backup in unencrypted form*.

**Approfondimento.** Questo diagramma mostra come si legge un attack tree. L'obiettivo *"read confidential data"* si può raggiungere **in due modi (OR)**: attraverso un account utente, o attraverso un backup esposto. Il percorso dell'account è un **AND**, che richiede *sia* una password valida *sia* il superamento dell'MFA, e ottenere la password è a sua volta un **OR** (phishing o una password riusata o trapelata). Il percorso del backup è un **AND** che richiede un backup che sia raggiungibile senza login *e* non cifrato.

Il punto è la lettura difensiva: per bloccare un percorso, **rompere un nodo di ogni AND**. Il percorso dell'account crolla se l'MFA non si può aggirare (quindi l'MFA è un controllo di grande valore: copre tutto il sottoalbero di sinistra); è indebolito anche dalla formazione anti-phishing e dal blocco delle password trapelate (che coprono le foglie dell'OR). Il percorso del backup crolla se i backup sono **cifrati** *oppure* se **non sono raggiungibili senza autenticazione** (basta rompere uno dei due figli dell'AND). Così l'albero dice direttamente a chi progetta quali sono le mitigazioni efficaci più economiche: cifrare i backup e limitarne l'accesso; imporre l'MFA e una buona igiene delle password. È esattamente il metodo "pensa come un attaccante, poi contrasta ogni percorso", applicato in concreto.

### Slide 14 · Conclusions

> - There are various key design principles - E.G., Saltzer and Schroeder
> - Need to design program to counterattack, e.g.: - Minimize privileges - Counter TOCTOU issues
> - Use attack/threat modeling to look for potentially-successful attacks - Before the attacker tries them
> - Many design approaches for self-protection
> - Consider principles and rules-of-thumb in design

**Approfondimento.** Le conclusioni della lezione: (1) esiste un corpus consolidato di **principi di progettazione** (Saltzer e Schroeder, NIST SP 800-160) da applicare; (2) il programma deve essere **progettato per difendersi**, concretamente riducendo al minimo i privilegi (privilegio minimo) e contrastando i problemi di **TOCTOU e race** (Lezione 11), fra gli altri; (3) la **modellazione delle minacce e degli attacchi** (STRIDE, attack tree) va usata in modo proattivo per trovare gli attacchi praticabili **prima che li trovi l'attaccante**, durante la progettazione, quando le correzioni costano meno; (4) esistono molti design pattern per l'autoprotezione; e (5) il messaggio generale: **tenere presenti in modo consapevole i principi e le regole pratiche durante la progettazione**, invece di scoprirne la necessità dopo una violazione. La progettazione sicura è il culmine "shift left" del corso: prevenire intere classi delle vulnerabilità studiate prima costruendo la sicurezza nell'architettura fin dall'inizio.
