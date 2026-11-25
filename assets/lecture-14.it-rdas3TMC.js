const e=`La Lezione 14 passa dalle attività di sicurezza di un singolo progetto (l'SDL della Lezione 13) ai **modelli di processo** usati per definire, valutare e migliorare lo sviluppo sicuro in un'intera organizzazione: che cos'è un modello di processo e che cosa misura la sua dimensione di *capacità* o di *maturità*, le quattro aree di un SDLC sicuro, i **Capability Maturity Model** (CMMI, l'iCMM della FAA, il Trusted CMM e, costruito apposta per la sicurezza, l'**SSE-CMM**, standardizzato come ISO/IEC 21827, con le sue aree di processo, pratiche di base, pratiche generiche e livelli di capacità), i tre modi in cui si usa l'SSE-CMM (miglioramento del processo, valutazione della capacità con il metodo di valutazione SSAM, assurance), le aggiunte di safety e security della FAA e del DoD a CMMI e iCMM, e il **Team Software Process for Secure Software Development (TSP-Secure)**. Le slide sono 50.

## Obiettivo e modelli di processo (pagine 1-5)

### Slide 1 · Frontespizio

> **Security in Software Applications**
>
> Secure Software Development Models/Methods

### Slide 2 · Objective

> - Understand/Familiarize with various process models for secure software development and assurance
>   - Capability Maturity Models
>     - CMMI, iCMM, SSE-CMM
>     - TSP
>   - Secure software development life cycle models

**Approfondimento.** La Lezione 13 ha descritto *quali* attività di sicurezza dovrebbe svolgere un progetto di sviluppo (l'SDL). Questa lezione prende il punto di vista dell'organizzazione: **come un'organizzazione definisce, misura e migliora i processi** con cui costruisce software sicuro, e come chi sta fuori può giudicare quei processi. Le sigle sono la mappa della lezione:

- **CMM / CMMI**: il Capability Maturity Model (Integration) del Software Engineering Institute (SEI) della Carnegie Mellon University, il modello di riferimento per la maturità dei processi (slide 10-14).
- **iCMM**: il CMM *integrato* della Federal Aviation Administration statunitense, che fonde diversi standard in un solo modello (slide 15-16).
- **SSE-CMM**: il Systems Security Engineering CMM, il modello di maturità scritto apposta per l'ingegneria della sicurezza, oggi lo standard ISO/IEC 21827 (slide 18-37).
- **TSP**: il Team Software Process del SEI e la sua variante per la sicurezza TSP-Secure, un metodo *operativo* per i gruppi di sviluppo (slide 44-50).

La parola **assurance** nell'obiettivo conta: questi modelli servono non solo a costruire software sicuro ma anche a produrre le *prove* che permettono ai clienti di fidarsene (slide 24 e 37).

### Slide 3 · Process Models

> - **Secure Process**
>   - Set of activities performed to develop, maintain, and deliver a secure software solution
>   - Activities could be concurrent or iterative
> - **Process model**
>   - provides a reference set of best practices that can be used for both
>     - process improvement and process assessment
>   - defines the characteristics of processes
>   - usually has an architecture or a structure

**Approfondimento.** Due termini su cui si basa il resto della lezione:

- Un **processo sicuro** è *ciò che un'organizzazione fa davvero*: l'insieme delle attività (requisiti, progettazione, codifica, revisione, test, consegna, manutenzione) con cui sviluppa e mantiene un prodotto sicuro. Le attività non devono essere per forza sequenziali: possono svolgersi in parallelo o ripetersi in iterazioni (sviluppo a spirale o agile, l'osservazione "actually spiral, not waterfall" della Lezione 13, slide 17).
- Un **modello di processo** è un *riferimento*: un catalogo strutturato di buone pratiche con cui si confronta un processo reale. Ha due scopi: il **miglioramento** (trovare ciò che manca e aggiungerlo) e la **valutazione** (misurare quanto è buono un processo, per esempio prima di assegnare un contratto). Descrive le **caratteristiche** che un buon processo deve avere, organizzate in una struttura (categorie, aree di processo, pratiche, livelli), come mostrano le 22 aree di processo dell'SSE-CMM (slide 26-31).

Modello di processo e processo stanno fra loro come "che cosa" e "come": il modello dice *quali* pratiche devono esserci, ogni organizzazione decide *come* realizzarle (slide 10, "no operational guidance").

### Slide 4 · Process Models

> - Process Models
>   - Identify technical and management practices
>     - good software engineering practices to manage and build software
>   - Establishes
>     - common measures of organizational processes throughout the software development lifecycle (SDLC).
>   - But … no guarantees the product is bug free

**Approfondimento.** Un modello di processo copre entrambi i lati della produzione del software: le **pratiche tecniche** (come si costruisce il software: requisiti, progettazione, codifica, test) e le **pratiche di gestione** (come il lavoro viene pianificato, seguito, assegnato e controllato). Stabilisce anche **misure comuni**, così i processi si possono confrontare fra progetti, fra organizzazioni e nel tempo (la "sicurezza migliorata in modo misurabile" della Lezione 13, slide 5).

L'ultimo punto è l'avvertenza essenziale: un buon processo **aumenta la probabilità** di un buon prodotto ma **non la garantisce**. Un'organizzazione matura può comunque rilasciare un buffer overflow, perché un processo è svolto da persone e controllato da strumenti che hanno falsi negativi (Lezione 6, slide 4). Il punto ritorna nella slide 37: le prove sul processo *sostengono* un'affermazione di affidabilità, non la dimostrano.

### Slide 5 · Process Models

> - Typically also have a *capability* or *maturity* dimension used for
>   - assessment and evaluation purposes.
> - Assessments, evaluations, appraisals includes
>   - **comparison** of a process being practiced to a reference process model or standard
>   - **understanding** process capability in order to improve processes
>   - **determining** if the processes being practiced are
>     - adequately specified, designed, and implemented

**Approfondimento.** Oltre all'elenco delle pratiche, un modello di processo ha una **scala di misura**, così a un processo si può dare un livello invece di un verdetto sì/no:

- La **capacità** si riferisce a un *singolo processo* (o area di processo): quanto bene viene svolto quel particolare processo, da "non svolto" a "in miglioramento continuo". L'SSE-CMM valuta ciascuna delle sue aree di processo su una scala di capacità da 0 a 5 (slide 30 e 36).
- La **maturità** si riferisce all'*organizzazione nel suo insieme*: un livello di maturità si raggiunge quando un insieme definito di aree di processo è presente con la capacità richiesta. I livelli di maturità classici del CMM sono 1 Initial, 2 Repeatable (Managed in CMMI), 3 Defined, 4 Managed (Quantitatively Managed in CMMI), 5 Optimizing.

Una **valutazione** (detta anche evaluation o appraisal) usa la scala nei tre modi dei verbi in grassetto: **confrontare** il processo praticato con il modello di riferimento o con uno standard, **capire** la sua capacità per decidere che cosa migliorare, e **determinare** se il processo è adeguatamente specificato (messo per iscritto), progettato (organizzato con criterio) e attuato (seguito davvero). Il terzo conta: un processo che esiste solo sulla carta non è un processo. La slide 32 aggiunge chi fa le valutazioni e perché.

## Le aree di un SDLC sicuro (pagine 6-9)

### Slide 6 · Software Development Life Cycle (SDLC)

> - A survey of existing processes, process models, and standards seems to identify the following four SDLC focus areas for secure software development
>   - Security Engineering Activities
>   - Security Assurance
>   - Security Organizational and Project Management (focused) Activities
>   - Security Risk Identification and Management Activities

**Approfondimento.** Qualunque modello si scelga, un processo di sviluppo sicuro deve coprire quattro aree (sviluppate nelle slide 7-8):

1. **Ingegneria della sicurezza**: costruire dentro la sicurezza (requisiti, progettazione sicura, programmazione sicura, test di sicurezza).
2. **Assurance di sicurezza**: produrre le *prove* che il risultato è sicuro (verifica, validazione, revisioni, valutazioni).
3. **Gestione dell'organizzazione e del progetto**: politiche, sostegno della direzione, ruoli, piani e risorse, senza i quali le attività di ingegneria non reggono nel tempo.
4. **Identificazione e gestione del rischio**: decidere *quali* minacce contano e quanto spendere per esse.

Le stesse quattro aree ricompaiono nella struttura dell'SSE-CMM: le sue aree di processo di ingegneria della sicurezza sono divise in processi di **ingegneria**, di **assurance** e di **rischio** (slide 20-24), e le altre undici aree di processo coprono le pratiche di **progetto e di organizzazione**. L'indagine citata nella slide è lo studio del SEI del 2005 sui processi di SDLC sicuro (N. Davis, *Secure Software Development Life Cycle Processes*), che è anche la fonte delle statistiche su CMMI della slide 13.

### Slide 7 · SDLC

> - Security Engineering Activities
>   - activities needed to engineer a secure solution.
>
>     security requirements elicitation and definition, secure design based on design principles for security, use of static analysis tools, reviews and inspections, security testing, etc..
> - Security Assurance Activities
>
>   verification, validation, expert review, artifact review, and evaluations.

**Approfondimento.** Le prime due aree, e come si collegano al corso:

- Le **attività di ingegneria della sicurezza** sono quelle che *rendono* sicuro il software: individuare e definire i **requisiti di sicurezza** (Lezione 13, slide 7-8; Lezione 1, slide 56), la **progettazione sicura** secondo i principi di progettazione (Lezioni 10 e 12), gli **strumenti di analisi statica** (Lezione 6, slide 15; Lezione 7), **revisioni e ispezioni** di progetti e codice, e i **test di sicurezza**, fuzzing compreso (Lezione 6, slide 25).
- Le **attività di assurance di sicurezza** sono quelle che *mostrano* che è sicuro: la **verifica** ("abbiamo costruito bene il prodotto?", cioè rispetta la sua specifica), la **validazione** ("abbiamo costruito il prodotto giusto?", cioè i requisiti colgono le vere esigenze di sicurezza), la **revisione di esperti**, la **revisione dei prodotti del lavoro** (requisiti, documenti di progetto, codice, risultati dei test) e le **valutazioni** formali (per esempio una valutazione Common Criteria). L'assurance trasforma le attività in prove per una terza parte (slide 24 e 37).

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

**Approfondimento.** Le due aree che restano:

- **Gestione orientata alla sicurezza.** Al livello dell'**organizzazione** la sicurezza ha bisogno di *politiche* (che cosa va protetto, quali pratiche sono obbligatorie), del *sostegno e della supervisione dell'alta direzione* (qualcuno con autorità che finanzia e impone il programma) e di *ruoli definiti* (responsabili della sicurezza, il "security buddy" della Lezione 13, slide 20). Al livello del **progetto** ha bisogno della *pianificazione e del monitoraggio* dei compiti di sicurezza e delle *risorse* (persone, tempo, strumenti) per svolgerli. È la lezione dell'SDL di Microsoft: ha funzionato perché era obbligatorio, misurato e sostenuto da un gruppo centrale (Lezione 13, slide 27).
- **Identificazione e gestione del rischio di sicurezza.** I budget per la sicurezza sono finiti, quindi i rischi vanno identificati (asset, minacce, vulnerabilità, impatto: Lezione 1, slide 49) e **ordinati per costo**: una contromisura vale la pena quando costa meno della perdita che previene. La **mitigazione del rischio** riduce poi ogni rischio a un livello accettabile; ciò che resta (il rischio residuo) viene accettato, trasferito (per esempio a un assicuratore) o evitato rinunciando alla funzione rischiosa. L'SSE-CMM realizza quest'area con le sue aree di processo sul rischio (slide 22).

### Slide 9 · System DLC

![Lezione 14, pagina 9](L14_p09.webp "50% 1400x781")

**Figura.** Una cascata di sei riquadri che scende da sinistra a destra, ciascuno collegato al successivo da una freccia curva: **Investigation → Analysis → Logical Design → Physical Design → Implementation → Maintenance**.

**Approfondimento.** Il **ciclo di vita dello sviluppo dei sistemi** nella forma a cascata comune nei manuali di sicurezza informatica: *indagine* (quale problema, quale perimetro, è fattibile), *analisi* (sistemi attuali, requisiti, minacce), *progettazione logica* (la soluzione indipendente dalla tecnologia: che cosa deve fare il sistema e di quale modello di sicurezza ha bisogno), *progettazione fisica* (le tecnologie, i prodotti e i controlli concreti), *implementazione* (costruire o comprare, testare, mettere in esercizio) e *manutenzione* (far funzionare, monitorare, aggiornare e modificare il sistema per il resto della sua vita). È la catena della Lezione 13, slide 3, con la progettazione divisa in un passo logico e uno fisico. Nella versione sicura ogni fase riceve le sue attività di sicurezza, come nell'SDL della Lezione 13; e, come per ogni immagine a cascata, i progetti reali iterano.

## Capability Maturity Models (pages 10-17)

### Slide 10 · Capability Maturity Models (CMM)

> - Provides reference model of mature practices
> - Helps identify the potential areas of improvement
> - Provides goal-level definition and key attributes for specific processes
> - **No operational guidance !!**
> - *Focuses on/Defines process characteristics*

**Approfondimento.** Un **Capability Maturity Model** descrive come sono le pratiche di un'organizzazione *matura*, così un'organizzazione può confrontarsi con il modello e trovare le lacune da colmare. Per ogni processo dà gli **obiettivi** da raggiungere e gli **attributi chiave** che un processo deve avere per raggiungerli. Le due righe evidenziate sono il punto d'esame: un CMM dice **quali** caratteristiche deve avere un processo, **non come** realizzarle. Non è un metodo, un ciclo di vita o un insieme di procedure; ogni organizzazione progetta il proprio processo e usa il CMM per verificarlo. (Un metodo con indicazioni operative è TSP, slide 44-50.)

Il CMM originale per il software (SW-CMM) fu sviluppato dal SEI della Carnegie Mellon University dalla fine degli anni '80, finanziato dal Dipartimento della Difesa statunitense, che aveva bisogno di un modo per giudicare i fornitori di software che assumeva. Definisce cinque livelli di maturità: 1 Initial (improvvisato, il successo dipende dall'eroismo dei singoli), 2 Repeatable (gestione di base dei progetti), 3 Defined (un processo standard documentato per tutta l'organizzazione), 4 Managed (il processo è misurato e controllato in modo quantitativo) e 5 Optimizing (miglioramento continuo del processo).

### Slide 11 · CMM

> - Three CMMs
>   - Capability Maturity Model Integration® (CMMI®),
>   - The integrated Capability Maturity Model (iCMM),
>   - Systems Security Engineering Capability Maturity Model (SSE-CMM)
>     - Specifically to develop secure systems

**Approfondimento.** I tre modelli della lezione:

- **CMMI** (SEI) integra in un solo framework i precedenti CMM separati (software, ingegneria dei sistemi, sviluppo integrato dei prodotti) (slide 13-14).
- **iCMM** (FAA) integra CMMI con altri standard di qualità e di ciclo di vita (slide 15-16).
- **SSE-CMM** è l'unico dei tre scritto **apposta per la sicurezza**: le sue aree di processo sono attività di ingegneria della sicurezza come valutare minacce e vulnerabilità, specificare le esigenze di sicurezza e costruire un argomento di assurance (slide 18-37).

CMMI e iCMM sono modelli di processo generali con poco da dire sulla sicurezza, ed è per questo che in seguito hanno ricevuto le aggiunte di safety e security delle slide 38-43.

### Slide 12 · Why CMM?

> Source: http://www.secat.com/download/locked\\_pdf/SSEovrw\\_lkd.pdf

![Lezione 14, pagina 12](L14_p12.webp "50% 1400x731")

**Figura.** Un grafico con i **Costs** sull'asse verticale e la **Capability** su quello orizzontale, e due curve di costo crescenti: **Current process** (la più ripida, a sinistra) e **Improved process** (alla sua destra). Un punto magenta sulla curva del processo attuale indica il **Current cost** (linea tratteggiata verso l'asse verticale) alla **Current capability** (linea tratteggiata verso l'asse orizzontale). Da esso partono due mosse: una freccia blu con l'etichetta **Downsizing** scende lungo la stessa curva fino a un punto blu al **Reduced cost**, con l'etichetta "**Reduced capability for lower cost**"; una freccia arancione con l'etichetta **Process Improvement** va di lato fino alla curva del processo migliorato, dove un punto arancione ha l'etichetta "**Improved capability at lower cost**". A destra, una parentesi fra il livello del costo attuale e il livello del punto arancione dice "**Cost of process improvement**", e una parentesi sotto "**Options depending upon business goals**"; frecce sottili dal punto magenta verso diversi punti della curva migliorata mostrano queste opzioni. Il grafico è attribuito a "Source: Merle Whatley, Texas Instruments, Inc.".

**Approfondimento.** L'argomento economico a favore della maturità dei processi. Con il **processo attuale**, costo e capacità sono legati lungo un'unica curva: l'unico modo per spendere meno è il **downsizing** (meno persone, meno ambizioni), che scende lungo la curva e **perde capacità**. Il **miglioramento del processo** porta l'organizzazione su una **curva migliore**, su cui gli stessi soldi comprano più capacità: il punto arancione ha *più* capacità di oggi a un costo *più basso*. Il miglioramento stesso costa qualcosa, e dove atterrare sulla nuova curva, la stessa capacità per molti meno soldi o molta più capacità per soldi simili, è una scelta di business. Qui "capacità" è la capacità di consegnare il prodotto richiesto (per questo corso, la sicurezza richiesta) in modo affidabile, prevedibile e a un costo noto. Il link della fonte punta a una panoramica dell'SSE-CMM, che usa il grafico per rispondere al titolo: i modelli di maturità sono lo strumento per questo tipo di miglioramento.

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

**Approfondimento.** **CMMI** (Capability Maturity Model Integration) ha sostituito i modelli separati del SEI per il software (SW-CMM), l'ingegneria dei sistemi e lo sviluppo integrato dei prodotti con un unico framework integrato, rilasciato per la prima volta nel 2000 (seguì una variante per gli acquisti). Copre lo **sviluppo**, la **manutenzione** e l'**acquisizione** di prodotti e servizi, e contiene sia i **meccanismi di miglioramento** (che cosa fare per migliorare) sia i **criteri di valutazione** per misurare la *capacità* (per area di processo) e la *maturità* (dell'organizzazione). CMMI offre due rappresentazioni: *staged* (i cinque livelli di maturità della slide 10) e *continuous* (un livello di capacità per ogni area di processo, l'approccio seguito anche dall'SSE-CMM). I numeri mostrano quanto sono diffusi questi modelli: a dicembre 2005 circa 1.100 organizzazioni avevano dichiarato valutazioni CMMI, e il più vecchio SW-CMM era stato usato in più di 3.000 organizzazioni e 16.000 progetti dalla fine degli anni '80. I grandi clienti, soprattutto governi e difesa, chiedono spesso ai fornitori un livello minimo di maturità.

### Slide 14 · CMMI

![Lezione 14, pagina 14](L14_p14.webp "50% 1006x1118")

**Figura.** Un albero, "**CMMI Categories**", con quattro categorie e le loro aree di processo:

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

**Approfondimento.** Le **aree di processo** di CMMI (25 in questa versione del modello) sono raggruppate in quattro categorie: **gestione dei processi** (come l'organizzazione definisce i processi, forma le persone e li migliora), **gestione dei progetti** (pianificazione, monitoraggio, fornitori, rischio, gruppi), **ingegneria** (requisiti, soluzione tecnica, integrazione, verifica e validazione) e **supporto** (gestione della configurazione, assicurazione della qualità, misurazione, analisi delle decisioni e delle cause). Si noti che cosa manca: **non c'è alcuna area di processo sulla sicurezza**. La sicurezza può comparire solo indirettamente, come requisito, come rischio o come qualcosa da verificare, ed è la lacuna che motiva l'SSE-CMM (slide 18) e le aggiunte di safety e security (slide 38-43). Si notino anche i due controlli di ingegneria, la **verifica** (costruito bene) e la **validazione** (il prodotto giusto), le attività di assurance della slide 7.

### Slide 15 · Integrated CMM

> - iCMM is widely used in the Federal Aviation Administration (FAA-iCMM)
>   - Provides a single model for enterprise-wide improvement
>   - integrates the following standards and models:
>     - ISO 9001:2000, EIA/IS 731,
>     - Malcolm Baldrige National Quality Award and President's Quality Award criteria,
>     - CMMI-SE/SW/IPPD and
>     - CMMI-A, ISO/IEC TR 15504, ISO/IEC 12207, and ISO/IEC CD 15288.

**Approfondimento.** L'**FAA-iCMM** fu costruito dalla Federal Aviation Administration statunitense per evitare di dover soddisfare separatamente molti standard sovrapposti: un modello, uno sforzo di miglioramento e una valutazione per tutta l'impresa. Gli standard che fonde:

- **ISO 9001:2000**: lo standard generale di gestione della qualità.
- **EIA/IS 731**: il modello di capacità per l'ingegneria dei sistemi.
- I criteri del **Malcolm Baldrige** e del **President's Quality Award**: criteri statunitensi di eccellenza delle prestazioni organizzative.
- **CMMI-SE/SW/IPPD** (ingegneria dei sistemi, ingegneria del software, sviluppo integrato di prodotti e processi) e **CMMI-A** (acquisizione).
- **ISO/IEC TR 15504** (nota anche come SPICE): valutazione dei processi.
- **ISO/IEC 12207**: i processi del ciclo di vita del software (incontrato nella Lezione 12, slide 2, per la sua definizione di progettazione).
- **ISO/IEC 15288** (qui ancora una bozza di comitato, CD): i processi del ciclo di vita dei sistemi.

Senza l'integrazione, un'organizzazione che lavora per la FAA avrebbe bisogno di un programma e di una valutazione separati per ciascuno di essi.

### Slide 16 · Integrated CMM

![Lezione 14, pagina 16](L14_p16.webp "50% 1111x1110")

**Figura.** Un albero, "**iCMM Categories**", con tre categorie e le loro aree di processo:

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

Il riquadro "Deployment, Transition," è tagliato nella figura, e "Integration" compare due volte nella colonna del ciclo di vita.

**Approfondimento.** L'iCMM raggruppa le sue aree di processo per ruolo invece che nelle quattro categorie di CMMI: i processi di **gestione** (impresa, progetto, rischio, fornitori, gruppi), i processi del **ciclo di vita**, che seguono un prodotto dai *bisogni* degli stakeholder attraverso requisiti, progettazione, implementazione, integrazione, messa in esercizio e funzionamento fino alla valutazione, e i processi di **supporto** (esternalizzazione, analisi delle alternative, misurazione, qualità, gestione della configurazione e delle informazioni, definizione e miglioramento dei processi, formazione, innovazione). Il riquadro tagliato è "Deployment, Transition, and Disposal": il ciclo di vita copre il sistema fino alla sua dismissione. Come in CMMI, la sicurezza non è un'area di processo a sé.

### Slide 17 · Trusted CMM

> - Trusted CMM
>   - Early 1990 - Trusted Software Methodology (TSM)
>   - TSM defines trust levels
>     - *Low* emphasizes resistance to unintentional vulnerabilities
>     - *High* adding processes to counter malicious developers
>   - TSM was later harmonized with CMM
>     - Not much in use

**Approfondimento.** La **Trusted Software Methodology (TSM)**, sviluppata all'inizio degli anni '90 per i programmi della difesa statunitense, definiva una scala di **livelli di fiducia**, ciascuno dei quali richiedeva più pratiche di sviluppo di quello inferiore. I due estremi della scala affrontano due minacce diverse:

- I **livelli di fiducia bassi** proteggono dalle **vulnerabilità non intenzionali**: errori in buona fede come i buffer overflow e i bug di format string delle Lezioni 3-4, colti da revisioni, test e controllo della configurazione.
- I **livelli di fiducia alti** aggiungono processi contro gli **sviluppatori malevoli**: un insider che inserisce di proposito una backdoor (lo scenario del Trusting Trust della Lezione 2). Per contrastarli servono separazione dei compiti, revisione indipendente di ogni modifica, gestione rigorosa della configurazione e tracciabilità di chi ha scritto che cosa.

La TSM fu poi fusa con il CMM nel **Trusted CMM** ma, come nota la slide, **non è molto usata**. Il suo valore è l'idea che "quanto ci fidiamo dei nostri stessi sviluppatori" si possa costruire dentro un modello di processo.

## SSE-CMM (pagine 18-31)

### Slide 18 · Systems Security Engineering CMM

> - The SSE-CMM
>   - To improve and assess the **security engineering capability** of an organization
>   - provides a comprehensive framework for
>     - evaluating security engineering practices against the generally accepted security engineering principles.
>   - provides a way to
>     - measure and improve performance in the application of security engineering principles.

**Approfondimento.** L'**SSE-CMM** è il modello di maturità della capacità per l'**ingegneria della sicurezza**. Fu avviato nel 1993 su iniziativa della National Security Agency statunitense, sviluppato con partner governativi e industriali, e in seguito mantenuto dall'International Systems Security Engineering Association (ISSEA). Fa per la sicurezza ciò che CMMI fa per il software: elenca le pratiche che un'organizzazione capace di ingegneria della sicurezza svolge e dà una scala per valutarle. I verbi della slide sono i suoi usi: **valutare** le pratiche di un'organizzazione rispetto ai principi di ingegneria della sicurezza generalmente accettati (una valutazione, slide 34-36), e **misurare e migliorare** quanto bene i principi vengono applicati (miglioramento del processo, slide 33). Si applica a chiunque faccia ingegneria della sicurezza: chi sviluppa prodotti sicuri, chi integra sistemi sicuri e chi fornisce servizi di sicurezza come la valutazione o la gestione.

### Slide 19 · SSE-CMM: ISO/IEC 21827

> - Purpose for SSE-CMM
>   - To fill the lack of a comprehensive framework for evaluating security engineering practices against the principles
> - The SSE-CMM also
>   - describes the essential characteristics of an organization's security engineering processes.
>
> The SSE-CMM is now ISO/IEC 21827 standard (version 3 available)

**Approfondimento.** Prima dell'SSE-CMM la sicurezza si giudicava sul **prodotto** (valutazioni come l'Orange Book o i Common Criteria, che verificano un prodotto finito rispetto a requisiti di sicurezza); niente valutava il **processo** usato per costruirlo. L'SSE-CMM colma questa lacuna e, come ogni CMM (slide 10), descrive le **caratteristiche essenziali** dei buoni processi di ingegneria della sicurezza, non una procedura. È stato adottato come standard internazionale **ISO/IEC 21827** (prima edizione 2002, rivista nel 2008); la versione 3.0 del modello, quella citata nella slide, fu pubblicata nel 2003. Essere uno standard ISO è ciò che lo rende utilizzabile nei contratti e nelle certificazioni fra organizzazioni.

### Slide 20 · SSE-CMM

![Lezione 14, pagina 20](L14_p20.webp "49% 876x1080")

**Figura.** Un albero, "**SSE-CMM Categories**", con due rami:

- **Project and Organizational Process**: Ensure Quality; Manage Configuration; Manage Project Risk; Monitor and Control Technical Effort; Plan Technical Effort; Define Organization's Systems Engineering Process; Improve Organization's Systems Engineering Process; Manage Product Line Evolution; Manage Systems Engineering Support Environment; Provide Ongoing Skills and Knowledge; Coordinate with Suppliers.
- **Security Engineering Process Areas**, in tre gruppi:
  - **Engineering Process**: Specify Security Needs; Provide Security Input; Monitor Security Posture; Administer Security Controls; Coordinate Security.
  - **Assurance Process**: Verify and Validate Security; Build Assurance Argument.
  - **Risk Process**: Assess Threat; Assess Vulnerability; Assess Impact; Assess Security Risk.

**Approfondimento.** Le 22 **aree di processo** dell'SSE-CMM (slide 26-28) divise in due metà da undici. Le aree di processo di **progetto e di organizzazione** sono la normale gestione dell'ingegneria dei sistemi (qualità, configurazione, rischio, pianificazione, definizione e miglioramento dei processi, formazione, fornitori), adattata dal CMM per l'ingegneria dei sistemi. Le aree di processo di **ingegneria della sicurezza** sono il cuore del modello e sono organizzate nei tre processi delle slide successive: **rischio** (decidere da che cosa proteggersi: slide 22), **ingegneria** (decidere e costruire la sicurezza: slide 23) e **assurance** (mostrare che funziona: slide 24). Corrispondono alla slide 6: ingegneria, assurance e rischio sono tre delle quattro aree di un SDLC sicuro, e la quarta, la gestione, è l'altra metà dell'albero.

### Slide 21 · Security Engineering Process

![Lezione 14, pagina 21](L14_p21.webp "50% 1400x768")

**Figura.** Tre riquadri gialli disposti a triangolo: **Engineering Process** in cima, sotto l'icona di un computer con l'etichetta "**Product, System, or Service**"; **Assurance Process** in basso a sinistra; **Risk Process** in basso a destra. Frecce rosse curve a doppia punta uniscono ogni coppia di riquadri. Accanto all'Assurance Process c'è l'icona di un documento con l'etichetta "**Assurance Argument**"; accanto al Risk Process, l'icona di un documento con l'etichetta "**Risk Information**".

**Approfondimento.** L'SSE-CMM vede l'ingegneria della sicurezza come **tre processi che interagiscono**:

- Il **processo del rischio** individua i pericoli per il prodotto o il sistema, li ordina per priorità e produce le **informazioni sul rischio** (slide 22).
- Il **processo di ingegneria** lavora con le altre discipline di ingegneria per decidere e realizzare le soluzioni ai rischi, dentro il vero **prodotto, sistema o servizio** (slide 23).
- Il **processo di assurance** stabilisce la fiducia che le soluzioni funzionino davvero e produce un **argomento di assurance** con le sue prove (slide 24).

Le frecce vanno in entrambe le direzioni perché i tre si alimentano a vicenda di continuo: le informazioni sul rischio guidano ciò che l'ingegneria costruisce, le scelte di ingegneria creano nuovi rischi da valutare, e l'assurance controlla entrambi e segnala indietro i problemi. La sicurezza non è una fase ma questo ciclo continuo, la stessa idea delle attività di sicurezza dell'SDL in ogni fase (Lezione 13).

### Slide 22 · Security Risk Process

![Lezione 14, pagina 22](L14_p22.webp "50% 1400x767")

**Figura.** Tre riquadri gialli di aree di processo a sinistra, ciascuno con una freccia verso l'icona di un documento: **PA04: Assess Threat** → "**Threat Information**"; **PA05: Assess Vulnerability** → "**Vulnerability Information**"; **PA02: Assess Impact** → "**Impact Information**". Le frecce dai tre documenti convergono su **PA03: Assess Security Risk**, che produce un documento con l'etichetta "**Risk Information**".

**Approfondimento.** Il rischio si calcola da tre ingredienti, ciascuno valutato dalla sua area di processo: le **minacce** (chi potrebbe attaccare, con quali capacità e motivazioni), le **vulnerabilità** (quali debolezze potrebbe sfruttare) e l'**impatto** (che cosa perderebbe l'organizzazione se ci riuscisse). **Assess Security Risk** li combina: c'è un rischio solo dove una minaccia può sfruttare una vulnerabilità con un impatto significativo, la relazione fra minaccia, vulnerabilità e asset della Lezione 1, slide 48-49. Le **informazioni sul rischio** che ne risultano ordinano i rischi e sono l'ingresso del processo di ingegneria (slide successiva), che decide quali rischi mitigare: l'analisi del rischio basata sui costi della slide 8.

### Slide 23 · Security is part of Engineering

![Lezione 14, pagina 23](L14_p23.webp "50% 1400x756")

**Figura.** Cinque riquadri gialli di aree di processo collegati in un ciclo attraverso quattro icone di documenti: **PA10: Specify Security Needs** (in alto a sinistra) → "**Requirements, Policy, etc...**" → **PA09: Provide Security Input** (in basso a sinistra) → "**Solutions, Guidance, etc...**" → **PA01: Administer Security Controls** (in basso a destra) → "**Configuration Information**" → **PA08: Monitor Security Posture** (in alto a destra) → "**Risk Information**" → di nuovo PA10. **PA07: Coordinate Security** sta al centro del ciclo.

**Approfondimento.** Il **processo di ingegneria**, dove la sicurezza viene progettata e gestita, come un ciclo di aree di processo:

1. **Specify Security Needs** trasforma le informazioni sul rischio, le leggi e le politiche in **requisiti** di sicurezza.
2. **Provide Security Input** dà a chi progetta e a chi implementa **soluzioni e indicazioni** che rispettano quei requisiti (alternative, compromessi, consigli di progettazione sicura).
3. **Administer Security Controls** installa, configura e gestisce i controlli scelti, producendo le **informazioni di configurazione**.
4. **Monitor Security Posture** osserva il sistema in esercizio (log, incidenti, nuove vulnerabilità, modifiche) e produce nuove **informazioni sul rischio**, che tornano ad alimentare le esigenze di sicurezza.
5. **Coordinate Security**, al centro, fa comunicare e mettere d'accordo tutti i gruppi coinvolti (gruppi di ingegneria, gruppo di sicurezza, parti esterne). È il punto del titolo della slide: la sicurezza è **parte dell'ingegneria**, fatta insieme alle altre attività di ingegneria, non isolata.

Il ciclo non finisce mai: il monitoraggio dopo la messa in esercizio fa ripartire il ciclo, proprio come la fase di risposta dell'SDL alimenta di nuovo i requisiti (Lezione 13, slide 15 e 25).

### Slide 24 · Assurance

![Lezione 14, pagina 24](L14_p24.webp "50% 1400x584")

**Figura.** **PA11: Verify and Validate Security** → un documento "**Verification and Validation Evidence**"; una pila di riquadri "**Many other PAs**" → un documento "**Evidence**". Entrambi i documenti alimentano **PA06: Build Assurance Argument**, che produce un documento "**Assurance Argument**".

**Approfondimento.** L'**assurance** è il grado di fiducia che le esigenze di sicurezza siano soddisfatte, e l'SSE-CMM lo costruisce a partire dalle **prove**. **Verify and Validate Security** controlla le soluzioni rispetto ai requisiti (verifica) e rispetto alle reali esigenze operative (validazione), e **molte altre aree di processo** lasciano anch'esse delle prove (valutazioni del rischio, documenti di progetto, registrazioni della configurazione, risultati dei test). **Build Assurance Argument** riunisce queste prove in un **argomento di assurance**: un caso strutturato che spiega, affermazione per affermazione, perché ci si può fidare che il sistema raggiunga i suoi obiettivi di sicurezza. È così che il lavoro sul processo diventa qualcosa che un cliente o un valutatore può controllare (slide 37).

### Slide 25 · SSE-CMM dimensions

> Practices (generic) that indicate Process Management & Institutionalization Capability

![Lezione 14, pagina 25](L14_p25.webp "50% 1102x838")

**Figura.** Una griglia con un asse verticale "**Capability Dimension (Generic Practices)**" e uno orizzontale "**Domain Dimension (Base Practices)**". Una colonna e una riga sono evidenziate in giallo e si incrociano in una cella rossa. Un'indicazione che punta alla colonna gialla dice "**Generic Practice 2.1.1 Allocate Resources**"; una che punta alla riga gialla dice "**Base Practice 05.02 Identify System Security Vulnerabilities**".

**Approfondimento.** L'SSE-CMM ha **due dimensioni**:

- La **dimensione del dominio** contiene le **pratiche di base**: *in che cosa* consiste l'ingegneria della sicurezza (identificare le vulnerabilità, valutare le minacce, specificare le esigenze di sicurezza, ...), raggruppate in aree di processo (slide 26-28).
- La **dimensione della capacità** contiene le **pratiche generiche**: *quanto bene* un processo qualunque è gestito e istituzionalizzato (assegnare risorse, pianificare, seguire, verificare, standardizzare, misurare, migliorare), raggruppate in caratteristiche comuni e livelli di capacità (slide 29-31). Come dice la didascalia, indicano la capacità di gestione e di istituzionalizzazione del processo, e sono "generiche" perché si applicano a ogni area di processo.

Ogni cella della griglia accoppia una pratica di base con una pratica generica. La cella rossa è l'esempio: la pratica generica 2.1.1, *Allocate Resources* (una pratica di livello 2), applicata alla pratica di base 05.02, *Identify System Security Vulnerabilities* (nella PA05, Assess Vulnerability), chiede se l'organizzazione assegna risorse adeguate (persone, tempo, strumenti) all'identificazione delle vulnerabilità. Valutare l'intera griglia mostra *quanto è capace* l'organizzazione in ogni parte dell'ingegneria della sicurezza.

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

**Approfondimento.** La dimensione del dominio in numeri: **129 pratiche di base** in **22 aree di processo**. 61 di esse, nelle 11 aree di processo di ingegneria della sicurezza (PA01-PA11), riguardano l'ingegneria della sicurezza; le altre 68, nelle 11 aree di processo di progetto e di organizzazione (PA12-PA22), riguardano la gestione. Le proprietà di una pratica di base spiegano perché il modello resta valido nel tempo: è **essenziale** (vale per tutto il ciclo di vita dell'impresa), **distinta** (non si sovrappone ad altre pratiche), **collaudata** (una buona pratica consolidata della comunità della sicurezza, non l'ultima tecnica della ricerca) e **indipendente dal metodo** (dice *che cosa* va fatto, per esempio "identificare le vulnerabilità di sicurezza del sistema", mai *quale* strumento o metodo usare, in linea con il "no operational guidance" della slide 10). Una pratica che nominasse uno scanner specifico sarebbe obsoleta in pochi anni; una pratica che chiede di identificare le vulnerabilità non lo sarà.

### Slide 27 · Process Area

> - Assembles related activities in one area for ease of use
> - Relates to valuable security engineering services
> - Applies across the life cycle of the enterprise
> - Can be implemented in multiple organization and product contexts
> - Can be improved as a distinct process
> - Can be improved by a group with similar interests in the process
> - Includes all base practices that are required to meet the goals of the process area

**Approfondimento.** Un'**area di processo** è un gruppo di pratiche di base collegate che insieme raggiungono un insieme di **obiettivi** (per esempio l'obiettivo della PA05 *Assess Vulnerability* è una comprensione delle vulnerabilità di sicurezza del sistema). Il raggruppamento rende il modello utilizzabile: un'area di processo corrisponde a un servizio di ingegneria della sicurezza riconoscibile, si può applicare in organizzazioni e prodotti diversi e, soprattutto, si può **valutare e migliorare da sola** da parte di chi la svolge (il gruppo che valuta le vulnerabilità può migliorare la PA05 senza aspettare il resto dell'organizzazione). L'ultimo punto è la regola di completezza: svolgere tutte le pratiche di base di un'area di processo è ciò che serve per raggiungerne gli obiettivi.

### Slide 28 · Process Areas

> **Process Areas related to Security Engineering process areas**
>
> **Process Areas related to project and Organizational practices**

![Lezione 14, pagina 28](L14_p28.webp "50% 1400x481")

**Figura.** Sotto i due titoli, i due elenchi di aree di processo:

| Aree di processo di ingegneria della sicurezza | Aree di processo di progetto e di organizzazione |
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

**Approfondimento.** Le 22 aree di processo con i loro numeri ufficiali, usati nel resto della lezione. Quelle di ingegneria della sicurezza sono numerate in ordine alfabetico, non nell'ordine del processo; raggruppate per processo (slide 21-24) sono: **rischio** PA02, PA03, PA04, PA05; **ingegneria** PA01, PA07, PA08, PA09, PA10; **assurance** PA06, PA11. Un esercizio utile è collocare un'attività concreta nella sua area di processo: far girare uno scanner di vulnerabilità è PA05; analizzare chi potrebbe attaccare e come è PA04 (con PA03 per il rischio complessivo); definire i requisiti di sicurezza è PA10; configurare un firewall è PA01; esaminare log e incidenti è PA08; testare che i controlli rispettino i requisiti è PA11; scrivere il caso di sicurezza per una certificazione è PA06.

### Slide 29 · Generic Process Areas

> - Activities that apply to all processes
> - They are used during
>   - Measurement and institutionalization
> - Capability levels
>   - Organize common features
>   - Ordered according to maturity

**Approfondimento.** La dimensione della capacità (slide 25) ha tre strati: le **pratiche generiche** (attività che valgono per ogni area di processo, come "assegnare le risorse" o "seguire le prestazioni"), raggruppate in **caratteristiche comuni** (per esempio 2.1 Planned Performance, 2.4 Tracking Performance), raggruppate in **livelli di capacità** ordinati per maturità (slide 30-31). Si usano nella **misurazione** (una valutazione controlla quali pratiche generiche vengono svolte per ogni area di processo, il che dà il suo livello di capacità) e nell'**istituzionalizzazione**: rendere un processo una parte stabile, documentata, dotata di risorse e imposta del modo di lavorare dell'organizzazione, così che non dipenda da persone particolari e sopravviva al ricambio del personale.

### Slide 30 · Capability Levels

![Lezione 14, pagina 30](L14_p30.webp "50% 1400x781")

**Figura.** Ellissi annidate, dalla più interna: **1 Performed Informally** (nera), **2 Planned & Tracked**, **3 Well Defined**, **4 Quantitatively Controlled**, **5 Continuously improving** (la più esterna); **0 Not Performed** è scritto fuori da tutte. Delle frecce vanno dai livelli alle caratteristiche comuni elencate sotto di essi:

| Livello | Caratteristiche comuni |
| --- | --- |
| 0 Not Performed | |
| 1 Performed Informally | Base Practices Performed |
| 2 Planned & Tracked | Committing to perform; Planning performance; Disciplined performance; Tracking performance; Verifying performance |
| 3 Well Defined | Defining a standard process; Tailoring standard process; Using data; Perform a defined process |
| 4 Quantitatively Controlled | Establishing measurable quality goals; Determining process capability to achieve goals; Objectively managing performance |
| 5 Continuously improving | Establishing quantitative process goals; Improving process effectiveness |

**Approfondimento.** I sei livelli di capacità di un'area di processo dell'SSE-CMM. Ogni livello comprende tutto ciò che c'è nei livelli al suo interno, come mostra l'annidamento:

- **0 Not Performed**: le pratiche di base non vengono svolte.
- **1 Performed Informally**: le pratiche di base vengono svolte, ma in modo improvvisato, affidato all'impegno dei singoli: il lavoro viene fatto, ma nessuno sa dire come verrà fatto la volta successiva.
- **2 Planned and Tracked**: il lavoro viene pianificato, svolto secondo procedure (in modo disciplinato), e i suoi risultati vengono verificati e seguiti, così la direzione può vedere se procede nella giusta direzione.
- **3 Well Defined**: l'organizzazione ha un **processo standard**, adattato a ogni progetto e basato sui dati dei progetti passati, così ogni gruppo lavora nello stesso modo documentato.
- **4 Quantitatively Controlled**: si fissano obiettivi di qualità misurabili e il processo è gestito con delle **misurazioni** (per esempio vulnerabilità trovate per ora di revisione, tempo di correzione), quindi le sue prestazioni sono prevedibili.
- **5 Continuously Improving**: si fissano obiettivi quantitativi di efficacia del processo e il processo viene migliorato di continuo sulla base delle misurazioni.

È la richiesta della Lezione 13 di un processo ripetibile e misurabile (slide 5-6) trasformata in una scala: ripetibile ai livelli 2-3, misurato al livello 4, in miglioramento al livello 5.

### Slide 31 · Summary chart

![Lezione 14, pagina 31](L14_p31.webp "50% 1400x1003")

**Figura.** Una griglia di valutazione vuota. Le righe sono le **Common Features**, dal basso: 1.1 Base Practices Are Performed; 2.1 Planned Performance; 2.2 Disciplined Performance; 2.3 Verifying Performance; 2.4 Tracking Performance; 3.1 Defining a Standard Process; 3.2 Perform the Defined Process; 3.3 Coordinate Practices; 4.1 Establish Meas. Quality Goals; 4.2 Objectively Managing Perf.; 5.1 Improving Org. Capability; 5.2 Improving Proc. Effectiveness. Le colonne sono le 22 **Process Areas**, scritte in verticale: sotto "**Security Engineering Process Areas**", da PA01 - Administer Security Controls a PA11 - Verify and Validate Security; sotto "**Project and Organizational Process Areas**", da PA12 - Ensure Quality a PA22 - Coordinate with Suppliers, con i nomi della slide 28, alcuni abbreviati (per esempio "PA17 - Define Org. Systems Eng. Process", "PA20 - Manage Systems Eng. Support Env.").

**Approfondimento.** Tutto l'SSE-CMM in una pagina: la **dimensione del dominio** in orizzontale (22 aree di processo) e la **dimensione della capacità** in verticale (12 caratteristiche comuni, raggruppate nei livelli 1-5). Una valutazione riempie la griglia, segnando per ogni area di processo quali caratteristiche comuni sono soddisfatte. Il **livello di capacità** di un'area di processo è il livello più alto le cui caratteristiche comuni sono tutte soddisfatte, insieme a quelle di ogni livello inferiore. Il risultato riempito è il profilo di capacità della slide 36.

## Usare l'SSE-CMM (pagine 32-37)

### Slide 32 · Using SSE-CMM

> - Can be used in one of the three ways
>   - Process improvement
>     - Facilitates understanding of the level of security engineering process capability
>   - Capability evaluation
>     - Allows consumer organization to understand the security engineering process capability of provider
>   - Assurance
>     - Increases the confidence that product/system/service is trustworthy

**Approfondimento.** I tre usi si distinguono per **chi** applica il modello e **perché**:

- Il **miglioramento del processo** lo fa un'organizzazione *su se stessa*: misura il proprio livello di capacità attuale in ogni area di processo, decide i livelli obiettivo e migliora (slide 33).
- La **valutazione della capacità** la fa un *cliente* (o qualcuno per suo conto) su un *fornitore*: prima di comprare un prodotto o di esternalizzare lo sviluppo, il cliente controlla se l'ingegneria della sicurezza del fornitore è abbastanza capace (slide 34-36). Era il motivo originale dei CMM: il governo statunitense voleva scegliere i fornitori in base alla capacità dei processi, non solo al prezzo.
- L'**assurance** riguarda il *prodotto*: le prove che è stato costruito da un processo capace aumentano la fiducia che sia affidabile (slide 37).

### Slide 33 · Process Improvement

![Lezione 14, pagina 33](L14_p33.webp "50% 1400x788")

**Figura.** Una freccia circolare fatta di segmenti, che parte da "**Stimulus for Change**" e attraversa cinque fasi con un'etichetta: **Initiating** (Set Context, Build Sponsorship, Charter Infrastructure), **Diagnosing** (Characterize Current & Desired States, Develop Recommendations), **Establishing** (Set Priorities, Develop Approach, Plan Actions), **Acting** (Create Solution, Pilot/Test Solution, Refine Solution, Implement Solution) e **Learning** (Analyze and Validate, Propose Future Actions); la punta della freccia dopo "Propose Future Actions" rientra nel ciclo.

**Approfondimento.** È il modello **IDEAL** del SEI per il miglioramento dei processi, che prende il nome dalle sue cinque fasi, il ciclo di miglioramento usato con l'SSE-CMM:

1. **Initiating**: uno stimolo (un incidente, un contratto perso, una nuova normativa) fa partire lo sforzo; se ne fissano il contesto e gli obiettivi, si ottiene il **sostegno** della direzione e si prepara l'infrastruttura (chi gestisce il programma).
2. **Diagnosing**: valutare lo stato **attuale** (per esempio con l'SSE-CMM), definire quello **desiderato** e raccomandare come colmare la distanza.
3. **Establishing**: fissare le priorità, scegliere l'approccio e pianificare le azioni.
4. **Acting**: creare la soluzione (nuove procedure, strumenti, formazione), provarla con un **pilota** su un progetto, raffinarla e diffonderla.
5. **Learning**: analizzare i risultati, controllare che gli obiettivi siano stati raggiunti e proporre i miglioramenti successivi; poi il ciclo ricomincia.

È il ciclo plan-do-check-act della gestione della qualità applicato ai processi: il miglioramento è continuo, mai un progetto una tantum.

### Slide 34 · Capability Evaluation

> - No need to use any particular appraisal method developed if needed
> - SSE-CMM Appraisal (SSAM) method has been developed if needed
> - SSAM purpose
>   - Obtain the baseline or benchmark of actual practice related to security engineering within the organization or project
>   - Create or support momentum for improvement within multiple levels of the organizational structure

**Approfondimento.** L'SSE-CMM si può usare con qualunque metodo di valutazione, ma ne esiste uno dedicato, lo **SSE-CMM Appraisal Method (SSAM)**. Ha due scopi: produrre una **baseline** (dove siamo ora, misurato in modo oggettivo: il passo "Diagnosing" del ciclo IDEAL) e creare **slancio**: una valutazione coinvolge persone a ogni livello, da chi lavora sul campo alla direzione, e i suoi risultati rendono visibile e condiviso il bisogno di miglioramento.

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

**Approfondimento.** Una valutazione SSAM ha quattro fasi:

1. **Pianificazione**: concordare con il committente perimetro, obiettivi, il gruppo di valutazione, il calendario e le aree di processo da valutare.
2. **Preparazione**: formare il gruppo di valutazione e raccogliere informazioni in anticipo con dei **questionari** compilati dall'organizzazione; un'analisi preliminare delle risposte dice al gruppo che cosa cercare e che cosa chiedere sul posto.
3. **Sul posto**: **interviste** con chi lavora sul campo (le persone che fanno davvero il lavoro, non solo i dirigenti) ed esame delle prove, per raccogliere dati e **convalidare** le risposte ai questionari: ciò che le persone dicono di fare deve corrispondere a ciò che fanno davvero.
4. **Dopo la valutazione**: l'analisi finale, un profilo di capacità (slide 36) con punti di forza, debolezze e raccomandazioni, viene presentata al **committente**.

### Slide 36 · Capability Evaluation

![Lezione 14, pagina 36](L14_p36.webp "50% 1400x605")

**Figura.** Un **profilo di capacità**: per ciascuna delle 22 aree di processo (colonne PA01-PA22, sotto "**Security Engineering Process Areas**" e "**Project and Organizational Process Areas**"), celle rosse riempiono la colonna dal **Level 1** fino al livello raggiunto (righe da **Level 1** a **Level 5**, con l'etichetta "Capability Levels"):

| Livello raggiunto | Aree di processo |
| --- | --- |
| nessuno (nessuna cella rossa) | PA04, PA10, PA11 |
| Livello 1 | PA02, PA05, PA07, PA12, PA13, PA17, PA18, PA19, PA21, PA22 |
| Livello 2 | PA01, PA06, PA09, PA14, PA15, PA16 |
| Livello 3 | PA03, PA08, PA20 |
| Livelli 4-5 | nessuna |

**Approfondimento.** Il risultato di una valutazione non è un singolo numero ma un **profilo**, un livello di capacità per ogni area di processo (la rappresentazione *continuous* della slide 13). Il profilo mostra dove investire. In questo esempio l'organizzazione valuta il rischio di sicurezza (PA03) e monitora la propria postura di sicurezza (PA08) a un livello 3 ben definito, ma **non svolge affatto** la valutazione delle minacce (PA04), la specifica delle esigenze di sicurezza (PA10) né la verifica e validazione della sicurezza (PA11): la sua valutazione del rischio non poggia su alcuna analisi delle minacce, i suoi requisiti di sicurezza non sono specificati, e niente controlla che i controlli li rispettino. Un cliente che valutasse questo fornitore vedrebbe subito le lacune, e un programma di miglioramento partirebbe proprio da quelle tre aree di processo.

### Slide 37 · Assurance

> - A mature organization
>   - more likely to create a product or system with appropriate assurance
> - Process evidence
>   - to support claims for the product trustworthiness
> - It is conceivable that
>   - an immature organization could produce high assurance product.

**Approfondimento.** La relazione fra processo e prodotto, detta con attenzione: un'organizzazione matura ha **più probabilità** di produrre un prodotto affidabile, e le registrazioni del suo processo (piani, revisioni, risultati dei test, l'argomento di assurance della slide 24) sono **prove** che sostengono le affermazioni sul prodotto. Ma la maturità del processo non è né necessaria né sufficiente: un'organizzazione **immatura** potrebbe, per talento o per fortuna, produrre un prodotto ad alta assurance (solo che non saprebbe dimostrarlo, né ripeterlo), e una matura può comunque rilasciare difetti (slide 4, "no guarantees the product is bug free"). Per questo l'assurance combina le prove sul **processo** (SSE-CMM) con la valutazione del **prodotto** (test, analisi, certificazioni come i Common Criteria).

## Le aggiunte di safety e security (pagine 38-43)

### Slide 38 · CMMI/iCMM/SSE-CMM

> - CMMI / iCMM used by more organizations than the SSE-CMM
>   - Because of the integration of process disciplines and coverage of enterprise issues,
> - One weakness CMMI and iCMM
>   - have gaps in their coverage of safety and security.
> - Joint effort sponsored by FAA and the DoD
>   - to identify best safety and security practices for use in combination with the iCMM and the CMMI.

**Approfondimento.** In pratica CMMI e iCMM sono molto più diffusi dell'SSE-CMM, perché coprono tutta l'impresa (software, sistemi, acquisizioni, gestione) in un solo modello, mentre l'SSE-CMM copre solo l'ingegneria della sicurezza. Ma hanno poco da dire sulla **safety** (nessun danno alle persone o all'ambiente, essenziale nell'aviazione) e sulla **security**. Invece di chiedere alle organizzazioni di adottare un ennesimo modello, la FAA e il Dipartimento della Difesa statunitense hanno individuato un insieme di **pratiche di safety e security** da usare *sopra* CMMI o iCMM (pubblicato nel 2004 come *Safety and Security Extension for Integrated Capability Maturity Models*): 4 obiettivi e 16 pratiche, nelle slide successive. Safety e security sono trattate insieme perché condividono la maggior parte dell'ingegneria: pericoli e minacce si analizzano entrambi come rischi, ed entrambi richiedono requisiti, argomenti di assurance e verifica indipendente.

### Slide 39 · Safety/Security additions

> - The proposed Safety and Security additions include the following four goals:
>   - Goal 1 - An infrastructure for safety and security is established and maintained.
>   - Goal 2 - Safety and security risks are identified and managed.
>   - Goal 3 - Safety and security requirements are satisfied.
>   - Goal 4 - Activities and products are managed to achieve safety and security requirements and objectives.

**Approfondimento.** I quattro obiettivi formano una sequenza, segnata nella slide dalle parole chiave sottolineate *infrastructure*, *risks*, *requirements* e *managed*: (1) predisporre l'**infrastruttura** organizzativa (consapevolezza, persone competenti, un ambiente adatto, gestione degli incidenti, continuità); (2) identificare e gestire i **rischi**; (3) trasformarli in **requisiti** e assicurarsi, con delle prove, che il prodotto li soddisfi; (4) **gestire** le attività e i prodotti del progetto (piani, fornitori, monitoraggio) in modo che gli obiettivi vengano davvero raggiunti. Rispecchiano le quattro aree della slide 6: infrastruttura e gestione (obiettivi 1 e 4), rischio (obiettivo 2), ingegneria e assurance (obiettivo 3).

### Slide 40 · Goal 1 related practices

> 1. Ensure safety and security awareness, guidance, and competency.
> 2. Establish and maintain a qualified work environment that meets safety and security needs.
> 3. Ensure integrity of information by providing for its storage and protection, and controlling access and distribution of information.
> 4. Monitor, report and analyze safety and security incidents and identify potential corrective actions.
> 5. Plan and provide for continuity of activities with contingencies for threats and hazards to operations and the infrastructure
>
> Goal 1 - An infrastructure for safety and security is established and maintained.

**Approfondimento.** Le pratiche di infrastruttura, di cui l'organizzazione ha bisogno prima che qualunque progetto possa essere sicuro:

1. **Consapevolezza e competenza**: le persone conoscono le politiche e i rischi di safety e security e sono formate per il loro ruolo (il pilastro della "formazione degli ingegneri" della Lezione 13, slide 6).
2. **Ambiente di lavoro qualificato**: strutture, strumenti e ambienti di sviluppo che siano a loro volta sicuri; un server di build o un compilatore compromessi minano tutto (la lezione del Trusting Trust della Lezione 2).
3. **Integrità delle informazioni**: archiviazione protetta, controllo degli accessi e distribuzione controllata delle informazioni dell'organizzazione, compresi progetti, codice sorgente e dati di progetto.
4. **Gestione degli incidenti**: gli incidenti vengono monitorati, segnalati e analizzati, e se ne individuano le azioni correttive (la fase di risposta della Lezione 13).
5. **Continuità**: piani di emergenza perché le attività continuino nonostante minacce e pericoli (continuità operativa e disaster recovery).

### Slide 41 · Goal 2 related practices

> 1. Identify risks and sources of risks attributable to **vulnerabilities**, security **threats**, and safety **hazards**.
> 2. For each risk associated with safety or security, determine the causal factors, estimate the consequence and likelihood of an occurrence, and determine relative priority.
> 3. For each risk associated with safety or security, determine, implement and monitor the risk mitigation plan to achieve an acceptable level of risk.
>
> Goal 2 - Safety and security risks are identified and managed.

**Approfondimento.** La classica gestione del rischio in tre passi: **identificare** i rischi e le loro fonti, che per la security sono minacce che sfruttano vulnerabilità e per la safety sono pericoli (slide 22; Lezione 1, slide 49); **analizzare** ciascuno di essi, le sue cause, la sua **conseguenza** (l'impatto) e la sua **probabilità**, che insieme ne danno la priorità (rischio ≈ probabilità × impatto è la stima usuale); e **mitigare**: pianificare, realizzare e monitorare le contromisure finché il rischio residuo non è **accettabile**. "Accettabile" è l'obiettivo realistico: il rischio si può ridurre, raramente eliminare (Lezione 2, slide 17).

### Slide 42 · Goal 3 related practices

> 1. Identify and document applicable regulatory requirements, laws, standards, policies, and acceptable levels of safety and security.
> 2. Establish and maintain safety and security requirements, including integrity levels, and design the product or service to meet them.
> 3. Objectively verify and validate work and delivered products and services to assure safety and security requirements achieved and fulfill intended use.
> 4. Establish and maintain safety and security assurance arguments and supporting evidence throughout the lifecycle.
>
> Goal 3 - Safety and security requirements are satisfied.

**Approfondimento.** Il nucleo di ingegneria e assurance, la stessa catena dei processi di ingegneria e di assurance dell'SSE-CMM (slide 23-24):

1. Raccogliere i **vincoli esterni**: normative, leggi, standard, politiche, e il livello di rischio accettabile (per esempio la legge sulla protezione dei dati o gli standard di sicurezza aeronautica).
2. Scrivere i **requisiti di safety e security**, con i **livelli di integrità** (quanto è critico ogni componente: più è critico, più rigorosi devono essere il suo sviluppo e la sua verifica), e progettare il prodotto in modo che li rispetti.
3. **Verificare e validare in modo oggettivo**, cioè indipendentemente dagli sviluppatori, che i requisiti siano rispettati e che il prodotto svolga l'uso previsto (la PA11 dell'SSE-CMM).
4. Mantenere un **argomento di assurance** con le sue prove per tutto il ciclo di vita (la PA06), aggiornandolo ogni volta che il prodotto cambia.

### Slide 43 · Goal 4 related practices

> 1. Establish and maintain independent reporting of safety and security status and issues.
> 2. Establish and maintain a plan to achieve safety and security requirements and objectives.
> 3. Select and manage products and suppliers using safety and security criteria.
> 4. Measure, monitor and review safety and security activities against plans, control products, take corrective action, and improve processes.
>
> Goal 4 - Activities and products are managed to achieve safety and security requirements and objectives.

**Approfondimento.** Le pratiche di gestione:

1. **Segnalazione indipendente**: lo stato di safety e security arriva alla direzione attraverso un canale indipendente dal progetto, così i problemi non vengono nascosti sotto la pressione delle scadenze (si confronti il gruppo di sicurezza centrale dell'SDL di Microsoft, Lezione 13, slide 27).
2. Un **piano** per le attività di safety e security, come per qualunque altra attività del progetto.
3. **Fornitori e prodotti** (componenti di terze parti, librerie, sviluppo esternalizzato) vengono scelti e gestiti con criteri di safety e security: la catena di fornitura fa parte della superficie d'attacco.
4. **Misurare e controllare**: confrontare le attività con il piano, correggere le deviazioni e migliorare il processo (il pilastro di metriche e responsabilità della Lezione 13, slide 6).

## Il Team Software Process per il software sicuro (pagine 44-50)

### Slide 44 · Team Software Process for Secure SW/Dev

> - TSP
>   - provides a framework, a set of processes, and disciplined methods for applying software engineering principles at the team and individual level
> - TSP for Secure Software Development (TSP-Secure)
>   - focus more directly on the security of software applications.

**Approfondimento.** Il **Team Software Process (TSP)**, sviluppato al SEI da Watts Humphrey (il cui lavoro ha posto anche le basi del CMM originale), è un modello di tipo diverso da quelli visti sopra: un **metodo operativo** che dice ai gruppi e ai singoli ingegneri *come* lavorare (pianificare, stimare, misurare i propri difetti, fare revisioni), esattamente le "indicazioni operative" che i CMM di proposito non danno (slide 10). Si basa sul *Personal Software Process* (PSP), in cui ogni sviluppatore misura il proprio tempo e i propri difetti. **TSP-Secure** estende TSP con pratiche di sicurezza, così la sicurezza viene pianificata, costruita e misurata dal gruppo stesso.

### Slide 45 · Team Software Process for Secure SW/Dev

> - TSP-Secure addresses secure software development (three ways).
>   1. Secure software is not built by accident,
>      - Plan: TSP-Secure addresses planning for security.
>      - Self-direct: Since schedule pressures and people issues get in the way of implementing best practices, TSP-Secure helps to build self-directed development teams, and then put these teams in charge of their own work.
>   2. Since security and quality are closely related,
>      - TSP-Secure helps manage quality throughout the product development life cycle.
>   3. Since people building secure software must have an awareness of software security issues,
>      - TSP-Secure includes security awareness training for developers.

**Approfondimento.** Le tre vie, ognuna delle quali risponde a una causa comune di software insicuro:

1. **La sicurezza va pianificata**, non sperata: i compiti di sicurezza ricevono tempo e risorse nel piano come qualunque altro lavoro. E poiché sono le scadenze e la pressione dell'organizzazione a mettere di solito da parte le buone pratiche, TSP affida il piano a **gruppi autogestiti** che sono titolari del proprio lavoro e dei propri impegni, così possono difendere il tempo che serve alla sicurezza (slide 46-47).
2. **La sicurezza segue la qualità**: la maggior parte delle vulnerabilità sono difetti (slide 48), quindi gestire la qualità, misurando e togliendo i difetti in ogni fase, toglie anche le vulnerabilità.
3. **Consapevolezza**: gli sviluppatori non possono evitare vulnerabilità che non conoscono, quindi TSP-Secure li forma (il punto "la conoscenza è cruciale" della Lezione 1, slide 43, e lo scopo di tutto questo corso).

### Slide 46 · TSP-Secure

> - Teams
>   - Develop their own plans
>   - Make their own commitments
>   - Track and manage their own work
>   - Take corrective action when needed

**Approfondimento.** Il gruppo autogestito della slide 45 in quattro verbi. Gli ingegneri che fanno i propri piani e prendono i propri impegni sono realistici sullo sforzo necessario (lavoro di sicurezza compreso) e si sentono responsabili di rispettarli; seguire il proprio lavoro con dei dati (tempo, dimensioni, difetti) permette loro di vedere presto quando restano indietro o quando la qualità cala, e di correggersi da soli, invece di tagliare all'ultimo momento la revisione o il test di sicurezza.

### Slide 47 · TSP-Secure

> - Initial planning - "project launch" (3-4 days)
>   - Tasks include
>     - identifying security risks,
>     - eliciting and defining security requirement, secure design, and code reviews,
>     - use of static analysis tools, unit tests, and Fuzz testing.
> - Next, the team executes its plan, and ensures all security related activities are taking place.
>   - Security status is presented and discussed during every management status briefing.

**Approfondimento.** Un progetto TSP comincia con un **lancio**: un workshop di qualche giorno in cui il gruppo, con la direzione, fissa obiettivi, ruoli e un piano dettagliato. In TSP-Secure il piano contiene esplicitamente i compiti di sicurezza: **identificare i rischi di sicurezza** (modellazione delle minacce, Lezione 12), **requisiti di sicurezza**, **progettazione sicura**, **revisioni del codice**, **analisi statica** (Lezioni 6-7), **unit test** e **fuzz testing** (Lezione 6, slide 25), le stesse attività dell'SDL (Lezione 13, slide 22). Durante l'esecuzione lo stato della sicurezza viene riportato a **ogni** riunione con la direzione, così resta visibile accanto a calendario e costi invece di emergere solo alla fine.

### Slide 48 · TSP-Secure

> - Basis
>   - Defective software is seldom secure
>   - Defective software is not inevitable
>     - Consider cost of reducing defects
>     - Manage defects throughout the lifecycle
>   - Defects are leading cause of vulnerabilities
>     - Use multiple defect removal points in the SD
>       - Defect filters

**Approfondimento.** Il ragionamento dietro TSP-Secure: **la maggior parte delle vulnerabilità sono difetti ordinari** (una lunghezza non controllata è un bug prima di essere un buffer overflow, Lezioni 3-4), quindi un software pieno di difetti è quasi certamente insicuro, e ridurre i difetti riduce le vulnerabilità. I difetti **non sono inevitabili**: si possono gestire come qualunque altra grandezza, misurando dove vengono introdotti e dove vengono tolti, e confrontando il costo di toglierli presto (basso) con quello di toglierli tardi (alto, Lezione 13, slide 16). Il metodo è mettere **diversi punti di rimozione** lungo lo sviluppo del software (la sigla "SD" della slide): revisioni, ispezioni, analisi e test, ciascuno dei quali fa da **filtro** che coglie una parte dei difetti sfuggiti ai precedenti (slide 50).

### Slide 49 · TSP-Secure

> - Key questions in managing defects
>   - What type of defects lead to security vulnerabilities?
>   - Where in the software development life cycle should defects be measured?
>   - What work products should be examined for defects?
>   - What tools and methods should be used to measure the defects?
>   - How many defects can be removed at each step?
>   - How many estimated defects remain after each removal step?
> - TSP-Secure includes training for developers, managers, and other team members.

**Approfondimento.** Le domande trasformano la gestione dei difetti in un'ingegneria fatta di numeri: *quali* tipi di difetti diventano vulnerabilità (cataloghi come CWE rispondono a questo), *dove* misurare (in ogni fase, non solo nei test), *quali prodotti del lavoro* ispezionare (requisiti e progetti oltre al codice), *come* trovare i difetti (revisioni, analisi statica e dinamica, test), e la **resa** di ogni passo: quale frazione dei difetti presenti toglie, e quindi quanti ne restano nel prodotto dopo di esso. Queste stime dicono al gruppo quando la qualità è abbastanza buona per rilasciare. La formazione riguarda **tutti**: anche i dirigenti devono capire perché il tempo della revisione non è tempo sprecato.

### Slide 50 · TSP-Secure

![Lezione 14, pagina 50](L14_p50.webp "50% 1400x961")

**Figura.** Tre riquadri gialli disposti a scala discendente: **Requirements Activities**, **Design Activities**, **Implementation Activities**, ciascuno con una freccia magenta che entra da sinistra. Dopo ogni riquadro una freccia verso il basso passa attraverso un filtro a imbuto segnato con "**%**", che devia una parte del flusso con una freccia verde verso destra e lascia passare il resto al riquadro successivo. Le note verdi dicono: "**Some % of vuls injected during requirements activities are removed during requirements analysis, threat modeling, or developing abuse cases**"; "**Some % of vuls injected during requirements and design activities are removed during design reviews and verification**"; "**Some % of vuls injected during requirements, design, and coding are removed during code reviews, dynamic analysis, static analysis, and testing**". Dopo l'ultimo filtro una freccia rossa punta in basso verso la nota rossa: "**Some % of vuls escape all removal filters and are released with the software.**"

**Approfondimento.** Il **modello a filtri dei difetti** della slide 48. Ogni fase **introduce** vulnerabilità (le frecce magenta: nuovi requisiti, decisioni di progetto e codice portano nuovi errori) ed è seguita da un **filtro di rimozione** che coglie solo una percentuale delle vulnerabilità presenti: analisi dei requisiti, modellazione delle minacce e abuse case dopo i requisiti; revisioni del progetto e verifica dopo la progettazione; revisioni del codice, analisi statica e dinamica e test dopo la codifica. Ogni filtro vede anche le vulnerabilità sfuggite ai precedenti. Ne seguono due conseguenze: nessun filtro da solo basta, quindi un processo sicuro ne richiede **diversi** (la difesa in profondità applicata al processo di sviluppo); e **alcune vulnerabilità sfuggono sempre** nel software rilasciato, quindi la fase di risposta è inevitabile (Lezione 13, slide 25). Con le rese misurate (slide 49), il modello stima perfino quante vulnerabilità restano nel prodotto rilasciato. Riassume la lezione: la sicurezza viene da un processo misurato che toglie le vulnerabilità il prima possibile, non dai soli test alla fine.
`;export{e as default};
