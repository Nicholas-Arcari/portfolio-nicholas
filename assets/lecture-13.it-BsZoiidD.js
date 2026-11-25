const e=`La Lezione 13 è il coronamento del corso: come incorporare la sicurezza nell'*intero* processo di sviluppo del software invece di aggiungerla alla fine. Mette a confronto il ciclo di vita tradizionale (che ignora la sicurezza) con il **Secure Development Lifecycle (SDL)**, percorre le attività di sicurezza di ogni fase (requisiti, progettazione, implementazione, verifica, rilascio, risposta) e presenta l'**SDL di Microsoft** come caso di studio (il paradigma SD³+C, la Final Security Review e i risultati misurati). Le slide sono 28.

**Nota sulla figura ricorrente.** Dalla slide 7 in poi la maggior parte delle slide mostra lo stesso **diagramma a catena**, le sei fasi del ciclo di vita come una sequenza di frecce da sinistra a destra (*Requirements → Design → Implementation → Verification → Deployment/Release → Maintenance/Response*), con la fase di cui si parla evidenziata in rosso. È descritto una volta qui e non viene ripetuto slide per slide.

## Perché la sicurezza va costruita dentro (pagine 2-6)

### Slide 2 · Definitions

> - *Software Engineering*: Concept of creating and maintaining software applications by applying technologies and practices from computer science and project management fields \\[Wikipedia\\]
> - Secure Software Engineering

**Approfondimento.** L'**ingegneria del software** è l'applicazione disciplinata di tecniche dell'informatica *e* di pratiche di gestione dei progetti per costruire e **mantenere** il software; si noti che la manutenzione (la lunga coda della vita di un prodotto) ne fa parte. L'**ingegneria del software sicuro** aggiunge la sicurezza come preoccupazione di primo piano in tutta quella disciplina: non una funzione aggiunta tardi, ma una proprietà costruita in ogni fase e mantenuta per tutto il ciclo di vita. Questa lezione definisce come.

### Slide 3 · "Current"/Traditional Software Engineering

> - Over 30 years of software development experience created a well defined application software development lifecycle
> - There are many software development methodologies (ex. XP, waterfall, etc) they all have these basic steps
> - Capability Maturity Model for Software (SW-CMM) is used to measure quality of methodologies employed

![Lezione 13, pagina 3](L13_p03.webp "50% 1400x68")

**Figura.** Il tradizionale **Software Development Life Cycle (SDLC)** come una catena da sinistra a destra: **REQUIREMENTS → DESIGN → IMPLEMENTATION → TESTING → DEPLOYMENT → MAINTENANCE**.

**Approfondimento.** L'**SDLC** standard ha sei fasi (requisiti → progettazione → implementazione → test → rilascio → manutenzione). Anche se le metodologie differiscono, **a cascata** (fasi rigorosamente in sequenza), **agile/XP** (brevi cicli iterativi), a spirale, contengono tutte queste attività di base. L'**SW-CMM (Capability Maturity Model for Software)** valuta quanto è maturo e ripetibile il processo di un'organizzazione (livelli da 1 a 5, da "ad hoc" a "optimising"). L'osservazione cruciale (slide successiva): questo processo tradizionale **non contiene alcuna attività di sicurezza**.

### Slide 4 · Motivation

> - This application development process in its essence fails to address security issues
> - Consequently, security flaws are identified only at the later stages of the application lifecycle. And thus: Much greater cost to fix; High maintenance cost; …
> - Nearly every company/organization utilizes network security infrastructure (e.g. Firewalls, IDS, etc)
> - But very small number of them invest in application security strategy, design, and code review services

**Approfondimento.** L'enunciato del problema. L'SDLC tradizionale **ignora la sicurezza**, quindi le vulnerabilità vengono scoperte **tardi**, durante i test o, peggio, dopo il rilascio, quando costano **molto di più da correggere** (un bug colto nei requisiti costa una frazione di uno colto in produzione, che porta con sé patch d'emergenza, risposta agli incidenti e danni alla reputazione; il punto sul costo delle correzioni tardive della Lezione 1, slide 43). C'è anche una **cattiva allocazione dello sforzo**: quasi tutti comprano la sicurezza della *rete* (firewall, IDS), ma pochi investono nella sicurezza delle *applicazioni* (progettazione sicura, revisione del codice), anche se l'applicazione è proprio l'anello debole verso cui le difese di rete lasciano passare il traffico (Lezione 1, slide 20; il "proteggi l'anello più debole" della Lezione 10). I soldi vanno all'anello forte, non a quello debole.

### Slide 5 · So (la direzione della soluzione)

> - For the software industry, the key to meeting demand for improved security is to implement repeatable processes that reliably deliver measurably improved security
> - Thus, there must be a transition to a more stringent software development process that greatly focuses on security
> - Goal: minimize the number of security vulnerabilities in design, implementation, and documentation - Identify and remove vulnerabilities in the development lifecycle as early as possible!!!

**Approfondimento.** La risposta: fare della sicurezza un **processo ripetibile e misurabile**, non un atto di eroismo. Le tre parole evidenziate contano: **repeatable** (lo stesso processo ogni volta, così i risultati sono coerenti, l'idea del CMM), **reliably** (migliora la sicurezza in modo affidabile) e **measurably** (si può quantificare il miglioramento con delle metriche). L'obiettivo è **ridurre al minimo le vulnerabilità in progettazione, implementazione e documentazione**, e soprattutto **trovarle e correggerle il prima possibile** ("shift left"), perché le correzioni precoci costano poco e quelle tardive molto (slide 4). Questo motiva l'SDL.

### Slide 6 · Building Secure Software

> Three essential components
>
> - Repeatable process
> - Engineer Education
> - Metrics and Accountability
>
> SDL - Secure Development Lifecycle - Used along with traditional/current software development lifecycle/techniques in order to introduce security at every stage of software development

**Approfondimento.** Costruire software sicuro richiede **tre pilastri**: (1) un **processo ripetibile** (fare la sicurezza nello stesso modo affidabile ogni volta); (2) la **formazione degli ingegneri** (gli sviluppatori devono *conoscere* le vulnerabilità e le difese: questo corso, la lezione "fool with a tool" della Lezione 6, secondo cui gli strumenti sono inutili senza persone formate); e (3) **metriche e responsabilità** (misurare la sicurezza e rendere i gruppi responsabili di essa: si migliora ciò che si misura). Lo strumento è il **Secure Development Lifecycle (SDL)**: un insieme di attività di sicurezza **sovrapposte all'SDLC esistente**, che aggiungono la sicurezza a *ogni* fase invece di sostituire il processo di sviluppo. Il resto della lezione descrive nel dettaglio le attività di ogni fase.

## L'SDL fase per fase (pagine 7-16)

### Slide 7-8 · SDL - Requirements Phase

![Lezione 13, pagina 7](L13_p07.webp "50% 1400x71")

> (7) Development of requirements (Gather information about application \\[customer/experience/survey\\]). Analysis of requirements (Are all the security issues addressed \\[C, I, A, …\\]). Verification of requirements (Any inconsistencies? - system interface - correctness; Documentation!!!; Feasibility of requirements). \\[repeat\\]. Planning at this stage offers the best opportunity to build secure software in the most efficient manner \\[cost, time, etc\\].
>
> ![Lezione 13, pagina 8](L13_p08.webp "50% 1400x71")
>
> (8) Develop Security Requirements (Security Requirements of a system/application must be developed along with any other requirements (e.g. functional, legal, user, etc)). Risk analysis (Identify all the assets at risk; Identify all the threats). Develop security policies (Used as guidelines for requirements). Develop security metrics.

**Approfondimento.** La **fase dei requisiti** è quella in cui affrontare la sicurezza costa meno ("best opportunity ... most efficient"), quindi l'SDL la carica di lavoro fin dall'inizio:

- **I requisiti di sicurezza vengono scritti insieme a quelli funzionali, legali e degli utenti**, non dopo. Così come si specifica che cosa il sistema deve *fare*, si specifica che cosa *non* deve permettere (i requisiti negativi della Lezione 1, slide 32), in termini di **C, I, A** (riservatezza, integrità, disponibilità) e altro.
- **Analisi del rischio**: fare l'inventario degli **asset a rischio** e delle **minacce** contro di essi (Lezione 1, slide 49; la modellazione delle minacce della Lezione 12) in modo che i requisiti mirino ai rischi reali.
- Si abbozzano le **politiche di sicurezza** che guidano i requisiti (quali regole di accesso, quale protezione dei dati).
- Le **metriche di sicurezza** si definiscono ora, così più avanti i progressi si possono *misurare* (il "measurably" della slide 5).
- I requisiti vengono poi **analizzati e verificati** (sono coerenti? corretti? realizzabili? documentati?) e iterati ("\\[repeat\\]").

### Slide 9-10 · SDL - Design Phase

![Lezione 13, pagina 9](L13_p09.webp "50% 1400x71")

> (9) At this stage, all design decisions are made, about: Software Architecture; Software components; Programming languages; Interfaces; …. Develop documentation. Confirm that all requirements are followed and met.
>
> ![Lezione 13, pagina 10](L13_p10.webp "50% 1400x71")
>
> (10) Threat Models; Input Data Types; Security Use Cases; Security Architecture. Defense in Layers/Separate Components/Least Privilege. Tool: SecureUML and UMLsec.

**Approfondimento.** La **fase di progettazione** prende le decisioni architetturali (componenti, linguaggi, interfacce) e deve incorporare la sicurezza (Lezione 12). Le attività di sicurezza dell'SDL qui:

- I **modelli delle minacce** (STRIDE, attack tree; Lezione 12) per trovare come si può attaccare ogni componente.
- I **tipi dei dati di input**: definire esattamente quali input ci si aspetta (così si può specificare la validazione, Lezione 5).
- I **casi d'uso di sicurezza** (e gli *abuse case*, Lezione 1, slide 45): descrivere come il sistema viene usato in modo sicuro e come se ne potrebbe abusare.
- Un'**architettura di sicurezza** che applica i principi di progettazione: **difesa in profondità (livelli)**, **compartimentazione (componenti separati)** e **privilegio minimo** (Lezione 10).
- **Strumenti**: **SecureUML** e **UMLsec** sono estensioni di UML (il linguaggio di modellazione standard) che permettono a chi progetta di esprimere e verificare proprietà di sicurezza (regole di controllo degli accessi, requisiti di riservatezza e integrità) direttamente nei diagrammi di progetto, così la sicurezza si può analizzare già in fase di progettazione.

### Slide 11-12 · SDL - Implementation Phase

![Lezione 13, pagina 11](L13_p11.webp "50% 1400x71")

> (11) This is the stage where coding is done. To produce secure software: Coding Standards; Centralized Security Modules; Secure builds and configurations (Known security vulnerabilities - use good programming practices. Be aware of: Race conditions; Buffer overflow; Format string; Malicious logic; …). Follow Design and Develop Documentation \\[further\\].

![Lezione 13, pagina 12](L13_p12_1.webp "50% 1400x71")

![Lezione 13, pagina 12 (2)](L13_p12_2.webp "50% 1326x505")

**Figura (slide 12).** Un diagramma: un riquadro centrale "**Vulnerability-free Application**" con una freccia curva che vi entra da ciascun lato, una con l'etichetta "**Design and implementation of security features** - From the Requirements", l'altra "**Robust Programming Practices** - Good design and coding practices".

**Approfondimento.** La **fase di implementazione** è la scrittura del codice, in cui l'SDL impone la programmazione sicura:

- **Standard di codifica** (regole di programmazione sicura: SEI CERT C/C++/Java; Lezione 3, slide 45) per evitare in modo coerente i costrutti pericolosi.
- **Moduli di sicurezza centralizzati**: implementare la sicurezza trasversale (validazione dell'input, autenticazione, controllo degli accessi, crittografia) in **moduli condivisi e ben revisionati** invece di spargerla, l'idea della compartimentazione / della "TCB piccola" (Lezione 10, slide 27; i punti di passaggio obbligati della Lezione 5).
- **Build e configurazioni sicure** e, soprattutto, la **consapevolezza delle classi di vulnerabilità note che questo corso ha insegnato**: la slide elenca esplicitamente le **race condition** (Lezione 11), il **buffer overflow** (Lezione 3), le **format string** (Lezione 4) e la **logica malevola** (backdoor e trojan, il Trusting Trust della Lezione 2). È il pilastro della "conoscenza" applicato alla tastiera.
- **Il messaggio della figura**: un'applicazione "senza vulnerabilità" nasce da **due fonti che lavorano insieme**, le *funzioni di sicurezza progettate a partire dai requisiti* (fare le cose di sicurezza giuste) **e** le *pratiche di programmazione robuste* (fare ogni cosa in modo sicuro), cioè *software sicuro > software di sicurezza* (Lezione 2, slide 24): servono sia le funzioni di sicurezza sia un'implementazione sicura di tutto. ("Senza vulnerabilità" è un'aspirazione: la fase di risposta e la Lezione 2, slide 17, ricordano che non è mai del tutto raggiungibile.)

### Slide 13 · SDL - Verification Phase

![Lezione 13, pagina 13](L13_p13.webp "50% 1400x71")

> Testing of the code developed in the previous stage. Cleared security tests. Security vulnerability tracking. Code Reviews. Documentation.

**Approfondimento.** La **fase di verifica** controlla che il codice sia davvero sicuro, applicando le tecniche di rilevamento della Lezione 6: **test di sicurezza** (test funzionali di sicurezza più fuzzing, Lezione 6), **tracciamento** delle vulnerabilità scoperte fino alla loro chiusura (un bug tracker per i problemi di sicurezza, così nessuno viene dimenticato), **revisioni del codice** (manuali e con analisi statica assistita da strumenti, Lezione 6), e documentazione dei risultati. È qui che si misurano le metriche di sicurezza definite prima.

### Slide 14-15 · SDL - Release and Response Phases

![Lezione 13, pagina 14](L13_p14.webp "50% 1400x71")

> (14, Release/Deployment) Secure Management Procedures; Monitoring Requirements; Security Upgrade Procedures.
>
> ![Lezione 13, pagina 15](L13_p15.webp "50% 1400x71")
>
> (15, Response/Maintenance) Causes: Customer feedback; Security incident details and vulnerability reports; …. Types of maintenance: Need to introduce new functionality; Need to upgrade to keep up with technology; Discovered vulnerability.

**Approfondimento.** La sicurezza non finisce con il rilascio:

- Il **rilascio** deve uscire con **procedure di gestione sicura** (come farlo funzionare in modo sicuro), **monitoraggio** (logging e allarmi per rilevare gli attacchi, gli strumenti operativi della Lezione 6, slide 34; l'auditing della Lezione 1) e **procedure di aggiornamento di sicurezza** (un meccanismo funzionante per distribuire le patch: si ricordino le vittime di Slammer senza patch della Lezione 1).
- La **risposta / manutenzione** gestisce l'inevitabile lavoro di sicurezza dopo il rilascio, innescato dai **riscontri dei clienti, dagli incidenti di sicurezza e dalle segnalazioni di vulnerabilità**. La manutenzione ha tre motori: aggiungere funzionalità, stare al passo con la tecnologia e, in modo critico, **correggere le vulnerabilità scoperte** (le patch). È la realtà del principio "assume breach": anche un buon SDL non produce software perfetto (slide 25), quindi bisogna essere pronti a rispondere.

### Slide 16 · Facts

> Every security vulnerability / flaw overlooked in an earlier phase will show-up at later phase\\[s\\]. Resulting into greater: Cost; Time; of the software development and/or maintenance

**Approfondimento.** Il fatto economico centrale dell'SDL, detto chiaramente: **un difetto di sicurezza sfuggito in una fase iniziale non sparisce, ricompare più avanti, quando è più costoso e più lungo da correggere** (requisiti → progettazione → codice → test → produzione, con un costo che cresce a ogni passo, slide 4). È la giustificazione quantitativa dello "shift left": il senso di aggiungere attività di sicurezza a *ogni* fase è cogliere ogni difetto nel punto più precoce (più economico) possibile, invece di pagare il prezzo molto più alto di correggerlo dopo il rilascio.

## Caso di studio: l'SDL di Microsoft (pagine 17-28)

### Slide 17 · Microsoft Trustworthy Computing SDLC

> - Generally accepted SDL process at MS
> - (actually spiral not "waterfall" as it indicates)

![Lezione 13, pagina 17](L13_p17.webp "50% 1400x360")

**Figura.** L'SDL di Microsoft sovrapposto al ciclo di vita: le sei frecce delle fasi (Requirements → Design → Implementation → Verification → Release → Support & Servicing) con una fascia colorata sopra che mostra i prodotti e le attività di ogni fase. Requirements: *Feature Lists, Quality Guidelines, Architecture Docs, Schedules*; Design: *Functional Specifications, Design Specifications*; Implementation: *Development of New Code*; Verification: *Testing and Verification, Bug fixes*; Release: *Code Signing & signoff*, poi *Release*; Support & Servicing: *Product Support, Service Packs/QFEs, Security Updates*.

**Approfondimento.** L'**SDL** di Microsoft nacque dall'iniziativa **Trustworthy Computing** di Bill Gates del 2002 (Lezione 1, slide 44), dopo che i worm del 2001-2003 (Code Red, Nimda, Blaster) avevano fatto della sicurezza di Windows una crisi aziendale. È l'SDL reale più influente e il riferimento del settore. L'avvertenza della slide, "actually spiral, not waterfall", conta: anche se è disegnato come una catena lineare per chiarezza, lo sviluppo reale **itera** (a spirale o agile), quindi le attività dell'SDL si ripetono a ogni ciclo invece di avvenire una volta sola. (QFE = Quick Fix Engineering, il termine di Microsoft per gli hotfix.)

### Slide 18 · Microsoft Case Study: SD³ + C

> - **Secure by Design** - Software designed and implemented to "protect" itself and its information
> - **Secure by Default** - Accept the fact that software will not achieve perfect security - To minimize the harm when vulnerabilities exploited, software's default state should promote security (e.g. least necessary privileges)
> - **Secure in Deployment** - Software accompanied by tools and guidance to assist secure use
> - **Communications** - Developers should be prepared for discovery of product vulnerabilities and should communicate openly and responsibly with end users. (e.g. patching, deploying workarounds)

**Approfondimento.** **SD³+C** è il riassunto facile da ricordare della strategia di sicurezza di Microsoft, tre "Secure by D..." più le comunicazioni:

- **Secure by Design**: costruire il software in modo che protegga se stesso e i suoi dati fin dall'inizio, applicando i principi di progettazione (Lezione 12). Prevenzione.
- **Secure by Default**: *accettare che la sicurezza perfetta sia impossibile* (Lezione 2, slide 17), quindi consegnare il prodotto con la **configurazione predefinita più sicura**: privilegio minimo, funzioni inutilizzate spente, protezioni attive (Lezione 10, slide 31). Questo limita i danni quando (non se) una vulnerabilità viene sfruttata, e fu un grande cambiamento pratico: Windows Server 2003 uscì con molti servizi spenti per impostazione predefinita, a differenza dei suoi predecessori.
- **Secure in Deployment**: dare ai clienti gli **strumenti e le indicazioni** per farlo funzionare in modo sicuro (guide di irrobustimento, strumenti di configurazione, gestione delle patch).
- **Communications**: essere **pronti a rispondere** alle vulnerabilità scoperte e comunicare **in modo aperto e responsabile** con gli utenti: patch tempestive, avvisi, soluzioni temporanee. Questo istituzionalizza la divulgazione responsabile e la fase di risposta (slide 15).

SD³+C riporta con eleganza i principi del corso (prevenzione per progetto, impostazioni predefinite sicure, privilegio minimo, difesa in profondità, più una risposta onesta agli incidenti) in una strategia aziendale.

### Slide 19 · SDL @ Microsoft (le attività di ogni fase)

> The six phases (Requirements → Design → Implementation → Verification → Release → Response) with their security activities.

![Lezione 13, pagina 19](L13_p19.webp "50% 1400x778")

**Figura.** Ogni fase è annotata con le sue attività SDL concrete:

| Fase | Attività di sicurezza |
| --- | --- |
| Requirements ("Inception") | Si assegna un Security Advisor; ci si assicura che le tappe di sicurezza siano comprese; si identificano i requisiti di sicurezza |
| Design | Design & Threat Modeling: linee guida di progettazione documentate; modelli delle minacce prodotti; architettura di sicurezza documentata; revisione dei modelli delle minacce e del progetto completata |
| Implementation | Guidelines & Best Practices: standard di codifica e di test; piani di test sviluppati ed eseguiti; strumenti usati |
| Verification | Security Push: modelli delle minacce rivisti; codice rivisto; test di attacco; nuove minacce valutate; test di sicurezza completati |
| Release | Final Security Review: modelli delle minacce rivisti; bug non corretti rivisti; nuovi bug rivisti; penetration test completato; documentazione completata |
| Response | Security Response Feedback: strumenti e processi valutati; postmortem completati |

**Approfondimento.** È la realizzazione concreta dell'SDL generico (slide 7-16) in Microsoft, da ricordare come esempio autorevole. Ogni fase ha attività di sicurezza obbligatorie e verificabili: un **security advisor ("security buddy")** che guida il gruppo fin dall'inizio; **modellazione delle minacce e revisione del progetto** in progettazione; **standard di codifica, strumenti e piani di test** nell'implementazione; un **"Security Push"** dedicato (uno sforzo intensivo di revisione e test) nella verifica; il cancello della **Final Security Review (FSR)** prima del rilascio (slide 24); e **postmortem e miglioramento del processo** nella risposta. Il punto: la sicurezza non è un singolo punto di controllo ma un filo continuo, con prodotti e revisioni specifici in ogni fase.

### Slide 20-25 · SDL @ Microsoft, i dettagli di ogni fase

![Lezione 13, pagina 20](L13_p20.webp "50% 1400x71")

> (20, Requirements) Product and central security teams assign "security buddy" - security advisor (Point of contact / resources / guide; Review plans / recommendations / resources). Product team considers (How security will be integrated into the development process; Key security objectives). Documentation.
>
> ![Lezione 13, pagina 21](L13_p21.webp "50% 1400x71")
>
> (21, Design) Define security architecture and design guidelines (identify TCB, use layering). Document the elements of the software attack surface. Conduct threat modeling. Define supplemental ship criteria.
>
> ![Lezione 13, pagina 22](L13_p22.webp "50% 1400x71")
>
> (22, Implementation) Apply coding and testing standards. Apply security testing tools, including fuzzing tools (Supplies structured but invalid inputs). Apply static-analysis code scanning tools. Conduct code reviews.
>
> ![Lezione 13, pagina 23](L13_p23.webp "50% 1400x71")
>
> (23, Verification) "Beta" testing stage. "Security push" (security code reviews beyond those completed in implementation phase (e.g. legacy code not modified); Testing of high priority code; Trying to "break" the code).
>
> ![Lezione 13, pagina 24](L13_p24.webp "50% 1400x71")
>
> (24, Release) During the release, software is subject to Final Security Review \\[FSR\\]. The goal of FSR is to determine whether, from security viewpoint, the software is ready to be delivered to customers. Not pass / fail. Goal is to find every remaining security vulnerability in software (If found, revisit all the preceding phases and fix the root problem). Conducted by central security team.
>
> ![Lezione 13, pagina 25](L13_p25.webp "50% 1400x71")
>
> (25, Response) Despite use of SDL, resulting software is not vulnerability free; and even if it could be so, new attacks would be possible. Evaluation of reports. Development of patches and security updates.

**Approfondimento.** Il dettaglio di ogni fase, ciascuno legato a tecniche delle lezioni precedenti:

- **Requisiti**: si assegna un **security advisor** che guidi il gruppo, e gli obiettivi di sicurezza e la loro integrazione vengono pianificati fin dall'inizio (slide 7).
- **Progettazione**: definire l'**architettura di sicurezza**, **identificare** esplicitamente **la TCB** e **usare i livelli** (Lezione 10, slide 27 e 51), **documentare la superficie d'attacco** (così la si può ridurre al minimo, Lezione 10, slide 28), e **fare la modellazione delle minacce** (Lezione 12). I "supplemental ship criteria" sono requisiti di sicurezza in più che il prodotto deve rispettare per uscire.
- **Implementazione**: standard di codifica e di test, **fuzzing** ("structured but invalid inputs", Lezione 6, slide 25), **scanner di analisi statica** (Lezione 6, slide 15) e **revisioni del codice**, esattamente la cassetta degli attrezzi di rilevamento della Lezione 6.
- **Verifica**: il **Security Push**, un giro intensivo in più di revisione del codice (compreso il *codice legacy non modificato*, spesso il più pericoloso perché precede le pratiche sicure), di test del codice ad alta priorità, e di tentativi attivi di **rompere il codice** (la mentalità dell'attaccante, il penetration testing).
- **Rilascio**: la **Final Security Review (FSR)** è il cancello di sicurezza, una valutazione di un gruppo centrale su se il prodotto è abbastanza sicuro per uscire. Soprattutto **non è un semplice promosso/bocciato**: l'obiettivo è **trovare ogni vulnerabilità rimasta**, e se ne emergono di gravi il gruppo deve **tornare indietro e correggere la causa di fondo** nella fase appropriata (non solo mettere una pezza al sintomo). Questo impone la responsabilità.
- **Risposta**: riconoscendo che **il software non è mai privo di vulnerabilità** (e continuano a emergere nuove tecniche d'attacco, Lezione 2, slide 17), il gruppo valuta le segnalazioni di vulnerabilità in arrivo e rilascia **patch e aggiornamenti di sicurezza** (la realtà della manutenzione della slide 15).

### Slide 26 · SDL @ Microsoft (dopo l'aggiunta di SD³+C)

> After adding the SD³+ C paradigm

![Lezione 13, pagina 26](L13_p26.webp "50% 1400x424")

**Figura.** La stessa catena a sei fasi, ora con le attività SD³+C sovrapposte in una fascia più ricca. Requirements: *Security Kickoff & Register with SWI*; una barra **Security Training** che copre le fasi iniziali, *Security Design Best Practices, Security Architecture & Attack Surface Review, Threat Modeling*; Implementation: *Use Security Development Tools & Security Best Dev & Test Practices*; *Create Security Documentation and Tools For Product*; Verification: *Prepare Security Response Plan, Security Push, Pen Testing*; Release: *Final Security Review*; Support & Servicing: *Security Servicing & Response Execution*.

**Approfondimento.** Questo diagramma mostra l'**SDL maturo di Microsoft** con tutte le attività SD³+C inserite lungo il ciclo di vita. Si notino le aggiunte rispetto all'SDL di base: un **Security Kickoff** e la registrazione presso il gruppo della Secure Windows Initiative (SWI); una **formazione sulla sicurezza** obbligatoria che copre le fasi iniziali (il pilastro della "formazione degli ingegneri", slide 6); un'esplicita **Attack Surface Review** e la **modellazione delle minacce** in progettazione; il **penetration testing** e un **Security Response Plan** nella verifica; e il **security servicing** nel supporto. È l'SDL completo e reso operativo, il modello che la maggior parte del settore ha poi adottato (e l'antenato del DevSecOps di oggi).

### Slide 27 · SDL @ Microsoft (che cosa lo fa funzionare)

> - Mandatory Application of the SDL
> - Mandatory Education
> - Metrics for Product Teams
> - The Central Security Team

**Approfondimento.** I quattro fattori organizzativi che hanno fatto davvero funzionare l'SDL di Microsoft (si ricordino i consigli sul "cambiamento di cultura" e sul "referente" della Lezione 6, slide 39):

- **Applicazione obbligatoria**: l'SDL è **richiesto**, non facoltativo, ogni gruppo di prodotto deve seguirlo (un processo è ripetibile solo se viene imposto).
- **Formazione obbligatoria**: formazione sulla sicurezza **richiesta** per gli ingegneri (il pilastro della formazione).
- **Metriche per i gruppi di prodotto**: la sicurezza viene **misurata**, quindi i gruppi ne rispondono e il miglioramento è visibile (il pilastro di metriche e responsabilità, slide 6).
- **Un gruppo di sicurezza centrale**: un gruppo di esperti dedicato che possiede il processo, consiglia i gruppi (i security buddy), conduce la Final Security Review e guida il miglioramento continuo.

Insieme trasformano la sicurezza da buone intenzioni in una pratica organizzativa imposta, misurata e sostenuta: la differenza fra un SDL che funziona e un documento di politica che viene ignorato.

### Slide 28 · Results

![Lezione 13, pagina 28](L13_p28.webp "50% 1400x856")

**Figura.** Un grafico a barre impilate, "Figure 3. First Year Security Bulletins: Windows 2000 vs. Windows Server 2003", che confronta il numero di bollettini di sicurezza del primo anno dopo il rilascio di ciascun prodotto, per gravità:

| Gravità | Windows 2000 (prima dell'SDL) | Windows Server 2003 (dopo l'SDL) |
| --- | --- | --- |
| Critical | 10 | 6 |
| Important | 32 | 6 |
| Moderate | 16 | 8 |
| Low | 7 | 2 |
| **Totale** | **65** | **22** |

**Approfondimento.** Il **guadagno misurato dell'SDL**, i dati che hanno giustificato l'intero programma. Windows 2000 (sviluppato *prima* dell'SDL) ebbe **65 bollettini di sicurezza** nel primo anno; Windows Server 2003 (il primo sistema operativo sviluppato *con* l'SDL e SD³+C) ne ebbe solo **22**, una **riduzione di circa il 66%**, con un forte calo delle categorie più gravi (Important da 32 a 6, Critical da 10 a 6). È la promessa della slide 5, una sicurezza migliorata in modo **misurabile**, resa concreta: un processo sicuro e ripetibile ha prodotto un calo grande e quantificabile delle vulnerabilità reali. È l'argomento empirico che **costruire la sicurezza dentro tutto il ciclo di vita funziona**, la conclusione della lezione e del corso: le vulnerabilità studiate nelle Lezioni 3-11 si sconfiggono meglio non un bug alla volta ma con la progettazione sicura (Lezione 12) e il processo sicuro (questa lezione), che impediscono a intere classi di esse di essere scritte.
`;export{e as default};
