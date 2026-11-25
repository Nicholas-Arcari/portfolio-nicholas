La Lezione 15 presenta l'approccio di Gary McGraw alla sicurezza del software, dal suo libro *Software Security: Building Security In* (2006), da cui la lezione prende il titolo: perché il software è alla radice della maggior parte dei problemi di sicurezza (i numeri del CERT/CC e la "trinity of trouble": connettività, estensibilità, complessità), la differenza fra bug e flaw, e i **tre pilastri** della sicurezza del software: la **gestione applicata del rischio** (il **Risk Management Framework** in cinque fasi), i sette **touchpoint della sicurezza del software** (code review, analisi del rischio architetturale, penetration testing, test di sicurezza basati sul rischio, abuse case, requisiti di sicurezza, security operations) e la **conoscenza**. La seconda metà descrive nel dettaglio i touchpoint principali: la code review con gli strumenti di analisi statica e la tassonomia degli errori di codifica, l'analisi del rischio architetturale (analisi della resistenza agli attacchi, delle ambiguità e delle debolezze), il penetration testing, i test di sicurezza basati sul rischio e gli abuse case. Le slide sono 44.

## La sicurezza del software e i suoi problemi (pagine 1-6)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Building Security IN

### Slide 2 · Software Security

> - Renewed interest
>   - "idea of engineering software so that it continues to function correctly under malicious attack"
>   - Existing software is riddled with design flaws and implementation bugs
>   - "any program, no matter how innocuous it seems, can harbor security holes"

**Approfondimento.** Le due citazioni sono di Gary McGraw (la prima è la definizione di lavoro già incontrata nella Lezione 1, slide 5): la **sicurezza del software** significa costruire software che continua a funzionare correttamente *mentre è sotto attacco*, il che è più che funzionare correttamente nell'uso normale. Il "rinnovato interesse" arrivò nei primi anni 2000, quando i worm e lo sfruttamento di massa (Code Red, Slammer, Blaster; Lezione 1) mostrarono che le difese di rete non possono compensare un software vulnerabile. Gli altri due punti spiegano perché il problema è ovunque: il software esistente contiene sia **difetti di progettazione** (flaw) sia **bug di implementazione** (la distinzione della slide 6), e *qualunque* programma, anche uno all'apparenza innocuo, può contenere un buco che un attaccante può usare, per esempio come trampolino verso bersagli di maggior valore.

### Slide 3 · Software Problem

> \# vulnerabilities Reported by CERT/CC
>
> - More than half of the vulnerabilities are due to buffer overruns
> - Others such as race conditions, design flaws are equally prevalent

![Lezione 15, pagina 3](L15_p03.webp "50% 974x623")

**Figura.** Un grafico a barre, "**Software Vulnerabilities**", con il numero di vulnerabilità segnalate al CERT/CC per anno (asse verticale da 0 a 4500), dal **1995** al **2004**: meno di 500 all'anno fino al 1999, poi una forte crescita a circa 1.100 nel 2000 e circa 2.400 nel 2001, un picco di circa 4.100 nel 2002, e circa 3.800 sia nel 2003 sia nel 2004. La didascalia rossa accanto al grafico dice "# vulnerabilities Reported by CERT/CC".

**Approfondimento.** Il **CERT/CC** (il CERT Coordination Center della Carnegie Mellon University, nato dopo il worm di Morris del 1988) raccoglieva le segnalazioni di vulnerabilità da produttori e ricercatori. Il grafico mostra il numero di vulnerabilità del software segnalate che cresce di circa dieci volte in pochi anni, man mano che più software veniva collegato in rete e più persone cercavano difetti; oggi il sistema CVE pubblica decine di migliaia di vulnerabilità ogni anno. I punti danno la composizione dell'epoca: i **buffer overrun** erano la classe singola più grande (Lezioni 3 e 8), e altre classi, come le race condition (Lezione 11) e i difetti di progettazione, erano altrettanto diffuse. La lezione non è la percentuale esatta ma il fatto che poche classi ricorrenti di errori producono la maggior parte delle vulnerabilità, quindi impararle ripaga.

### Slide 4 · Software Security

> - It is about
>   - Understanding software-induced security risks and how to manage them
>   - Leveraging software engineering practice,
>   - thinking security early in the software lifecycle
>   - Knowing and understanding common problems
>   - Designing for security
>   - Subjecting all software artifacts to thorough objective risk analyses and testing
> - It is a knowledge intensive field

**Approfondimento.** Che cosa comporta la sicurezza del software, nei termini di McGraw: (1) capire i **rischi** che il software introduce e **gestirli** (pilastro I, slide 16-22); (2) usare le normali **pratiche di ingegneria del software** e pensare alla sicurezza **presto** nel ciclo di vita, non alla fine (lo shift left della Lezione 1, slide 43, e della Lezione 13); (3) **conoscere i problemi comuni** (buffer overflow, injection, race: gran parte di questo corso; pilastro III, slide 14); (4) **progettare per la sicurezza** (Lezioni 10 e 12); e (5) sottoporre **ogni prodotto del lavoro**, non solo il codice ma anche requisiti, progetti e piani di test, a un'**analisi del rischio e a test** oggettivi (i touchpoint, slide 9-11). L'ultimo punto riassume: è un campo **ad alta intensità di conoscenza**, in cui ciò che si sa di attacchi e difese conta più di qualunque singolo strumento.

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

![Lezione 15, pagina 5](L15_p05.webp "49% 875x640")

**Figura.** Un grafico a linee, "**Windows Complexity**", con le dimensioni delle versioni successive di Windows in **milioni di righe** di codice: circa 3 per Win 3.1 (1990), circa 4 per Win NT (1996), circa 15 per Win 95 (1997), circa 16 per NT 4.0 (1998), circa 18 per Win 98 (1999), circa 20 per NT 5.0/2K beta (2000), circa 35 per Win 2K (2001) e circa 40 per XP (2001).

**Approfondimento.** La **trinity of trouble** di McGraw, le tre tendenze che rendono la sicurezza del software più difficile ogni anno:

- **Connettività**: quasi ogni sistema è in rete, quindi un difetto si può raggiungere da remoto e sfruttare con attacchi automatici su larga scala (worm, **botnet**). Oggi questo comprende i sistemi **SCADA**, i sistemi di controllo industriale di reti elettriche, impianti idrici e fabbriche, progettati per reti isolate e ora raggiungibili da Internet (Stuxnet, Lezione 1).
- **Estensibilità**: i sistemi sono progettati per essere estesi dopo la messa in esercizio, con plug-in, estensioni dei browser, script, aggiornamenti e **mobile code** (codice scaricato ed eseguito al volo, come JavaScript o le applet Java dell'epoca), quindi le funzionalità, e con esse la superficie d'attacco, continuano a cambiare in modi che i progettisti originali non hanno mai analizzato.
- **Complessità**: più codice significa più bug. Il grafico mostra Windows che cresce da circa 3 a circa 40 milioni di righe in un decennio; con un numero di difetti per migliaio di righe più o meno costante, il numero di vulnerabilità cresce con le dimensioni, e i **linguaggi non sicuri** come C e C++ (nessun controllo dei limiti, gestione manuale della memoria; Lezioni 3 e 8) rendono sfruttabili molti di questi difetti.

"Bigger problem today .. And growing": da allora le tre tendenze hanno solo accelerato (cloud, IoT, catene di fornitura del software con migliaia di dipendenze).

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

![Lezione 15, pagina 6](L15_p06_1.webp "50% 913x544")

![Lezione 15, pagina 6 (2)](L15_p06_2.webp "50% 1024x535")

**Figura.** Due immagini sulla destra della slide. Sopra, un grafico a barre, "**Security Problems (CERT)**", dal **1988** al **1999**, con barre scure per i **CERT alerts** e barre chiare per i **Buffer overflows**: gli avvisi passano da 1-7 all'anno nel 1988-1990 a circa 11-28 all'anno in seguito (picchi di circa 27-28 nel 1996-1997), e i buffer overflow crescono fino a circa metà degli avvisi nel 1997-1999 (circa 15 su 28 nel 1997). Sotto, una tabella a due colonne di esempi:

- **Bug**: Buffer overflow: stack smashing; Buffer overflow: one-stage attacks; Buffer overflow: string format attacks; Race conditions: TOCTOU; Unsafe environment variables; Unsafe system calls (`fork()`, `exec()`, `system()`); Incorrect input validation (black list vs. white list).
- **Flaw**: Method over-riding problems (subclass issues); Compartmentalization problems in design; Privileged block protection failure (`DoPrivilege()`); Error-handling problems (fails open); Type safety confusion error; Insecure audit log design; Broken or illogical access control (role-based access control [RBAC] over tiers); Signing too much code.

**Approfondimento.** Il vocabolario della lezione (quello di McGraw, coerente con la Lezione 1, slide 37-38):

- Un **difetto** (defect) è qualunque problema del software, al livello dell'implementazione o della progettazione; può restare **dormiente** per anni, finché qualcuno non trova un modo per attivarlo e sfruttarlo.
- Un **bug** è un difetto **al livello dell'implementazione**: un errore in poche righe di codice, come un controllo dei limiti mancante (buffer overflow), l'input dell'utente usato come format string, una race TOCTOU. I bug sono relativamente facili da trovare con la code review e gli strumenti di analisi statica (slide 25-31).
- Un **flaw** è un difetto **a un livello più profondo**, nella progettazione: c'è anche se ogni riga è scritta in modo perfetto, per esempio una compartimentazione mancante, un controllo degli accessi imposto sul livello sbagliato, una gestione degli errori che fallisce aperta (Lezione 10, slide 32), un log di audit che un attaccante può manomettere. I flaw non si trovano guardando il codice; richiedono l'analisi del rischio architetturale (slide 32-37).
- **Bug e flaw insieme** producono **rischio**, che è ciò che va gestito (slide 16-22).

La tabella dà esempi tipici di ciascuna classe; McGraw stima che bug e flaw siano circa **50/50** (Lezione 1, slide 38; Lezione 2, slide 19). Il grafico ripete il messaggio della slide 3: negli avvisi del CERT della fine degli anni '90, i soli buffer overflow ne erano circa la metà.

## I tre pilastri della sicurezza del software (pagine 7-15)

### Slide 7 · Three pillars in Software Security

> Pillar I: Applied Risk management
>
> Pillar II: Software Security Touchpoints
>
> Pillar III: Knowledge

**Approfondimento.** Il framework di McGraw poggia su tre **pilastri**, che devono esserci tutti:

1. **Gestione applicata del rischio** (slide 8 e 16-22): il lavoro di sicurezza è guidato dai rischi che contano per il business, identificati e seguiti per tutto il progetto.
2. **Touchpoint della sicurezza del software** (slide 9-13 e 23-44): un piccolo insieme di buone pratiche applicate ai prodotti del lavoro che ogni processo di sviluppo produce.
3. **Conoscenza** (slide 14-15): l'esperienza catalogata (principi, regole, vulnerabilità, attack pattern, ...) di cui hanno bisogno le persone che applicano i touchpoint.

La gestione del rischio decide *dove* spendere lo sforzo, i touchpoint sono *che cosa* fare, e la conoscenza è ciò che rende efficaci le persone che lo fanno.

### Slide 8 · Three pillars in Software Security

> Pillar I: Applied Risk management
>
> - Architectural risk analysis
>   - Sometimes called threat modeling or security design analysis
>   - Is a best practice and is a touchpoint
> - Risk management framework
>   - Considers risk analysis and mitigation as a full life cycle activity

**Approfondimento.** La gestione del rischio lavora a due scale. L'**analisi del rischio architetturale** è una singola attività applicata al progetto (la modellazione delle minacce della Lezione 12, slide 10-13), ed è anche uno dei touchpoint (slide 32-37). Il **Risk Management Framework (RMF)** è il processo complessivo in cui avviene ogni analisi del rischio: i rischi vengono identificati, ordinati, mitigati e seguiti **per tutto il ciclo di vita**, non analizzati una volta e dimenticati (slide 16-22).

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

**Approfondimento.** Due idee:

- **"Software security is not security software"**: aggiungere funzioni di sicurezza (crittografia, autenticazione, un firewall) non rende sicuro un programma (Lezione 2, slide 24). La sicurezza è una questione che riguarda **tutto il sistema**, che coinvolge sia i *meccanismi* di sicurezza sia la *progettazione* di tutto il resto, ed è una **proprietà emergente**: come l'affidabilità, è una proprietà dell'intero sistema, che nasce da come tutte le sue parti sono costruite e interagiscono, e non si può avvitare su un singolo componente. Un programma pieno di funzioni di sicurezza si può ancora violare attraverso un buffer overflow nel suo codice di logging.
- **I touchpoint**, nell'ordine di efficacia di McGraw: **code review** (trova i bug) e **analisi del rischio architetturale** (trova i flaw) vengono prima, e poiché bug e flaw sono più o meno ugualmente comuni, si può cominciare con l'una o con l'altra; poi **penetration testing**, **test di sicurezza basati sul rischio**, **abuse case**, **requisiti di sicurezza** e **security operations**. Ognuno è sviluppato nel resto della lezione; sono stati introdotti nella Lezione 1, slide 45.

### Slide 10 · Three pillars in Software Security

> Pillar II: (contd.)
>
> - Many organization
>   - Penetration first
>     - a reactive approach
> - CR and ARA can be switched; skipping one solves only half of the problem
> - Big organization may adopt these touchpoints simultaneously

**Approfondimento.** Molte organizzazioni cominciano dal **penetration testing**, perché è facile da comprare e dà risultati rapidi e concreti; ma è **reattivo**: trova i problemi alla fine, quando sono costosi da correggere (slide 24), e solo un campione di essi (slide 38). **Code review (CR)** e **analisi del rischio architetturale (ARA)** sono il nucleo: poiché bug e flaw sono ciascuno circa metà dei problemi, farne solo una **lascia intatta metà del problema**. Le grandi organizzazioni con abbastanza persone possono adottare tutti i touchpoint insieme; quelle più piccole dovrebbero introdurli in ordine di efficacia.

### Slide 11 · Three pillars in Software Security

> Software security best practices applied to various software artifacts

![Lezione 15, pagina 11](L15_p11.webp "50% 1340x760")

**Figura.** Il diagramma dei touchpoint (lo stesso della Lezione 1, slide 45, e della slide 23 più sotto, senza i numeri). Sei riquadri 3-D in fila sono i prodotti del software: **REQUIREMENTS AND USE CASES**, **ARCHITECTURE AND DESIGN**, **TEST PLANS**, **CODE**, **TESTS AND TEST RESULTS**, **FEEDBACK FROM THE FIELD**. Frecce nere dalle etichette in alto vi applicano le buone pratiche: **ABUSE CASES** e **SECURITY REQUIREMENTS** ai requisiti e agli use case; **RISK ANALYSIS** (due frecce) ai requisiti e all'architettura e progetto, con **EXTERNAL REVIEW** scritto sopra l'architettura e progetto; **RISK-BASED SECURITY TESTS** ai piani di test; **CODE REVIEW (TOOLS)** al codice; di nuovo **RISK ANALYSIS** ai test e ai loro risultati; **PENETRATION TESTING** (due frecce) ai test e ai loro risultati e al feedback dal campo; **SECURITY OPERATIONS** al feedback dal campo. Una grande freccia circolare grigia gira attorno a tutta la fila.

**Approfondimento.** La scelta di progetto chiave dei touchpoint: sono agganciati ai **prodotti del lavoro**, non alle fasi di un processo particolare. Ogni processo di sviluppo, a cascata, a spirale o agile, produce requisiti, un progetto, piani di test, codice, risultati dei test e feedback dall'esercizio, quindi i touchpoint si possono adottare senza cambiare il processo (slide 13). La freccia circolare significa che i prodotti del lavoro vengono rivisti in modo iterativo: il feedback dal campo alimenta nuovi requisiti.

### Slide 12 · Three pillars in Software Security

> Microsoft's Move

![Lezione 15, pagina 12](L15_p12.webp "50% 1369x973")

**Figura.** Due immagini collegate da una freccia verso il basso. **Sopra**, la linea temporale dello sviluppo di un prodotto, **Concept → Designs Complete → Test Plans Complete → Code Complete → Ship → Post Ship**, con le attività di sicurezza agganciate: "Secure questions during interviews" e "Team member training" nella fase di concept; "Threat analysis" prima che i progetti siano completi; "Security review" a progetti completi; "Data mutation and least priv tests" a piani di test completi; "External review" dopo di esso; "Review old defects, Check-ins checked, Secure coding guidelines, Use tools" durante la codifica; "Security push/audit" fra il codice completo e il rilascio; "Learn and refine" dopo il rilascio. Un simbolo a freccia circolare segna le attività "on-going" (tutte tranne la security review, i data mutation test e l'external review). **Sotto**, la barra dell'SDL di Microsoft della Lezione 13, slide 26: **Security Training** sulle prime fasi; Security Kickoff & Register with SWI; Security Design Best Practices; Security Architecture & Attack Surface Review; Threat Modeling; Use Security Development Tools & Security Best Dev & Test Practices; Create Security Documentation & Tools for Product; Prepare Security Response Plan; Security Push; Pen Testing; Final Security Review; Security Servicing & Response Execution; sulle fasi Requirements, Design, Implementation, Verification, Release, Support & Servicing.

**Approfondimento.** I touchpoint non sono solo teoria: la slide mostra come Microsoft ha portato la sicurezza nel proprio processo di sviluppo (l'SDL della Lezione 13, slide 17-28). L'immagine in alto è la versione iniziale, con le attività di sicurezza agganciate alle tappe del processo esistente (analisi delle minacce durante la progettazione, revisioni e linee guida di programmazione sicura durante la codifica, il security push prima del rilascio, l'apprendimento dopo il rilascio); quella in basso è l'SDL maturo con SD³+C. Molte attività dell'SDL corrispondono a dei touchpoint: modellazione delle minacce e revisione della superficie d'attacco sono analisi del rischio architetturale, gli strumenti di sviluppo sicuro sono la code review con strumenti, il pen testing è il penetration testing, la final security review è una external review, e il security servicing sono le security operations.

### Slide 13 · Three pillars in Software Security

> Pillar II: (contd.)

![Lezione 15, pagina 13](L15_p13.webp "50% 1389x881")

**Figura.** Uno striscione rosso, "**Apply Security Touchpoints (Process-Agnostic)**", con cinque frecce che puntano in basso dentro un ciclo di quattro grandi frecce gialle con le etichette **iCMM**, **CMMI**, **XP** e **RUP** (un'etichetta "**Process models**" indica il ciclo). Dentro il ciclo, un disco rosso, "**Software Security**", si ramifica in due riquadri blu, "**System-wide Issue**" ed "**Emergent Property**"; sotto di essi: "*account for* **Security Mechanisms**, **Design for Security**".

**Approfondimento.** I touchpoint sono **indipendenti dal processo**: si possono applicare sopra qualunque modello di processo, che sia un modello di maturità come CMMI o iCMM (Lezione 14), un metodo agile come **XP** (Extreme Programming) o il **RUP** (Rational Unified Process, un processo iterativo guidato dagli use case). Qualunque sia il processo, la sicurezza del software resta ciò che diceva la slide 9, una questione di tutto il sistema e una proprietà emergente, e deve tenere conto sia dei **meccanismi di sicurezza** sia della **progettazione per la sicurezza** dell'intero sistema.

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

**Figura.** Le ultime quattro righe stanno in un riquadro ombreggiato di rosso sulla destra della slide, con due frecce che puntano dal riquadro all'elenco dei cataloghi.

**Approfondimento.** La conoscenza di sicurezza va **raccolta** (dall'esperienza, dagli attacchi, dalla ricerca), **incapsulata** in una forma riutilizzabile e **condivisa**, così che ogni sviluppatore non debba riscoprirla. I sette **cataloghi di conoscenza** di McGraw rientrano in tre categorie:

- **Conoscenza prescrittiva**, che cosa fare: **principi** (massime di progettazione di alto livello come il privilegio minimo; Lezioni 10 e 12), **linee guida** (pratiche raccomandate, spesso legate a un linguaggio o a una piattaforma) e **regole** (regole di codifica concrete e verificabili come "non usare `gets()`", il tipo di regola che uno strumento di analisi statica fa rispettare).
- **Conoscenza diagnostica**, come riconoscere i problemi: **vulnerabilità** (descrizioni di difetti reali, come nelle CVE), **exploit** (come vengono usate in pratica) e **attack pattern** (descrizioni generiche di tecniche d'attacco, come nel catalogo CAPEC di MITRE).
- **Conoscenza storica**: i **rischi storici**, la registrazione dei rischi individuati in progetti reali e di come sono andati a finire.

### Slide 15 · Three pillars in Software Security

> Pillar III: Knowledge catalogs to s/w artifacts

![Lezione 15, pagina 15](L15_p15.webp "50% 1397x807")

**Figura.** Il diagramma dei touchpoint della slide 11 con sette nuvole sopra, una per catalogo di conoscenza: **Principles**, **Guidelines**, **Historical Risks**, **Attack Patterns**, **Rules**, **Vulnerabilities**, **Exploits**. Molte sottili frecce grigie scendono da ogni nuvola verso i touchpoint e i prodotti del lavoro, mostrando quale conoscenza alimenta quale touchpoint.

**Approfondimento.** Ogni touchpoint ha bisogno di una conoscenza specifica. Per esempio le **regole** alimentano la code review (sono ciò che controllano gli strumenti di analisi statica), **principi e linee guida** alimentano i requisiti di sicurezza e l'analisi del rischio architetturale, gli **attack pattern** alimentano abuse case, test di sicurezza basati sul rischio e penetration testing, **vulnerabilità ed exploit** alimentano il penetration testing e le security operations, e i **rischi storici** alimentano l'analisi del rischio. La conoscenza è ciò che trasforma un touchpoint da rituale in controllo efficace: un revisore del codice che non conosce gli attacchi di format string non li vedrà (Lezione 6, slide 37-38: a fool with a tool is still a fool).

## Il Risk Management Framework (pagine 16-22)

### Slide 16 · Risk Management Framework: Five Stages

> - RMF occurs in parallel with SDLC activities

![Lezione 15, pagina 16](L15_p16.webp "50% 1368x660")

**Figura.** Cinque riquadri verdi collegati da frecce: **1 Understand the Business context** → **2 Identify the Business and Technical Risk** (con un'etichetta rossa "**Artifact Analysis**") → **3 Synthesize and Rank the Risks** → **4 Define the Risk Mitigation Strategy** → (in basso) **5 Carry out fixes And validate**, da cui una freccia va a sinistra e risale fino al "**Business Context**" scritto sotto il riquadro 2. I riquadri 2-5 stanno su uno sfondo giallo con l'etichetta "**Measurement and reporting**".

**Approfondimento.** Il **Risk Management Framework (RMF)** è il processo del pilastro I. Si svolge **in parallelo** alle attività di sviluppo, qualunque sia il ciclo di vita, in cinque fasi descritte nelle slide 17-21: capire il contesto di business, identificare i rischi di business e tecnici (analizzando i prodotti del lavoro), sintetizzarli e ordinarli, definire una strategia di mitigazione, realizzare le correzioni e validarle. Due caratteristiche dell'immagine contano: **misurazione e reporting** circondano tutte le fasi (i rischi, il loro stato e i progressi della mitigazione vengono seguiti e riportati di continuo), e la freccia di ritorno dalla fase 5 ne fa un **ciclo**, ripetuto man mano che il progetto e i suoi rischi evolvono (slide 22).

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

**Approfondimento.** Il rischio del software conta solo come rischio di **business**, quindi l'analisi parte dal business: che cosa vuole ottenere l'organizzazione con il software (più ricavi, costi di sviluppo più bassi, rispettare i propri **SLA**, i service-level agreement con i clienti, un alto **ritorno sull'investimento**), quali sono le sue priorità e in quali circostanze opera (mercato, normative, scadenze). La domanda di fondo è **"who cares?"**: una debolezza tecnica in un componente che non gestisce nulla di valore conta meno della stessa debolezza nel componente dei pagamenti. Senza questa fase, l'analisi del rischio produce un elenco di problemi tecnici che nessuno sa come ordinare per priorità.

### Slide 18 · Stage 2: Identify the business & technical risks

> - Business risks have impact
>   - Direct financial loss; loss of reputation; violation of customer or regulatory requirements; increase in development cost
> - Severity of risks
>   - Should be capture in financial or project management terms
> - Key is -
>   - tie technical risks to business context

**Approfondimento.** I **rischi di business** si esprimono con il loro **impatto** sul business: denaro perso direttamente, danni alla reputazione, violazione di contratti o normative (per esempio la legge sulla protezione dei dati), costi di sviluppo più alti. I **rischi tecnici** sono i problemi del software che potrebbero causarli (una SQL injection nel database dei clienti, un controllo di accesso mancante). Il passo chiave è **legare ogni rischio tecnico al contesto di business**: "un attaccante può leggere la tabella degli ordini" diventa "una violazione dei dati dei clienti, con multe e perdita di clienti", e la sua gravità viene espressa in **termini finanziari o di gestione del progetto**, che i dirigenti possono confrontare con il costo della correzione. È la fase chiamata "Artifact Analysis" nella slide 16: i rischi tecnici si trovano analizzando i prodotti del lavoro reali (requisiti, progetto, codice).

### Slide 19 · Stage 3: Synthesize and rank the risks

> - Prioritize the risks alongside the business goals
> - Assign risks appropriate weights for resolution
> - Risk metrics
>   - Risk likelihood
>   - Risk impact
>   - Number of risks mitigated over time

**Approfondimento.** Una volta individuati molti rischi, vanno **messi in ordine di priorità rispetto agli obiettivi di business** e ricevono dei **pesi** che decidono l'ordine in cui vengono risolti. Tre **metriche di rischio** sostengono questo lavoro: la **probabilità** di ciascun rischio (quanto è probabile un exploit), il suo **impatto** (quanti danni farebbe; insieme danno la solita stima probabilità × impatto) e, nel tempo, il **numero di rischi mitigati**, che misura i progressi dell'intero sforzo.

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

**Approfondimento.** La strategia di mitigazione è un **piano coerente**, non un elenco di pezze: per ogni rischio, quale contromisura, in quale ordine, scelta in base al **costo**, alla **completezza** (quanta parte del rischio toglie) e alla **probabilità di successo**. Deve adattarsi al **contesto di business** (fase 1), deve essere qualcosa che l'organizzazione può davvero **permettersi, integrare e capire** (una soluzione perfetta che il gruppo non sa mantenere non è una soluzione), e deve dire in anticipo **come verrà validata ogni correzione** (fase 5), così che "mitigato" abbia un significato verificabile.

### Slide 21 · Stage 5: Carry out Fixes and Validate

> - Execute the chosen mitigation strategy
>   - Rectify the artifacts
>   - Measure completeness
>   - Estimate
>     - Progress, residual risks
> - Validate that risks have been mitigated
>   - Testing can be used to demonstrate and measure
>   - Develop confidence that unacceptable risk does not remain

**Approfondimento.** La strategia viene realizzata **correggendo i prodotti del lavoro** (requisiti, progetto, codice, configurazione), misurando quanto è **completo** il lavoro e stimando i **progressi** e i **rischi residui** (ciò che resta dopo le correzioni). Poi le correzioni vengono **validate**: i **test** (per esempio rieseguire l'attacco che ha motivato la correzione, o i test di sicurezza basati sul rischio delle slide 40-41) dimostrano e misurano che il rischio è sparito, così che ci sia una **fiducia** giustificata **che non resti alcun rischio inaccettabile**.

### Slide 22 · RMF - A Multi-Loop (un ciclo su più livelli)

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

**Approfondimento.** L'RMF non si esegue una volta sola, in sequenza. **La gestione del rischio è continua**: le cinque fasi si applicano molte volte e si possono intrecciare in ordini diversi, perché i rischi emergono in qualunque momento del ciclo di vita (nuovi requisiti, modifiche al progetto, nuove tecniche d'attacco), anche fra una fase e l'altra. Un modo per organizzarlo è eseguire il ciclo in **ogni fase** dell'SDLC. Il ciclo lavora a tre **livelli**: il livello del **progetto** (quello principale: ogni fase va svolta per il progetto nel suo insieme), il livello della **fase dell'SDLC** (un ciclo dentro i requisiti, dentro la progettazione, ...) e il livello del **prodotto del lavoro** (un ciclo su un singolo documento o componente). Il processo è **cumulativo**, ogni passaggio si basa su ciò che si è trovato prima, e a volte **arbitrario e difficile da prevedere**: si affida al giudizio, non a una procedura meccanica.

## I sette touchpoint (pagine 23-24)

### Slide 23 · Seven touchpoints

![Lezione 15, pagina 23](L15_p23.webp "50% 1400x798")

**Figura.** Il diagramma dei touchpoint della slide 11, ora con i touchpoint numerati in cerchi neri: **1** Code review (tools); **2** Risk analysis (il numero compare su entrambe le etichette RISK ANALYSIS); **3** Penetration testing; **4** Risk-based security tests; **5** Abuse cases; **6** Security requirements; **7** Security operations. L'**External review** è segnata con un asterisco (\*) invece che con un numero.

**Approfondimento.** Il riepilogo del pilastro II. I numeri sono la classifica di efficacia di McGraw (slide 9): code review (1) e analisi del rischio architetturale (2) per prime, poi penetration testing (3), test di sicurezza basati sul rischio (4), abuse case (5), requisiti di sicurezza (6) e security operations (7). L'external review (\*), un'analisi fatta da persone esterne al gruppo di progetto, è raccomandata in aggiunta, perché un gruppo interno condivide gli stessi punti ciechi. La numerazione riguarda l'efficacia, mentre la posizione nell'immagine segue i prodotti del lavoro: abuse case e requisiti di sicurezza (5 e 6) vengono per primi nel ciclo di vita anche se sono più in basso in classifica.

### Slide 24 · Cost of fixing defect at each stage (il costo di correggere un difetto in ogni fase)

![Lezione 15, pagina 24](L15_p24.webp "50% 1400x842")

**Figura.** Un grafico, "**Cost of Fixing Defects at Each Stage of Software Development**", con il **Cost per Defect** sull'asse verticale (da $0 a $15,000) e una freccia per fase, da sinistra a destra: **Requirements** e **Design** (appena visibili), **Coding** (piccola, sotto i $2,000), **Testing** (alta, intorno ai $10,000) e **Maintenance** (la più alta, vicina ai $15,000).

**Approfondimento.** L'argomento economico a favore dei touchpoint, lo stesso della Lezione 1, slide 43, e della Lezione 13, slide 4 e 16: il costo di correggere un difetto cresce in modo ripido quanto più tardi lo si trova. Un difetto nei requisiti o nel progetto corretto sulla carta costa poco; lo stesso difetto trovato durante i test richiede di riprogettare, riscrivere il codice e ritestare; trovato in manutenzione, dopo il rilascio, porta con sé anche patch, risposta agli incidenti e danni ai clienti. Per questo i touchpoint sono distribuiti su tutto il ciclo di vita, a partire da requisiti e progettazione, invece di affidarsi al penetration testing alla fine.

## Code review (pagine 25-31)

### Slide 25 · Code review

> - Focus is on implementation *bugs*
>   - Essentially those that *static analysis* can find
>   - Security bugs are real problems - but architectural flaws are just as big a problem
>     - Code review can capture only half of the problems
>   - e.g.
>     - Buffer overflow bug in a particular line of code
>   - Architectural problems are very difficult to find by looking at the code
>     - Specially true for today's large software

**Approfondimento.** La **code review** (touchpoint 1) mira ai **bug di implementazione**: in sostanza i problemi che uno strumento di **analisi statica** può trovare, come un buffer overflow su una certa riga. Sono reali e importanti, ma sono solo **circa la metà** dei problemi: i **difetti architetturali** sono altrettanto grandi, e sono molto difficili da vedere leggendo il codice, perché un flaw non sta su una singola riga (un controllo di autorizzazione mancante su un intero livello, un protocollo che si fida del client). Vale soprattutto per i grandi sistemi di oggi, la cui architettura nessuno può ricostruire da milioni di righe. Per questo la code review va accoppiata all'analisi del rischio architetturale (slide 10).

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

**Approfondimento.** La **tassonomia degli errori di codifica** è quella dei *Seven Pernicious Kingdoms* di Tsipenyuk, Chess e McGraw (Lezione 5, slide 31), che organizza ciò che la code review cerca. I primi tre regni:

- **Input validation and representation**: problemi causati da **metacaratteri** (caratteri con un significato speciale per un interprete, come `'` per SQL o `;` per la shell), **codifiche alternative** (codifiche URL o Unicode che sfuggono ai filtri) e **rappresentazioni numeriche** (con e senza segno, overflow), dal dimenticare la validazione o dal fidarsi troppo dell'input. Esempi: buffer overflow (Lezione 3), integer overflow (Lezione 8, slide 30-33), SQL e command injection (Lezioni 5 e 9).
- **API abuse**: un'API è un **contratto** fra chi chiama e chi è chiamato, e abusarne significa violarlo, per esempio ignorando un valore restituito, o chiamando un'API privilegiata senza rinunciare poi ai privilegi, il che non rispetta il **privilegio minimo** (Lezione 10).
- **Security features**: fare bene le funzioni di sicurezza stesse è difficile: **casualità insicura** (un generatore di numeri casuali prevedibile usato per chiavi o ID di sessione, come il bug del PRNG di OpenSSL/OpenSSH della Lezione 10, slide 39), cattiva **gestione delle password**, **autenticazione** o **controllo degli accessi** rotti, **crittografia** usata male, **gestione dei privilegi** sbagliata.

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

**Approfondimento.** Altri due regni:

- **Time and state**: errori dovuti alla concorrenza e all'ordine degli eventi: **race condition** come il **TOCTOU** (Lezione 11) e i **deadlock**, che possono bloccare un sistema (un denial of service).
- **Error handling**, molto comune in pratica, in due modi opposti: errori **non gestiti**, o gestiti alla leggera (un **valore di errore non controllato**, un **blocco catch vuoto** che prosegue in silenzio in uno stato incoerente; Lezione 10, slide 37-38), ed errori che **rivelano troppo** (stack trace o messaggi di errore SQL mostrati all'utente, che aiutano l'attaccante, come nella SQL injection della Lezione 9) o sono così complicati ("radioattivi") che nessuno vuole occuparsene.

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

**Approfondimento.** Gli ultimi regni:

- **Code quality**: il codice di cattiva qualità si comporta in modo imprevedibile, e gli attaccanti sfruttano l'imprevedibilità mettendo sotto stress il sistema in modi inattesi. Esempi: un **double free** (liberare due volte la stessa memoria corrompe le strutture dati dell'allocatore e può portare all'esecuzione di codice; Lezione 2, slide 3) e un **memory leak** (ripetuto finché la memoria non si esaurisce, diventa un denial of service). Anche la scarsa usabilità rientra qui, perché porta utenti e amministratori a scelte insicure.
- **Encapsulation**: i programmi a oggetti si basano su confini fra classi, oggetti e componenti, e violarli è un errore di sicurezza. Esempio: **confrontare le classi per nome** (in Java due classi diverse possono avere lo stesso nome se caricate da class loader diversi, quindi un controllo basato sul nome può essere ingannato da una classe dell'attaccante con un nome fidato).
- **Environment**: tutto ciò che sta **fuori dal codice** e ne influenza la sicurezza: configurazione, messa in esercizio, ambiente di build. Esempio: una **password scritta in un file di configurazione**, leggibile da chiunque abbia accesso al file o al repository.

### Slide 29 · Code review

> - Static analysis tools
>   - False negative (wrong sense of security)
>     - A sound tool does not generate false negatives
>   - False positives
>   - Some examples
>     - ITS4 (It's The Software Stupid Security Scanner);
>     - RATS; Flawfinder

**Approfondimento.** Gli strumenti di analisi statica automatizzano una parte della code review (Lezioni 6 e 7). I loro errori sono di due tipi (Lezione 6, slide 4): i **falsi negativi**, problemi reali che lo strumento non vede, pericolosi perché danno una **falsa sensazione di sicurezza**; e i **falsi positivi**, avvisi su problemi che non sono reali, che fanno perdere tempo ai revisori e li portano a ignorare lo strumento. Uno strumento **corretto** (sound) garantisce l'assenza di falsi negativi (ciò che non segnala è sicuro), il che in pratica significa accettare più falsi positivi (Lezione 7: le analisi corrette sovra-approssimano). Gli esempi sono i primi scanner lessicali della Lezione 6, slide 15, e della Lezione 8, slide 13: **ITS4** (di Cigital, l'azienda in cui lavorava McGraw), **RATS** e **Flawfinder**.

### Slide 30 · Rules overlap (la sovrapposizione delle regole)

![Lezione 15, pagina 30](L15_p30.webp "50% 1064x1107")

**Figura.** Un diagramma di Venn delle regole sulle API C/C++ di tre strumenti di analisi statica: **SourceScope** (653 total C/C++ APIs), il cerchio più grande; **RATS** (310 total C/C++ APIs); **ITS4** (144 total C/C++ APIs). Delle etichette indicano tre regioni: "**26 APIs unique to RATS**", "**45 APIs unique to ITS4**" e "**3 APIs shared by ITS4 and RATS but not in SourceScope**"; il resto dei cerchi di RATS e ITS4 sta dentro SourceScope.

**Approfondimento.** Le regole di uno strumento di analisi statica sono la sua conoscenza (pilastro III): uno strumento trova solo ciò che la sua base di regole descrive. Il diagramma confronta gli elenchi di funzioni C/C++ pericolose noti a tre strumenti: anche il più grande, SourceScope, non conosce decine di API che gli strumenti più piccoli segnalano (26 note solo a RATS, 45 solo a ITS4, 3 note a entrambi ma non a SourceScope). Nessun insieme di regole di un singolo strumento è completo, quindi usare più strumenti, o uno con una base di regole mantenuta con cura, trova di più, e un rapporto pulito non significa mai "nessun problema".

### Slide 31 · Cigital Static analysis process (il processo di analisi statica di Cigital)

![Lezione 15, pagina 31](L15_p31.webp "50% 1226x1226")

**Figura.** Un diagramma di flusso, "**Static Code Analysis**", in tre colonne, **Inputs**, **Activities** e **Outputs**:

- **Inputs**: il **Technical Lead**; uno **Static Analysis Tool** (FxCop, Fortify, BOON, BLAST); e la **Documentation**: un **Knowledge Management System** che fornisce una **List of Categorized, Prioritized Risks** e gli **Analysis Criteria**, la **Code Documentation** (estratta: standard, piattaforma, linguaggio, framework), gli **Architecture & Design Documents**, i **Prior Analysis Documents** e una **Source File to Module Mapping**.
- **Activities**, dall'alto in basso: **Identify Input Points, Problem Symptoms, & Vulnerabilities for Additional Inspection** → **Set Up Selected Tool(s)** → **Select Source Files to Be Analyzed** → **Run Tool(s)** → **Analyze Tool Output** → **Identify, Categorize, & Prioritize Risk(s)** → **Run Tool(s) Again?**: se YES, si torna alla prima attività; se NO, **Synthesize Results**.
- **Outputs**: **Vulnerable Code & Auto Data** e **Vulnerability Documentation** (dalla prima attività), i **Configured Tool(s)**, i **Source Files to Be Analyzed**, il **Tool Output**, il **Knowledge Management System** con una **Updated List of Categorized, Prioritized Risks**, e i risultati sintetizzati.

**Approfondimento.** Il processo che Cigital, l'azienda di McGraw, usava per la code review assistita da strumenti. Spiccano tre punti: lo strumento viene **preparato e configurato** per la base di codice, non solo lanciato con le impostazioni predefinite (gli strumenti nominati sono FxCop, l'analizzatore di Microsoft per il codice .NET, il commerciale Fortify, e gli strumenti di ricerca BOON, per i buffer overrun, e BLAST, un model checker); l'**output dello strumento viene analizzato da persone**, che scartano i falsi positivi e trasformano le segnalazioni vere in **rischi classificati e ordinati per priorità**, che entrano nella gestione del rischio del pilastro I; e il processo è **iterativo** (gli strumenti vengono rilanciati con impostazioni raffinate o su più file) e **alimenta la base di conoscenza**, così ogni revisione migliora la successiva. Gli input mostrano che il revisore ha bisogno di contesto, architettura, analisi precedenti e rischi noti, per sapere dove guardare.

## Analisi del rischio architetturale (pagine 32-37)

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

**Approfondimento.** L'**analisi del rischio architetturale (ARA)**, touchpoint 2, mira ai **difetti di progettazione**, circa **metà** di tutti i problemi di sicurezza, che **non si possono trovare leggendo il codice** perché vivono a un livello più alto, nel modo in cui componenti, confini di fiducia e protocolli si incastrano (slide 25). È un'analisi del **rischio** nel senso dell'RMF (slide 16-22): i rischi vengono **seguiti nel tempo**, il loro **impatto** viene quantificato, e le preoccupazioni a livello di sistema ("un attaccante potrebbe fingersi il server dei pagamenti") vengono collegate a misure di **probabilità e impatto** su cui la direzione può agire. È la modellazione delle minacce della Lezione 12 dentro il framework di McGraw.

### Slide 33 · Architectural Risk Analysis

> - Three critical steps (or subprocesses)
>   - Attack Resistance Analysis
>   - Ambiguity Analysis
>   - Weakness Analysis

**Approfondimento.** L'ARA è fatta di tre sottoprocessi, descritti nelle slide 35-37: l'**analisi della resistenza agli attacchi** (controllare il progetto rispetto ad attacchi e difetti **noti**), l'**analisi delle ambiguità** (scoprire rischi **nuovi** dove il progetto non è chiaro, o viene capito in modo diverso da persone diverse) e l'**analisi delle debolezze** (valutare i rischi che vengono dalle **dipendenze esterne**: framework, librerie, piattaforma).

### Slide 34 · ARA with RMF

![Lezione 15, pagina 34](L15_p34.webp "50% 1400x781")

**Figura.** L'immagine dell'RMF della slide 16 adattata all'analisi del rischio architetturale: **1 Understand the Business context** → un blocco con **2 Identify the Business Risk** e **3 Identify the Technical Risk** (ciascuno con un'etichetta rossa "**Artifact Analysis**", con "**Business Context**" fra i due e la nota "**Technical expertise**") → **4 Synthesize and Rank the Risks** → **5 Define the Risk Mitigation Strategy** → (in basso) **6 Fix the artifacts** → **7 Validate the artifacts**, da cui una freccia "**Validation loop**" torna al blocco delle fasi 2-3. Le fasi 2-7 stanno su uno sfondo giallo con l'etichetta "**Measurement and reporting**"; una freccia sottile dalla fase 7 esce verso un riquadro "**Initiate process improvement**".

**Approfondimento.** L'ARA è l'RMF applicato all'architettura: i rischi di business e quelli tecnici vengono identificati **separatamente** (la fase 2 richiede di capire il business, la fase 3 una **competenza tecnica** sul progetto e sui suoi attacchi) e poi combinati. Due aggiunte rispetto alla slide 16: le correzioni vengono **validate** in un ciclo finché il rischio non è accettabile, e le lezioni apprese **avviano il miglioramento del processo**, così lo stesso tipo di difetto viene evitato nei progetti futuri, non solo corretto in questo.

### Slide 35 · ARA process

![Lezione 15, pagina 35](L15_p35.webp "50% 1400x912")

**Figura.** Un diagramma di flusso, "**Architectural Risk Analysis**", in tre colonne, **Input**, **Activities** e **Outputs**:

- **Input**, tre gruppi di documenti: Exploit Graphs, Attack Patterns e Secure Design Literature; Requirements, Architectural Documents e Regulatory Requirements/Industry Standards; External Resources (Mailing Lists, Product Documentation) e Attack Patterns.
- **Activities**: il **Security Analyst** comincia con **Build One-Page Architecture Overview**, seguito da tre colonne parallele:
  - **Perform Attack Resistance Analysis** → Identify General Flaws (Noncompliance; Show Where Guidelines Are Not Followed) → Map Applicable Attack Patterns → Show Risks and Drivers in Architecture → Show Viability of Known Attacks Against Analogous Technologies.
  - **Perform Ambiguity Analysis** → Ponder Design Implications → Generate Separate Architecture Diagram Documents → Unify Understanding (Uncovers Ambiguity; Identify Downstream Difficulty (Sufficiency Analysis); Unravel Convolutions; Uncover Poor Traceability).
  - **Perform Underlying Framework Weakness Analysis** → Find & Analyze Flaws in COTS, Frameworks, Network Topology, Platform → Identify Services Used by Application → Map Weaknesses to Assumptions Made by Application.
- **Outputs**: i documenti **Software Flaws** e **Architectural Risk Assessment Report**.

**Approfondimento.** L'intero processo di ARA in una pagina. Il suo primo passo è degno di nota: **costruire una panoramica dell'architettura di una pagina**, un'immagine di alto livello dei componenti e delle loro interazioni, perché i difetti di progettazione sono visibili solo a quel livello di astrazione. Da lì i tre sottoprocessi si svolgono in parallelo (slide 36-37), ciascuno alimentato dalla propria conoscenza: attack pattern, exploit graph e letteratura sulla progettazione sicura per la resistenza agli attacchi; requisiti e documenti di architettura per le ambiguità; risorse esterne su piattaforme e framework per l'analisi delle debolezze. Gli output sono l'elenco dei **difetti del software** e il **rapporto di valutazione del rischio architetturale**, che entrano nelle fasi di classificazione e mitigazione dell'RMF.

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

**Approfondimento.** L'**analisi della resistenza agli attacchi** controlla il progetto rispetto a problemi **noti**:

1. Individuare i **difetti generali** con la letteratura sulla progettazione sicura e le **checklist** (i principi delle Lezioni 10 e 12), aiutati da una base di conoscenza dei **rischi storici**: che cosa è andato storto in sistemi simili.
2. **Mappare gli attack pattern** sul progetto, usando i risultati degli **abuse case** (slide 42-44) o un catalogo di attack pattern: quali attacchi noti si applicano a quale componente?
3. **Individuare i rischi** in base alla checklist.
4. **Dimostrare la praticabilità** degli attacchi noti con un **exploit graph** o un **attack graph**, un diagramma dei passi con cui un attaccante potrebbe raggiungere un obiettivo attraverso il sistema, come gli attack tree della Lezione 12, slide 12-13.

Come dice la nota, è particolarmente efficace nel trovare problemi **noti**, ed è anche per questo che non vede quelli nuovi: quello è il compito dell'analisi delle ambiguità.

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

**Approfondimento.** Gli altri due sottoprocessi:

- L'**analisi delle ambiguità** cerca rischi **nuovi**, che nessuna checklist può fornire; richiede **creatività** e trae vantaggio da **più analisti** con esperienze diverse, che prima analizzano il progetto **in modo indipendente** e poi **unificano la loro comprensione**. Dove le loro visioni del progetto non coincidono c'è un'**ambiguità o un'incoerenza**, e le ambiguità sono dove si nascondono i difetti: se due progettisti capiscono un protocollo in modo diverso, un attaccante può sfruttare la distanza fra le due implementazioni.
- L'**analisi delle debolezze** valuta i rischi delle **dipendenze esterne**. Il software moderno è costruito su **middleware** e piattaforme (allora .NET e J2EE; oggi anche Spring, Node.js, i servizi cloud) e su DLL e librerie comuni, e le loro debolezze diventano debolezze dell'applicazione. Deve considerare i componenti **COTS** (commercial off-the-shelf), i **framework**, la **topologia di rete**, la **piattaforma**, l'**ambiente fisico** e l'**ambiente di build** (un sistema di build compromesso compromette tutto ciò che costruisce, il Trusting Trust della Lezione 2). Oggi questo si chiama sicurezza della catena di fornitura del software.

## Penetration testing e test di sicurezza basati sul rischio (pagine 38-41)

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

**Approfondimento.** Il **penetration testing** (touchpoint 3; Lezione 6, slide 32) è la forma di test di sicurezza più usata. Come si pratica di solito, è un attacco **dall'esterno verso l'interno** al sistema finito, fatto come parte del collaudo finale prima del rilascio. Funziona meglio **dopo** la code review e l'ARA, quando i problemi evidenti non ci sono più e i tester possono concentrarsi su ciò che resta. Il suo limite principale: fatto solo alla fine, è **troppo poco e troppo tardi**; correggere ciò che trova è **costoso** (slide 24), e l'approccio è **reattivo e difensivo** (mettere pezze a ciò che i tester sono riusciti a rompere) invece di costruire dentro la sicurezza. Un penetration test superato mostra solo che quei tester non hanno violato il sistema nel tempo che avevano.

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

**Approfondimento.** Come fare bene il penetration testing: cominciare **presto** e continuare **per tutto** il ciclo di vita (testando componenti e prototipi, non solo il prodotto finale), e **guidarlo con il rischio**: attaccare dove l'analisi del rischio dice che sta il pericolo, invece di lanciare attacchi generici. È il migliore in ciò che gli altri touchpoint non vedono: i **problemi di configurazione** e i **fattori ambientali** (porte aperte, password predefinite, impostazioni deboli dei server), visibili solo in un sistema messo in esercizio. Gli **strumenti** fanno il "lavoro sporco" ripetitivo e producono un output misurabile nel tempo (metriche): strumenti di **fault injection** (che danno in pasto input malformati, come fanno i fuzzer; Lezione 6, slide 25) e la cassetta degli attrezzi dell'attaccante stesso, **disassembler e decompilatori** (per capire i binari), strumenti di **flusso di controllo e copertura** (per vedere quale codice hanno raggiunto i test), **monitor** e perfino **rootkit** (per osservare e controllare il sistema dall'interno).

### Slide 40 · Risk-based security testing

> - Testing must be
>   - Risk-based
>   - grounded in both the system's architectural reality and the attacker's mindset
>     - Better than classical black box testing
>   - Different from penetration testing
>     - Level of approach
>     - Timing of testing
>       - Penetration testing is primarily on completed software in operating environment; outside->in

**Approfondimento.** I **test di sicurezza basati sul rischio** (touchpoint 4) sono guidati dai **rischi** trovati dall'ARA e dagli abuse case, e poggiano sia sulla **vera architettura** del sistema (white-box: i tester conoscono il progetto e ne prendono di mira i punti deboli) sia sulla **mentalità dell'attaccante**. Questo li rende migliori del classico test **black-box**, che sonda il sistema alla cieca. Differiscono dal penetration testing per **livello** (testano componenti e funzioni, non solo l'intero sistema da fuori) e per **momento**: il penetration testing si fa soprattutto sul software completo nel suo ambiente di esercizio, dall'esterno verso l'interno, mentre i test basati sul rischio si pianificano con i piani di test e si eseguono appena i componenti esistono.

### Slide 41 · Risk-based security testing

> - Security testing
>   - Should start at feature or component/unit level testing
>   - Must involve two diverse approaches
>     - Functional security testing
>       - Testing security mechanisms to ensure that their functionality is properly implemented
>     - Adversarial security testing
>       - Performing risk-based security testing motivated by understanding and simulating the attacker's approach

**Approfondimento.** Il test di sicurezza dovrebbe cominciare al livello delle **funzioni e delle unità**, come il test ordinario, e deve combinare due approcci:

- Il **test di sicurezza funzionale** controlla che i **meccanismi** di sicurezza funzionino come specificato: il login rifiuta le password sbagliate, il controllo degli accessi nega gli utenti non autorizzati, la cifratura viene davvero applicata (il test funzionale per la sicurezza della Lezione 6, slide 23). Verifica ciò che il sistema *deve* fare.
- Il **test di sicurezza avversario** controlla ciò che il sistema *non* deve permettere, **simulando un attaccante**: guidato dai rischi, prova injection, overflow, aggiramenti e abusi dei meccanismi. Trova i problemi che il test funzionale non cerca mai, perché la sicurezza riguarda ciò che succede fuori dal comportamento previsto.

## Abuse case (pagine 42-44)

### Slide 42 · Abuse cases

> - Creating anti-requirements
>   - Important to think about
>     - Things that you don't want your software to do
>     - Requires: security analysis + requirement analysis
>   - Anti-requirements
>     - Provide insight into how a malicious user, attacker, thrill seeker, competitor can abuse your system
>     - Considered throughout the lifecycle
>       - indicate what happens when a required security function is not included

**Approfondimento.** Gli **abuse case** (touchpoint 5) sono il lato oscuro degli use case: uno use case descrive come un utente legittimo usa il sistema, un abuse case come un utente malevolo, un attaccante, un cercatore di brividi o un concorrente potrebbe **abusarne**. Catturano gli **anti-requisiti**, cose che il software **non** deve fare (i requisiti negativi della Lezione 1, slide 32), e richiedono insieme due tipi di competenza: l'**analisi della sicurezza** (come funzionano gli attacchi) e l'**analisi dei requisiti** (a che cosa serve il sistema). Vengono scritti presto ma **usati per tutto il ciclo di vita**: mostrano che cosa succede se manca una funzione di sicurezza richiesta, il che giustifica i requisiti di sicurezza, e diventano casi di test per i test di sicurezza basati sul rischio (slide 40-41).

### Slide 43 · Abuse cases

> - Creating an attack model
>   - Based on known attacks and attack types
>   - Do the following
>     - Select attack patterns relevant to your system - build abuse case around the attack patterns
>     - Include anyone who can gain access to the system because threats must encompass all potential sources
>   - Also need to model attacker

**Approfondimento.** Scrivere gli abuse case richiede un **modello d'attacco**: una descrizione degli attacchi che il sistema può subire, basata su **attacchi e tipi di attacco noti**. In pratica: selezionare gli **attack pattern** rilevanti per il sistema (per esempio la SQL injection per un'applicazione web con un database, Lezione 9) e costruire un abuse case attorno a ciascuno; e considerare **chiunque possa accedere al sistema**, non solo gli attaccanti esterni ma anche insider, partner e utenti ordinari, perché le minacce possono venire da qualunque fonte. Infine, **modellare** anche **l'attaccante**: abilità, risorse e motivazione decidono quali attacchi sono realistici (un cercatore di brividi e uno Stato non sono lo stesso avversario).

### Slide 44 · Abuse cases

![Lezione 15, pagina 44](L15_p44.webp "50% 1388x1240")

**Figura.** Un diagramma di flusso, "**Abuse Cases**", in tre colonne, **Inputs**, **Activities** e **Outputs**:

- **Inputs**: il **Security Analyst (SA)** e i **Requirements Analysts (RAs)**; la **Documentation**: **Requirements** (dal Requirements Analyst-Business), **Use Cases** (dal Requirements Analyst-Technical) e **Attack Patterns** (da un Knowledge Management System).
- **Activities**: **Identify Threats** → **Document Threats** → **Review Threats** → **Approved?** (SA & RAs): se NO, **Revise Threats** e nuova revisione; se YES, **Create Anti-Requirements** e **Create Attack Model** (SA) → **Review Anti-Requirements** e **Review Attack Model** (SA & RAs), ciascuno seguito da un controllo **Approved?** con un ciclo di revisione (**Revise Anti-Requirements**, **Revise Attack Model**) → **Create Misuse and Abuse Cases** → **Review Misuse and Abuse Cases** → **Approved?** (se NO, **Revise Misuse and Abuse Cases**; se YES, **Analyze and Rank Misuse and Abuse Cases**, SA & RAs) → **Review Ranked Misuse and Abuse Cases** → **Approved?** (se NO, **Revise Ranked Misuse and Abuse Cases**, SA; se YES, verso gli output).
- **Outputs**: i **Deliverable Documents**: l'**Attack Model** (Threats, Attack Patterns) e i **Ranked Misuse and Abuse Cases**, ciascuno con il **Security Analyst** come responsabile.

**Approfondimento.** Il diagramma mostra come si producono gli abuse case in pratica: dall'**analista della sicurezza**, che porta la conoscenza degli attacchi, insieme agli **analisti dei requisiti**, che sanno che cosa deve fare il sistema, con un passo di **revisione e approvazione** dopo ogni prodotto (minacce, anti-requisiti, modello d'attacco, abuse case, classifica). I due prodotti finali sono il **modello d'attacco** (quali minacce e quali attack pattern si applicano) e l'elenco **ordinato** di misuse e abuse case: l'ordinamento conta perché, come nell'RMF, lo sforzo deve andare prima agli abuse case con il rischio più alto. Questi abuse case guidano poi l'analisi del rischio architetturale, i requisiti di sicurezza e i test di sicurezza basati sul rischio.
