La Lezione 1 prepara il terreno per tutto il corso: perché il software è l'anello più debole della catena della sicurezza, in che cosa un difetto si distingue da una vulnerabilità sfruttabile, e il vocabolario di base (asset, minacce, rischi, contromisure, CIA) usato in tutte le lezioni successive. Le slide sono 63.

## Organizzazione del corso (pagine 1-3)

### Slide 1 · Course website

> Google Classroom code: **xupdavne**
>
> Slides, course info, projects and communications will appear here

**Figura.** Un codice QR che apre il Google Classroom del corso.

**Approfondimento.** Google Classroom è l'unico canale per il materiale del corso: slide, annunci, l'eventuale progetto sul fuzzing e le comunicazioni sugli esami. Ci si iscrive con il codice qui sopra, meglio se con l'account istituzionale della Sapienza, e conviene tenere attive le notifiche via e-mail per non perdere le scadenze dei progetti e gli avvisi sugli appelli.

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

**Figura.** Una foto del docente e un disegno della cifratura simmetrica: il testo in chiaro "Hello!" viene chiuso con una chiave in un testo cifrato illeggibile (una sequenza di simboli casuali), inviato, e riaperto con una chiave fino a tornare "Hello!".

**Approfondimento.** I temi di ricerca della slide sono tutti settori della crittografia moderna:

- **Secure Multi-Party Computation (MPC)**: protocolli che permettono a più parti di calcolare insieme una funzione dei loro input privati (per esempio la media dei loro stipendi) senza rivelare nulla oltre al risultato. Le costruzioni classiche sono i garbled circuit di Yao e il protocollo GMW.
- **Prove Zero-Knowledge (ZK)**: un prover convince un verifier che un'affermazione è vera ("conosco la password", "questa transazione è valida") senza rivelare nient'altro. Una prova ZK deve essere *completa* (un prover onesto convince), *corretta* (un prover che bara non convince) e *zero-knowledge* (il verifier non impara nient'altro). Le varianti succinte e non interattive (zk-SNARK, zk-STARK) sono molto usate nelle blockchain.
- **Applicazioni della blockchain**: smart contract e protocolli decentralizzati, un ambito in cui i bug del software si traducono direttamente in denaro rubato (si vedano le slide 16-17 e 29-31).
- **Schemi di cifratura avanzati**: primitive che vanno oltre la semplice cifratura, come la cifratura omomorfica (calcolare su dati cifrati) e la cifratura basata su attributi o funzionale (diritti di decifratura a grana fine).

Il disegno è il modello da manuale della **cifratura simmetrica**: la stessa chiave segreta cifra e decifra. La crittografia protegge i dati in transito e a riposo ma, come il corso sottolinea, è forte solo quanto il software che la implementa e la usa. Il ricevimento è su appuntamento.

### Slide 3 · About the Exam

> The *exam* is divided into
>
> - A written exam
> - (maybe) a project on fuzzing tools + oral discussion
> - (optional) oral exam -- can influence the final grade positively or negatively

**Approfondimento.**

- Lo **scritto** verifica sia la teoria (definizioni, principi e classificazioni date nelle slide) sia la pratica: leggere codice C, SQL o web, individuare la vulnerabilità, spiegare come si sfrutta e proporre una correzione. Ogni pezzo di codice di questi appunti è analizzato proprio in questo formato.
- Il **fuzzing** è una tecnica di test automatico che dà in pasto a un programma enormi quantità di input malformati, inattesi o casuali e osserva crash, blocchi, asserzioni fallite o segnalazioni dei sanitizer. I fuzzer moderni (AFL/AFL++, libFuzzer, honggfuzz) sono *guidati dalla copertura*: conservano e mutano ancora gli input che raggiungono nuovi percorsi nel codice. Gli strumenti di fuzzing sono trattati nella Lezione 6 (Tools).
- L'**orale facoltativo** può spostare il voto in entrambe le direzioni, quindi conviene sostenerlo solo quando si padroneggia del tutto il materiale.

## Introduzione alla sicurezza del software (pagine 4-6)

### Slide 4 · Frontespizio

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

**Approfondimento.** La sicurezza del software ha una doppia faccia, e il corso si occupa di entrambe.

1. **Il software come fornitore di sicurezza.** Quasi ogni meccanismo di sicurezza è implementato in software: autenticazione e controllo degli accessi nei sistemi operativi e nei database, TLS nelle librerie di rete, librerie crittografiche, firewall, motori antivirus, sandbox, gestori di password.
2. **Il software come fonte di insicurezza.** Lo stesso software può essere sbagliato. Un bug nell'implementazione di un meccanismo di sicurezza può annullare del tutto la protezione: Heartbleed (CVE-2014-0160) era un controllo dei limiti mancante nel codice dell'heartbeat TLS di OpenSSL, che faceva uscire chiavi private e password dalla memoria del server. Un bug in qualunque altro programma può dare a un attaccante un punto d'appoggio.

La seconda metà della slide enuncia l'obiettivo della disciplina: i *principi* (privilegio minimo, difesa in profondità, impostazioni predefinite sicure; Lezione 10), i *metodi* (ciclo di vita dello sviluppo sicuro, modellazione delle minacce, revisione del codice, test di sicurezza) e le *tecnologie* (linguaggi type-safe, analisi statica, fuzzing, protezioni del compilatore e del sistema operativo) che rendono il software più sicuro, insieme alla conoscenza delle *minacce* e delle *vulnerabilità* tipiche (buffer overflow, format string, injection, race condition) e di come evitarle.

Una definizione di lavoro utile, dovuta a Gary McGraw: **la sicurezza del software è l'idea di progettare e costruire il software in modo che continui a funzionare correttamente sotto un attacco malevolo.** La parola chiave è *malevolo*: il test ordinario verifica il comportamento su input normali o casuali, mentre la sicurezza presuppone un avversario intelligente che sceglie di proposito l'input peggiore possibile.

### Slide 6 · Why study Software Security?

> Software plays a major role in providing security, and is a major source of security problems.
>
> Software is the weakest link in the security chain, with the possible exception of "the human factor"
>
> Software security does not get much attention
>
> - in other security courses, or
> - in programming courses, or indeed, in much of the security literature!

**Approfondimento.**

- **Anello più debole.** La sicurezza è una catena: un attaccante non rompe il componente più forte (per esempio AES-256) ma quello più debole. In pratica gli algoritmi crittografici si rompono raramente; quello che si rompe è il software che li circonda: gestione delle chiavi, implementazioni dei protocolli, parsing dell'input, gestione della memoria, controlli di accesso. L'unico serio concorrente al titolo di "anello più debole" è il **fattore umano**: phishing, ingegneria sociale, password deboli o riutilizzate, configurazioni sbagliate.
- **Perché il software è debole.** Il software è enorme (decine di milioni di righe di codice in un sistema operativo o in un browser), complesso, scritto sotto pressione, assemblato da librerie di terze parti e in continuo cambiamento. Steve McConnell (*Code Complete*) riporta una media industriale di circa 1-25 errori ogni 1.000 righe di codice consegnato; anche se solo una piccola parte è sfruttabile, i programmi grandi contengono molte vulnerabilità.
- **Un tema trascurato.** I corsi classici di sicurezza si concentrano su crittografia e sicurezza delle reti; i corsi di programmazione insegnano a far *funzionare* i programmi, non a farli resistere all'*abuso*. Il risultato è che gli sviluppatori continuano a produrre schemi di vulnerabilità ben noti. Questo corso colma la lacuna.

## Il problema (pagine 7-17)

La pagina 7 è il divisore di sezione "The problem".

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

**Approfondimento.**

- **Virus e worm.** Un *virus* si attacca a un ospite (un eseguibile, un settore di avvio, la macro di un documento) e si diffonde solo quando l'ospite infetto viene eseguito o condiviso, quindi ha bisogno di un'azione dell'utente. Un *worm* è un programma autonomo che si diffonde da solo attraverso la rete, di solito sfruttando una vulnerabilità di un servizio di rete: non serve alcuna azione dell'utente, ed è per questo che i worm si diffondono in modo esponenziale. Altre famiglie di malware: *trojan horse* (codice malevolo travestito da programma utile), *ransomware* (cifra i dati e chiede un riscatto), *rootkit* (nasconde la presenza dell'attaccante), *botnet* (una rete di macchine compromesse controllate a distanza).
- **Il worm di Morris (2 novembre 1988).** Scritto da Robert T. Morris, allora dottorando alla Cornell, infettò circa 6.000 dei circa 60.000 host che Internet contava allora (il "10%" della slide). Usava tre vettori:
  1. un **buffer overflow sullo stack** nel demone `fingerd`, che leggeva l'input con `gets()`, una funzione che non controlla mai la dimensione del buffer (proprio il bug della Lezione 3);
  2. il comando `DEBUG` di `sendmail`, che permetteva di eseguire comandi da remoto;
  3. le relazioni di fiducia fra host (`rsh`/`rexec`, i file `.rhosts`) e il tentativo di indovinare le password.

  Un bug nella logica di reinfezione faceva girare sulle macchine molte copie del worm, fino a bloccarle: di fatto un denial of service. Le conseguenze: la prima condanna in base al Computer Fraud and Abuse Act statunitense, e la nascita del CERT/CC alla Carnegie Mellon University per coordinare la risposta agli incidenti.
- **ILOVEYOU (maggio 2000).** Un worm via e-mail in VBScript, il cui allegato `LOVE-LETTER-FOR-YOU.TXT.vbs` contava sul fatto che Windows nascondesse la vera estensione `.vbs`. Una volta aperto, sovrascriveva file e si inviava a tutti i contatti della rubrica di Outlook; si stima che abbia infettato più di dieci milioni di computer in pochi giorni.
- **Anna Kournikova (febbraio 2001).** Stesso meccanismo: un allegato `AnnaKournikova.jpg.vbs` che prometteva una foto della tennista. Era stato prodotto con un "virus construction kit" punta-e-clicca, segno che agli attaccanti non serviva più molta abilità.
- **Slammer (gennaio 2003)** e **Blaster (agosto 2003)**: worm di rete che sfruttavano buffer overflow rispettivamente in Microsoft SQL Server e nel servizio DCOM RPC di Windows (si vedano le slide successive).
- **Underground e commerciali.** Dalla metà degli anni 2000 gli attacchi sono passati da worm rumorosi in cerca di fama a operazioni silenziose a scopo di lucro: botnet affittate per spam e DDoS, furto di credenziali, trojan bancari, ransomware-as-a-service, e mercati che vendono exploit, dati rubati e accessi a reti compromesse. A rigore il *deep web* è qualunque contenuto non indicizzato dai motori di ricerca (anche la propria webmail), mentre questi mercati vivono nel *dark web*, reti overlay come Tor che richiedono un software apposito.

### Slide 9-10 · Slammer Worm (Jan 2002)

> Pictures taken from *The Spread of the Sapphire/Slammer Worm*, by David Moore, Vern Paxson, Stefan Savage, Colleen Shannon, Stuart Staniford, Nicholas Weaver

**Figura.** Due mappe del mondo di CAIDA (www.caida.org). La prima, con l'orario Sat Jan 25 05:29:00 2003 (UTC), riporta "Number of hosts infected with Sapphire: 0". La seconda, mezz'ora dopo (Sat Jan 25 06:00:00 2003 UTC), riporta 74.855 host infetti, disegnati come cerchi blu su tutto il Nord America, l'Europa, l'Asia orientale, l'Australia e il Sud America.

**Approfondimento.**

- **La data.** Il titolo della slide dice gennaio 2002, ma le mappe e tutte le fonti datano l'epidemia al **25 gennaio 2003**, verso le 05:30 UTC.
- **La vulnerabilità sfruttata.** Un **buffer overflow** sullo stack nel *Resolution Service* di Microsoft SQL Server 2000 e di MSDE 2000, in ascolto sulla **porta UDP 1434**. Microsoft aveva pubblicato la patch (bollettino MS02-039) sei mesi prima, nel luglio 2002: la maggior parte delle vittime semplicemente non l'aveva installata.
- **Perché fu così veloce.** L'intero worm stava in un solo payload UDP di 376 byte (404 byte con le intestazioni). UDP non richiede handshake, quindi ogni host infetto mandava copie a indirizzi IP casuali alla massima velocità consentita dal suo collegamento. La popolazione infetta raddoppiava circa ogni **8,5 secondi**, e circa il **90% degli host vulnerabili fu infettato in 10 minuti**: il worm più rapido mai osservato.
- **Gli effetti.** Il worm non aveva un payload distruttivo, ma il suo traffico di scansione saturò le reti: migliaia di bancomat di una grande banca statunitense andarono offline, i sistemi di check-in delle compagnie aeree si bloccarono e il numero di emergenza 911 di Seattle ebbe dei disservizi. Viveva solo in memoria, quindi un riavvio lo eliminava (fino alla reinfezione successiva).
- **Le lezioni.** (1) Un solo bug di memory safety in un servizio esposto alla rete può essere catastrofico. (2) Le patch non servono a nulla se non vengono installate. (3) I servizi non dovrebbero essere raggiungibili da Internet se non è necessario: la porta UDP 1434 non aveva alcun motivo di essere esposta.

### Slide 11 · Famous Vulnerabilities: Cisco Router

> *Cisco Router* (source US-CERT)
>
> Published: 2011-01-24
>
> Vulnerability No: CVE-2011-0352
>
> CVSS Severity Score: 7.88
>
> Vendor/Product: cisco -- linksys\_wrt54gc\_router\_firmware
>
> *Buffer overflow* in the *web-based management interface* on the Cisco Linksys WRT54GC router with firmware before 1.06.1 allows remote attackers to cause a denial of service (device crash) via a long string in a POST request.

**Approfondimento.**

- **Come leggere questi rapporti.** Ogni voce di questa serie segue il formato della National Vulnerability Database (NVD) di US-CERT / NIST:
  - **CVE ID** (Common Vulnerabilities and Exposures, gestito da MITRE): un nome pubblico unico `CVE-<year>-<number>` per una vulnerabilità di un prodotto.
  - **Punteggio CVSS** (Common Vulnerability Scoring System): la gravità da 0.0 a 10.0, calcolata da metriche come il vettore d'attacco, la complessità dell'attacco, i privilegi richiesti, l'interazione dell'utente e l'impatto su riservatezza, integrità e disponibilità. Le fasce di CVSS v3: Low 0.1-3.9, Medium 4.0-6.9, High 7.0-8.9, Critical 9.0-10.0 (CVSS v2, in uso nel 2011, aveva High = 7.0-10.0). I punteggi hanno un decimale: la NVD riporta **7.8** per questa CVE.
  - **Vendor/prodotto**: la stringa che identifica il software colpito.
- **Il bug.** Il web server integrato copia i dati di una richiesta HTTP POST in un buffer di dimensione fissa senza controllarne la lunghezza. Una stringa lunga fa traboccare il buffer, corrompe la memoria adiacente e manda in crash il firmware: un **denial of service**, cioè una violazione della disponibilità. Con un payload costruito con cura, overflow di questo tipo danno spesso l'esecuzione di codice, non solo un crash.
- **Perché i dispositivi embedded.** Router, telecamere e dispositivi IoT eseguono codice C con poche protezioni (spesso senza ASLR né stack canary), vengono aggiornati di rado, e le loro interfacce di gestione a volte sono esposte su Internet.
- **Lo schema vulnerabile tipico e la correzione** (a titolo illustrativo, non il vero codice del firmware):

```c
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
    value[len] = '\0';
    /* ... */
    return 0;
}
```

Le correzioni operative: aggiornare al firmware 1.06.1 o successivo, e non esporre mai l'interfaccia di amministrazione sul lato WAN.

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
> *Integer overflow* in the vorbis\_residue\_decode\_internal function in libavcodec/vorbis\_dec.c in the Vorbis decoder in FFmpeg, possibly 0.6, *has unspecified impact and remote attack vectors*, related to the sizes of certain integer data types. NOTE: this might overlap CVE-2011-0480

**Approfondimento.**

- **Integer overflow.** Il risultato di un'operazione aritmetica non sta nel suo tipo intero. In C l'aritmetica *unsigned* ricomincia da capo modulo 2^n (per un `unsigned int` a 32 bit, 4.294.967.295 + 1 = 0); l'overflow *signed* è comportamento indefinito e in pratica di solito si riavvolge in un numero negativo. Da solo è "solo" un numero sbagliato, ma diventa una vulnerabilità di corruzione della memoria quando il numero sbagliato viene usato come **dimensione, lunghezza o indice**: un calcolo di dimensione che si riavvolge in un valore piccolo porta a un'allocazione troppo piccola seguita da una copia grande (heap overflow); un indice negativo passa sotto un controllo sul limite superiore.
- **Perché i decoder multimediali.** libavcodec di FFmpeg analizza formati binari complessi (qui l'audio Ogg Vorbis) i cui campi di intestazione (conteggi, dimensioni, offset) li sceglie chi ha creato il file. Ogni file multimediale aperto da un player, da un browser o da un generatore di anteprime lato server è input non fidato che arriva dalla rete.
- **Punteggio 9.3 (critico).** Vettore d'attacco remoto, nessuna autenticazione, impatto completo su riservatezza, integrità e disponibilità: un file audio costruito ad arte può potenzialmente eseguire codice dentro il processo di decodifica.
- **Lo schema vulnerabile tipico e la correzione:**

```c
/* count and size are read from the file header: attacker-controlled */
uint32_t count = read_u32(f);
uint32_t size  = read_u32(f);
uint8_t *buf = malloc(count * size);      /* 32-bit product can wrap around to a small value */
for (uint32_t i = 0; i < count; i++)
    fread(buf + (size_t)i * size, 1, size, f);   /* writes far beyond the allocation */
```

```c
/* Fixed: check BEFORE multiplying, and compute the size in size_t */
if (size != 0 && count > SIZE_MAX / size)
    return AVERROR_INVALIDDATA;           /* product would overflow: reject the file */
uint8_t *buf = calloc(count, size);       /* calloc also checks count * size internally */
if (buf == NULL)
    return AVERROR(ENOMEM);
```

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

**Approfondimento.**

- **Che cos'è HID.** I dispositivi USB dichiarano una *classe*. I sistemi operativi si fidano automaticamente dei dispositivi di classe HID (tastiere, mouse), senza installare driver e senza chiedere conferma, perché si presume che una tastiera sia usata dalla persona seduta al computer.
- **L'attacco.** Uno smartphone infettato da malware, collegato "solo per caricarlo", si ridichiara come tastiera e mouse e *digita* comandi alla velocità di una macchina (apre un terminale, scarica ed esegue un payload). Il sistema operativo non può distinguere questi tasti da quelli dell'utente. La ricerca fu presentata a Black Hat DC 2011 da Angelos Stavrou e Zhaohui Wang. È un **difetto di progettazione** (la fiducia implicita in una classe di dispositivi), non un bug di codice.
- **User-assisted** significa che la vittima deve fare qualcosa (qui, collegare il telefono), il che abbassa la gravità ma non la annulla.
- **I discendenti.** USB Rubber Ducky (una chiavetta che inietta sequenze di tasti), *BadUSB* (2014, la riprogrammazione del firmware di normali chiavette USB), cavi malevoli.
- **Contromisure.** Chiedere all'utente di autorizzare i nuovi dispositivi HID (USBGuard su Linux, policy di controllo dei dispositivi su Windows e macOS), bloccare gli schermi incustoditi, usare cavi di sola ricarica o USB data blocker, disattivare le porte USB negli ambienti sensibili.

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

**Approfondimento.**

- **Cookie di sessione e token devono essere imprevedibili.** Dopo il login un'applicazione web riconosce l'utente da un valore casuale (il cookie di sessione); anche i link per reimpostare la password e i token anti-CSRF sono valori casuali. Chi indovina il valore *è* l'utente. Questi valori devono venire da un **generatore di numeri pseudo-casuali crittograficamente sicuro (CSPRNG)** e avere abbastanza entropia (almeno 128 bit).
- **Che cosa è andato storto.** Un generatore di numeri pseudo-casuali (PRNG) è deterministico: dati il seme e lo stato interno, tutta la sequenza in uscita è nota. `srand(seed)` imposta il seme e `rand()` restituisce il numero successivo. Bugzilla generava i suoi token con un PRNG non crittografico che veniva inizializzato troppo di rado, quindi i valori prodotti si potevano prevedere e un attaccante poteva calcolare cookie di login validi per gli account di altri utenti.
- **La lezione.** `rand()`/`srand()` (C, Perl), `java.util.Random`, `Math.random()` (JavaScript) e il modulo `random` di Python vanno bene per simulazioni e giochi, mai per la sicurezza. Si usano `getrandom()` o `/dev/urandom`, `java.security.SecureRandom`, `crypto.getRandomValues()`, il modulo `secrets` di Python.

```c
/* Vulnerable: predictable token */
srand(time(NULL));              /* the seed is the current second: easy to guess */
unsigned token = rand();        /* small range and predictable from the seed */

/* Fixed (Linux): 256 bits from the kernel CSPRNG */
#include <sys/random.h>
unsigned char token[32];
if (getrandom(token, sizeof token, 0) != sizeof token)
    abort();                    /* never fall back to a weak generator */
```

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

**Approfondimento.**

- **La classe del difetto.** Un **difetto di configurazione e di progettazione**, non un bug di memoria: un account root senza password lasciato nel prodotto per il debug, di fatto una backdoor. In termini CWE: uso di credenziali predefinite o scritte nel codice (CWE-1392, CWE-798).
- **L'impatto.** Chiunque raggiunga il dispositivo dalla rete entra come root e lo controlla del tutto, compresi telecamera e microfono di una sala riunioni: un disastro per la riservatezza oltre che per l'integrità.
- **I principi violati.** *Impostazioni predefinite sicure* (un prodotto deve essere sicuro appena installato), *riduzione della superficie d'attacco* (le funzioni di debug non devono uscire attive), *privilegio minimo*. Si veda la Lezione 10 (Design Principles).
- **Una replica su larga scala.** La botnet Mirai (2016) si impadronì di centinaia di migliaia di telecamere e router IoT semplicemente provando via Telnet circa 60 coppie nome utente/password di fabbrica; il suo attacco DDoS al provider DNS Dyn rese irraggiungibili grandi siti web.
- **La correzione.** Nessun account predefinito o nascosto; obbligare l'amministratore a scegliere una password unica al primo avvio; togliere account e interfacce di debug dalle build di produzione; installare il firmware corretto del produttore.

### Slide 16-17 · Famous Vulnerabilities: are they still relevant?

> *These vulnerabilities seem pretty old, do we need to worry in more modern systems?*
>
> https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword=smart+contract

**Figura (pagina 17).** Una schermata dei risultati della ricerca CVE per la parola chiave "smart contract". Ogni riga ha la stessa descrizione: "The mintToken function of a smart contract implementation for *token*, an Ethereum token, has an integer overflow that allows the owner of the contract to set the balance of an arbitrary user to any value."

| CVE | Token Ethereum |
| --- | --- |
| CVE-2018-13780 | ESH |
| CVE-2018-13779 | YLCToken |
| CVE-2018-13778 | CGCToken |
| CVE-2018-13777 | RRToken |
| CVE-2018-13776 | AppleToken |
| CVE-2018-13775 | RCKT\_Coin |
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

**Approfondimento.** Sì, bisogna preoccuparsene: le stesse classi di bug ricompaiono nelle tecnologie nuove. Nel 2018 decine di token Ethereum si rivelarono affetti proprio dall'integer overflow della voce di FFmpeg, questa volta scritto in Solidity.

**Analisi del codice: integer overflow in `mintToken` (Solidity).** I contratti vulnerabili erano copiati da un modello di token comune:

```solidity
// Solidity < 0.8: arithmetic on uint256 wraps around silently
function mintToken(address target, uint256 mintedAmount) onlyOwner public {
    balanceOf[target] += mintedAmount;   // can wrap around modulo 2^256
    totalSupply += mintedAmount;         // can wrap around too
    emit Transfer(0, this, mintedAmount);
    emit Transfer(this, target, mintedAmount);
}
```

- **Vulnerabilità.** Prima di Solidity 0.8, `+`, `-` e `*` su `uint256` si riavvolgono modulo 2^256 senza alcun errore. Scegliendo `mintedAmount = 2^256 - balanceOf[target] + X` il saldo del bersaglio diventa *qualunque* valore X (da qui "set the balance of an arbitrary user to any value"), anche più basso di prima, e anche `totalSupply` si riavvolge, rompendo l'invariante "somma di tutti i saldi = totalSupply".
- **Chi può sfruttarla.** La funzione è `onlyOwner`, quindi l'attaccante è il proprietario del contratto, o chi gli ruba la chiave. Resta comunque una vulnerabilità: chi possiede il token si affida al codice pubblicato per avere la garanzia che il proprietario non possa riscrivere i saldi o gonfiare di nascosto l'offerta.
- **Correzione.** Usare l'aritmetica controllata e porre un tetto all'offerta:

```solidity
pragma solidity ^0.8.0;   // from 0.8, overflow reverts the transaction by default

function mintToken(address target, uint256 mintedAmount) external onlyOwner {
    require(totalSupply + mintedAmount <= MAX_SUPPLY, "cap exceeded");
    balanceOf[target] += mintedAmount;   // reverts on overflow
    totalSupply += mintedAmount;
    emit Transfer(address(0), target, mintedAmount);
}
```

Con i compilatori più vecchi si ottiene lo stesso effetto con la libreria `SafeMath` di OpenZeppelin (`balanceOf[target] = balanceOf[target].add(mintedAmount);`, che annulla la transazione in caso di overflow).

- **Stesso errore, posta più alta.** Il bug "BatchOverflow" (aprile 2018, CVE-2018-10299) del token BeautyChain (BEC) calcolava `uint256 amount = uint256(cnt) * _value;`. Con due destinatari e `_value = 2^255` il prodotto andava in overflow fino a 0, il controllo del saldo `balances[msg.sender] >= amount` passava, e a ciascun destinatario venivano accreditati 2^255 token; gli exchange sospesero le contrattazioni di molti token. Gli smart contract sono pubblici, immutabili una volta pubblicati e custodiscono direttamente denaro: un bug non si può correggere in fretta e viene sfruttato nel giro di poche ore.

## Un'analisi superficiale (pagine 18-24)

La pagina 18 è il divisore di sezione "Superficial analysis".

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

**Approfondimento.**

- Nessuno degli incidenti delle slide precedenti ha richiesto di rompere la crittografia o di superare un firewall: ognuno era un difetto in un programma. Anche il caso USB è un difetto di progettazione nel software del sistema operativo, e il caso Tandberg è un difetto nella configurazione con cui il produttore ha consegnato il prodotto. (FFmpeg, per la precisione, è un framework multimediale per audio e video; libavcodec è la sua libreria di codec.)
- **Le patch sono reattive.** I produttori correggono i bug dopo che sono stati resi pubblici e rilasciano patch (il "Patch Tuesday" mensile di Microsoft, gli aggiornamenti di sicurezza delle distribuzioni Linux, i bollettini di sicurezza di Android). Questo ha tre debolezze strutturali:
  1. la finestra fra la divulgazione e l'installazione della patch è proprio il momento in cui gli attaccanti colpiscono: le patch vengono analizzate a ritroso (*patch diffing*) per localizzare il bug e costruire exploit "N-day" nel giro di giorni o di ore;
  2. molti sistemi non vengono mai aggiornati (dispositivi embedded, server legacy, i server SQL colpiti da Slammer);
  3. le patch possono a loro volta introdurre nuovi bug o rompere delle funzionalità, e per questo gli amministratori le rimandano.
- Le patch continue sono quindi un *sintomo*. La causa di fondo è il software insicuro, che questo corso affronta in fase di progettazione e di scrittura del codice.

### Slide 20-21 · Observation 2

> All these problems are due to (bad) software that
>
> - can be executed over the network (eg. *Slammer worm*)
> - executes on (untrusted) input obtained over the network (eg. *FFmpeg*)
>
> With ever more network connectivity, ever more software can be attacked.

(pagina 21)

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

**Approfondimento.**

- **Due modi in cui la rete raggiunge il software.**
  1. *Servizi raggiungibili direttamente*: il programma è in ascolto su una porta (la UDP 1434 di SQL Server per Slammer, un web server, un demone SSH), quindi qualunque host di Internet può mandargli dei byte.
  2. *Programmi che consumano dati dalla rete*: il programma non è in ascolto, ma elabora dati arrivati dalla rete (un player che decodifica un video scaricato, un browser che disegna una pagina, un lettore PDF, un client di posta che analizza gli allegati). All'attaccante basta che la vittima apra un file o visiti una pagina.
- L'**input non fidato** è qualunque dato il cui contenuto possa essere influenzato, anche in parte, da qualcuno che non è il proprietario del programma: pacchetti di rete, file, URL, campi di un modulo, cookie, variabili d'ambiente, argomenti della riga di comando. La regola d'oro della sicurezza del software è *non fidarsi mai dell'input*: validarlo prima di usarlo (Lezione 5, Input Validation).
- La **superficie d'attacco** è l'insieme di tutti i punti d'ingresso attraverso cui l'input non fidato raggiunge un sistema. Più connettività (cloud, mobile, IoT, API pubbliche) significa una superficie d'attacco più grande. Ridurla (chiudendo porte, disattivando le funzioni inutilizzate, validando l'input in ogni punto d'ingresso) è un principio di progettazione di base.
- **Perché l'attenzione si è spostata.** Le difese tradizionali proteggono il perimetro: aggiornare il sistema operativo, filtrare il traffico con un firewall, controllare i file con un antivirus. Ma un firewall deve lasciar passare il traffico web verso l'applicazione web, e un antivirus non può riconoscere un exploit per un bug sconosciuto. L'attacco passa dalla porta aperta, dritto all'applicazione.
- **Perché le applicazioni web e i browser.** Le applicazioni web sono raggiungibili da chiunque, scritte in fretta in molti linguaggi e framework, e parlano con database e sistemi operativi (SQL injection, XSS, CSRF, command injection). I browser eseguono codice non fidato (JavaScript, WebAssembly) di ogni sito visitato e analizzano decine di formati complessi; sono fra i programmi più attaccati, e quindi più irrobustiti (sandboxing, isolamento dei siti).
- **Mobile ed embedded.** Gli smartphone contengono credenziali, messaggi, posizione e dati di pagamento; i dispositivi embedded e IoT (router, telecamere, automobili, dispositivi medici, controllori industriali) eseguono spesso codice C vecchio, con meccanismi di aggiornamento deboli o assenti.
- **Confini sempre più sfumati.** I browser eseguono applicazioni complete come un sistema operativo; container, macchine virtuali e servizi cloud mescolano i livelli del sistema operativo e della rete; il software-defined networking trasforma i dispositivi di rete in software. La sicurezza non si può più delegare a "il sistema operativo e il firewall": ogni applicazione deve difendersi da sé.

### Slide 22 · Changing the nature of attackers

> - Traditionally, hackers are amateurs motivated by fun, publishing attacks for the prestige
> - Increasingly, hackers are professional
>   - attackers go underground: zero-day exploits are worth money
> - attackers include
>   - organized crime with lots of money and (hired) expertise
> - government agencies: with even more money & in-house expertise
>
>   'Classic' example: *Stuxnet* https://www.ted.com/talks/ralph\_langner\_cracking\_stuxnet\_a\_21st\_century\_cyber\_weapon

**Approfondimento.**

- **Zero-day (0-day).** Una vulnerabilità sconosciuta al produttore (che ha avuto "zero giorni" per correggerla), e l'exploit che la usa. Poiché non esiste una patch, ogni utente è esposto. Una volta resa pubblica e corretta, diventa una vulnerabilità *N-day*.
- **Gli attori della minaccia**, in ordine di risorse crescenti:
  1. *Script kiddie*: poca abilità, strumenti già pronti, bersagli scelti per opportunità.
  2. *Hacktivisti*: motivazioni politiche (defacement, fughe di dati, DDoS).
  3. *Insider*: dipendenti o collaboratori esterni che abusano di un accesso legittimo.
  4. *Criminalità organizzata*: mossa dal profitto; ransomware (spesso gestito come "ransomware-as-a-service" con affiliati), trojan bancari, botnet, frodi, furto di dati da rivendere.
  5. *Attori statali*, spesso chiamati APT (Advanced Persistent Threat): unità di intelligence e militari con grandi budget, sviluppo interno degli exploit e campagne lunghe e silenziose di spionaggio o sabotaggio.
- **Il mercato degli exploit.** *Mercato bianco*: programmi di bug bounty dei produttori e gare come Pwn2Own. *Mercato grigio*: intermediari che comprano exploit e li rivendono, soprattutto ai governi (le prossime due slide). *Mercato nero*: criminali che vendono ad altri criminali.
- **Stuxnet** (scoperto nel giugno 2010) è l'attacco "classico" sponsorizzato da uno Stato. Fu costruito per sabotare l'impianto di arricchimento dell'uranio di Natanz, in Iran:
  - si diffondeva tramite chiavette USB per raggiungere reti non collegate a Internet (air-gapped);
  - usava **quattro zero-day di Windows**, fra cui il difetto dei collegamenti `.LNK` (CVE-2010-2568), che eseguiva codice semplicemente quando veniva visualizzata una cartella, e un bug dello spooler di stampa;
  - i suoi driver erano firmati con **certificati di firma del codice rubati** (a Realtek e JMicron), quindi Windows se ne fidava;
  - il suo payload riprogrammava i **PLC Siemens S7** (controllori logici programmabili) che comandavano le centrifughe, facendole girare a velocità distruttive mentre agli operatori venivano mostrati di nuovo valori normali dei sensori.

  È attribuito di solito a un'operazione congiunta di Stati Uniti e Israele. Ralph Langner, relatore del TED talk citato, fu fra i primi a decifrare il payload per i PLC. Stuxnet mostra che le vulnerabilità del software possono causare danni fisici, e che gli Stati vi investono molto.

### Slide 23-24 · Current 0day prices

**Figura (pagina 23): ZERODIUM Payouts for Desktops/Servers** (listino datato 2019/01, zerodium.com). Legenda: Windows, macOS, Linux/BSD, Any OS. RCE: Remote Code Execution; LPE: Local Privilege Escalation; SBX: Sandbox Escape or Bypass; VME: Virtual Machine Escape. Nota a piè di pagina: "All payouts are subject to change or cancellation without notice. All trademarks are the property of their respective owners."

| Compenso | Exploit |
| --- | --- |
| Up to $1,000,000 | Win RCE Zero Click (Windows) |
| Up to $500,000 | Chrome RCE+LPE (Windows) · Apache RCE (Linux) · MS IIS RCE (Windows) |
| Up to $250,000 | MS Outlook RCE · MS Exchange RCE (Windows) · OpenSSL RCE · PHP RCE (Linux) |
| Up to $200,000 | VMware ESXi VME · Thunderbird RCE (Win/Linux) · Sendmail RCE · Postfix RCE · Dovecot RCE · Exim RCE · nginx RCE (Linux) |
| Up to $100,000 | Safari RCE+LPE (Mac) · Edge RCE+LPE · Firefox RCE+LPE · Word/Excel RCE (Windows) · WordPress RCE · cPanel/WHM RCE · Plesk RCE · Webmin RCE (Linux) |
| Up to $80,000 | VMware WS VME (Win/Linux) · Adobe PDF RCE+SBX · WinRAR RCE · 7-Zip RCE · Windows LPE/SBX (Windows) |
| Up to $50,000 | USB LPE (Win/Mac) · Antivirus RCE · WinZip RCE (Windows) · tar RCE · Linux LPE (Linux) · macOS LPE/SBX (Mac) · BSD LPE (BSD) |
| Up to $10,000 | Routers RCE · Antivirus LPE (Windows) · phpBB RCE · vBulletin RCE · MyBB RCE · Joomla RCE · Drupal RCE · Roundcube RCE · Horde RCE (Linux) |

**Figura (pagina 24): ZERODIUM Payouts for Mobiles** (listino datato 2019/09). Legenda: iOS, Android, Any OS. FCP: Full Chain with Persistence; RCE: Remote Code Execution; LPE: Local Privilege Escalation; SBX: Sandbox Escape or Bypass.

| Compenso | Exploit |
| --- | --- |
| Up to $2,500,000 | Android FCP Zero Click |
| Up to $2,000,000 | iOS FCP Zero Click |
| Up to $1,500,000 | WhatsApp RCE+LPE Zero Click (iOS/Android) · iMessage RCE+LPE Zero Click (iOS) |
| Up to $1,000,000 | WhatsApp RCE+LPE · SMS/MMS RCE+LPE (iOS/Android) |
| Up to $500,000 | Persistence (iOS) · WeChat RCE+LPE · iMessage RCE+LPE (iOS) · FB Messenger RCE+LPE · Signal RCE+LPE · Telegram RCE+LPE · Email App RCE+LPE (iOS/Android) · Chrome RCE+LPE (Android) · Safari RCE+LPE (iOS) |
| Up to $200,000 | Baseband RCE+LPE · LPE to Kernel/Root · Media Files RCE+LPE · Documents RCE+LPE (iOS/Android) · SBX for Chrome · Chrome RCE w/o SBX (Android) · SBX for Safari · Safari RCE w/o SBX (iOS) |
| Up to $100,000 | Code Signing Bypass · WiFi RCE · RCE via MitM · Information Disclosure · \[k\]ASLR Bypass (iOS/Android) · LPE to System · PIN Bypass (Android) · Passcode Bypass · Touch ID Bypass (iOS) |

**Approfondimento.**

- **Chi è Zerodium.** Un'azienda che acquista exploit, fondata nel 2015, che compra exploit zero-day dai ricercatori e li rivende, soprattutto a clienti governativi. Il suo listino pubblico è un buon indicatore di quanto valgono le vulnerabilità sul mercato grigio.
- **Come leggere le tabelle.**
  - *RCE* esegue da remoto codice dell'attaccante sul bersaglio; *LPE* trasforma un accesso limitato in privilegi di amministratore, di root o del kernel; *SBX* evade da una sandbox (browser e app di messaggistica elaborano i contenuti in processi con privilegi ridotti, quindi una RCE da sola non basta); *VME* evade da una macchina virtuale verso l'host.
  - Un attacco reale richiede una **catena**: RCE, poi SBX, poi LPE, spesso con la persistenza. *FCP* (full chain with persistence) è la catena completa, che sopravvive ai riavvii.
  - *Zero click* significa nessuna interazione dell'utente (nessun link da cliccare, nessun file da aprire): l'exploit scatta quando si riceve un messaggio. Sono i più preziosi.
- **Che cosa fa il prezzo.** (1) Il numero di bersagli potenziali (Windows, Chrome, WhatsApp, iOS, Android); (2) quanto è difficile sfruttare il bersaglio, cioè quanto è irrobustito (i sistemi mobili combinano firma del codice, sandboxing, ASLR e altro, quindi le catene funzionanti sono rare); (3) se serve l'interazione dell'utente; (4) affidabilità e furtività dell'exploit.
- Nel listino mobile del 2019 una catena completa per Android ($2.5M) costava più di una per iOS ($2M), segno che allora gli exploit per Android erano più difficili da ottenere, o quelli per iOS più abbondanti.
- **Le conseguenze.** Le vulnerabilità sono una merce: un solo bug di memory safety in un programma molto diffuso può valere milioni di dollari. La sicurezza del software è una corsa agli armamenti economica, e un codice più sicuro alza il costo per l'attaccante. Nel mondo reale: spyware commerciali come Pegasus di NSO Group hanno usato catene zero-click per iMessage; FORCEDENTRY (2021, CVE-2021-30860) cominciava con un integer overflow in un decoder di immagini, la stessa classe di bug della voce di FFmpeg nella slide 12.

## Le cause del problema (pagine 25-45)

La pagina 25 è il divisore di sezione "Causes of the problem".

### Slide 26-28 · Quick poll

> how many of you learned to program in C or C++?
>
> - how many of you have built a web-application?
>
> \- in which languages?
>
> Major causes of problems are
>
> - lack of *awareness*
> - lack of *knowledge*

**Approfondimento.** Il sondaggio vuole arrivare a un punto: la maggior parte dei programmatori impara C o C++ (linguaggi senza memory safety, la patria dei buffer overflow e dei bug di format string) e costruisce applicazioni web (la patria di injection e XSS), ma quasi nessuno impara come questi linguaggi e queste piattaforme cedono sotto attacco.

- **Mancanza di consapevolezza**: gli sviluppatori non si rendono conto che il loro codice può essere attaccato, o di quali parti sono esposte ("chi mai manderebbe un nome utente di 10.000 caratteri?").
- **Mancanza di conoscenza**: anche gli sviluppatori attenti non conoscono le API pericolose (`gets`, `strcpy`, `sprintf`, `system`, SQL costruito concatenando stringhe), le tecniche d'attacco o le alternative sicure.

Entrambe le cause si curano con la formazione, ed è per questo che poco più avanti arriva "First Step: Awareness". I numeri confermano la diagnosi: circa il 70% delle vulnerabilità che Microsoft corregge ogni anno sono bug di memory safety (Microsoft, 2019), con una quota simile fra i bug gravi di Chromium; injection e XSS sono nella OWASP Top 10 dei rischi web fin dalla prima edizione (2003).

### Slide 29-31 · Functionality vs Security

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

**Approfondimento.**

- **Perché la sicurezza passa in secondo piano.** Nessuno compra un software *per* la sua sicurezza: gli utenti comprano funzionalità, e i produttori competono sul time-to-market. La sicurezza è un requisito *non funzionale*, come le prestazioni o l'affidabilità, il cui valore si nota solo quando viene a mancare, mentre i suoi costi (tempo di sviluppo, test, minore comodità) si pagano subito.
- **Compromessi tipici.**
  - *Usabilità contro sicurezza*: password, autenticazione a due fattori, finestre di conferma e scadenze delle sessioni infastidiscono gli utenti; "ricordami" e il login automatico sono comodi ma rischiosi.
  - *Funzionalità contro superficie d'attacco*: ogni plug-in, formato di file, linguaggio di macro o interfaccia di gestione remota è nuova superficie d'attacco (le macro di Office, Flash, le applet Java).
  - *Prestazioni contro controlli*: il C omette i controlli dei limiti degli array per la velocità; gli sviluppatori saltano la validazione o la cifratura "per andare più veloci".
  - *Compatibilità contro sicurezza*: protocolli legacy (SSLv3, SMBv1, NTLM) tenuti in vita per i client vecchi.
- **Gli smart contract come svolta.** Su una blockchain il codice *è* denaro: un contratto custodisce fondi, chiunque può chiamarlo, il suo codice è pubblico, e un exploit è istantaneo e irreversibile. Esempi: **The DAO** (2016, circa 60 milioni di dollari sottratti con un bug di *reentrancy*, che portò alla divisione fra Ethereum ed Ethereum Classic), il **wallet multisig di Parity** (2017: 30 milioni di dollari rubati a luglio, poi centinaia di milioni congelati per sempre a novembre, quando un utente distrusse per sbaglio un contratto di libreria condiviso), e bridge fra catene come **Poly Network** (2021, circa 611 milioni di dollari, un difetto nella logica del contratto) e **Wormhole** (2022, circa 325 milioni di dollari, un bug nella verifica delle firme). Le perdite complessive arrivano a miliardi di dollari, quindi il mondo blockchain investe molto in audit, verifica formale e linguaggi e macchine virtuali più sicuri.

### Slide 32 · Functionality vs Security

> *Functionality* is about what an application **does**.
>
> *Security* is about what an application should **not** do.
>
> Unless you think like an attacker, you will be unaware of any potential threats.

**Approfondimento.** È una delle idee chiave del corso.

- I requisiti funzionali sono *positivi* ("l'utente può trasferire denaro su un altro conto") e si possono verificare con un insieme finito di casi di test: si usa la funzione e si confronta il risultato con quello atteso.
- I requisiti di sicurezza sono per lo più *negativi* ("nessuno può trasferire denaro dal conto di un altro", "nessun input può far eseguire al programma codice dell'attaccante"). Verificare una proprietà negativa significa considerare *tutti* gli input, le sequenze di azioni e gli ambienti possibili, compresi quelli assurdi che nessun utente legittimo produrrebbe mai. Il test può mostrare la presenza di vulnerabilità, mai la loro assenza.
- Da qui la necessità di **pensare come un attaccante** (la mentalità avversaria): per ogni funzione chiedersi "come se ne potrebbe abusare?" (abuse case, modellazione delle minacce, penetration testing). Un programma può essere perfettamente corretto su tutti gli input normali ed essere comunque insicuro per quello che fa *anche* sugli input malevoli: un modulo di login può funzionare benissimo per gli utenti onesti e accettare anche `' OR '1'='1` come password (SQL injection, Lezione 9).

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

**Approfondimento.** La slide elenca gli ambiti in cui la funzionalità ha storicamente battuto la sicurezza così nettamente che la battaglia sembra persa.

- **Sistemi operativi.** Linux offre centinaia di chiamate di sistema e Windows migliaia di funzioni API, più driver e file system; il solo kernel Linux ha più di 30 milioni di righe di codice. Ogni interfaccia raggiungibile da un processo senza privilegi è un potenziale percorso di escalation dei privilegi. Le mitigazioni: installazioni minime, filtraggio delle chiamate di sistema (seccomp), microkernel.
- **Linguaggi di programmazione.**
  - *C e C++*: niente controlli dei limiti, gestione manuale della memoria e funzioni variadiche non controllate come `printf` portano buffer overflow (Lezione 3), bug di format string (Lezione 4), use-after-free e integer overflow. Il programmatore deve azzeccare ogni singolo accesso alla memoria.
  - *Campi pubblici in Java*: rompere l'incapsulamento permette a qualunque codice, compreso quello non fidato che gira nella stessa JVM, di leggere o cambiare lo stato interno e di aggirare la validazione (esempio più sotto).
- **Browser web.** Per anni i plug-in (Adobe Flash, applet Java, controlli ActiveX, lettori PDF) hanno girato con tutti i privilegi dell'utente e sono stati il vettore principale dei "drive-by download". JavaScript e AJAX hanno trasformato il browser in una piattaforma applicativa che esegue codice non fidato di ogni sito. Flash ha raggiunto la fine del supporto il 31 dicembre 2020, e le vecchie interfacce per i plug-in sono state tolte dai browser moderni.
- I **client di posta** visualizzano HTML, eseguono script e macro e mostrano l'anteprima di allegati in formati complessi (documenti Office, PDF, immagini): ILOVEYOU e Kournikova viaggiavano per e-mail.
- **PHP, "un caso disperato".** Molte delle sue scelte di progetto storiche rendevano insicuro il codice scritto in modo naturale:
  - `register_globals` (tolto in PHP 5.4) trasformava ogni parametro della richiesta in una variabile globale, quindi `?authorized=1` poteva impostare un flag `$authorized` non inizializzato (esempio più sotto);
  - `magic_quotes` dava una falsa sensazione di protezione contro la SQL injection;
  - la vecchia API `mysql_*` incoraggiava a costruire le query SQL concatenando stringhe;
  - `include`/`require` che accettavano URL remoti permettevano la remote file inclusion;
  - il confronto lasco `==` con la conversione automatica dei tipi: `"0e1234" == "0e5678"` è vero, perché entrambe le stringhe vengono lette come 0 in notazione scientifica, il che rompe i confronti fra hash ("magic hash");
  - `unserialize()` su dati dell'utente permette la object injection.

  Il PHP moderno ha tolto o deprecato quasi tutte queste cose, ma il codice legacy è ovunque.

**Analisi del codice: campi pubblici in Java.**

```java
public class Account {
    public int balance;                                   // anyone can write: acc.balance = 1_000_000;
    public static final String[] ADMINS = {"alice"};      // final reference, but mutable contents!
}
```

- *Vulnerabilità.* Qualunque classe può leggere o scrivere `balance`, quindi non si può far rispettare nessun invariante (saldo mai negativo, modifiche solo con operazioni autorizzate). `final` congela solo il riferimento: `Account.ADMINS[0] = "mallory";` funziona lo stesso.
- *Correzione.* Incapsulare lo stato: campi privati, metodi che validano, collezioni immutabili.

```java
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
```

**Analisi del codice: `register_globals` in PHP.**

```php
<?php
// With register_globals = On, the request "page.php?authorized=1" creates $authorized = "1"
if (check_password($_POST['user'], $_POST['pass'])) {
    $authorized = true;
}
if ($authorized) {          // never initialised: controlled by the attacker
    show_admin_panel();
}
```

- *Vulnerabilità.* L'attaccante imposta `$authorized` dall'URL e salta del tutto il controllo della password.
- *Correzione.* Inizializzare sempre le variabili (`$authorized = false;` in cima), leggere l'input solo esplicitamente da `$_GET`/`$_POST`, e non usare mai `register_globals` (l'opzione non esiste più da PHP 5.4).

### Slide 34 · First Step: Awareness

> - that there might be a problem
> - of what needs protecting, from which threats
> - of the fact that you might lack knowledge

**Approfondimento.** La consapevolezza ha tre livelli, uno per punto della slide:

1. *Ci potrebbe essere un problema*: accettare che il proprio software può essere attaccato, e lo sarà. "Nessuno si prenderebbe la briga di attaccarci" è falso: gli scanner automatici sondano ogni host esposto su Internet entro pochi minuti dalla sua accensione.
2. *Che cosa va protetto, e da quali minacce*: identificare asset e minacce prima di scegliere le contromisure. È la modellazione delle minacce (si veda "Security concepts" alla fine di questa lezione).
3. *Potrebbero mancarti delle conoscenze*: conoscere i limiti della propria competenza; usare librerie collaudate invece di crittografia o parser fatti in casa, chiedere revisioni, tenersi aggiornati (OWASP, CWE Top 25, gli standard di programmazione sicura SEI CERT).

### Slide 35-36 · Weakness in depth

**Figura (pagina 35).** Un'immagine a strati dell'ambiente in cui gira un'applicazione. In alto un riquadro arancione, "**interpretable** or **executable** input data, eg paths, filenames, .doc, .xls, .pdf, .js, ...", con una grossa freccia nera che punta dentro l'**application**. L'applicazione sta dentro una nuvola verde con l'etichetta **programming languages**, che contiene anche **middleware**, **webbrowser with plugins**, **platform (eg Java or .NET)**, **libraries**, un **sql database** (disegnato come un cilindro), l'**operating system** e le **system APIs**. Sotto tutto c'è l'**hardware (incl network card & peripherals)**.

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

**Approfondimento.**

- Il titolo gioca sulla **difesa in profondità** (più livelli di protezione indipendenti, in modo che un singolo cedimento non sia fatale). Qui la situazione è rovesciata: **debolezza in profondità**. Ogni livello sotto l'applicazione può contenere vulnerabilità, e l'applicazione le eredita tutte. Un'applicazione perfetta su una libreria, un sistema operativo o una CPU vulnerabili non è sicura: Heartbleed (la libreria OpenSSL, 2014), Log4Shell (la libreria di logging Log4j, CVE-2021-44228), Spectre e Meltdown (il processore stesso, 2018).
- **Input che viene interpretato o eseguito.** Il riquadro arancione è il punto cruciale: l'input non è "solo dati". Percorsi e nomi di file vengono interpretati dal file system (`../../etc/passwd`, path traversal); i documenti (.doc, .xls, .pdf) possono contenere macro e script; `.js` *è* codice. Ogni volta che l'input raggiunge un interprete (motore SQL, shell, motore HTML/JavaScript, parser XML), un attaccante può provare a fargli trattare una parte dei dati come comandi. È la radice di ogni **attacco di injection** (Lezione 5, Input Validation; Lezione 9, SQL Injection).
- **Linguaggi complicati.** Una tipica applicazione web mescola C (il web server), Java, PHP o Python, SQL, HTML, JavaScript, CSS, XML o JSON, script di shell ed espressioni regolari. Ogni linguaggio ha i suoi caratteri speciali e le sue regole di parsing, e gli errori nascono ai confini fra un linguaggio e l'altro.
- **Gli strumenti.** I compilatori possono eliminare codice di sicurezza: un ottimizzatore può cancellare una `memset` che azzera una password (il buffer non viene più letto) o un controllo di overflow che si basa su un comportamento indefinito. Gli strumenti di build e le dipendenze possono essere compromessi (*supply-chain attack*: SolarWinds Orion nel 2020, la backdoor di xz-utils nel 2024). I "dynamic code downloads" (plug-in, aggiornamenti automatici, script caricati da server di terze parti) eseguono codice che nessuno ha revisionato. La lezione del Turing Award di Ken Thompson, *Reflections on Trusting Trust* (1984), descrive un compilatore che inserisce una backdoor nei programmi che compila, e nelle nuove versioni di se stesso.

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

**Approfondimento.**

- **Un vocabolario preciso.**
  - *Errore* (error, mistake): l'azione umana che produce un risultato sbagliato (il programmatore scrive `<=` invece di `>=`).
  - *Difetto* (defect, bug, fault): il codice sbagliato che ne risulta.
  - *Malfunzionamento* (failure): il comportamento sbagliato osservabile quando il codice difettoso viene eseguito.
  - *Debolezza* (weakness, flaw): un difetto, una scelta di progetto o una configurazione che *potrebbe* contribuire a un problema di sicurezza. Il **CWE** (Common Weakness Enumeration) di MITRE cataloga i *tipi* di debolezza, per esempio CWE-787 Out-of-bounds Write, CWE-89 SQL Injection, CWE-79 Cross-site Scripting.
  - *Vulnerabilità*: una debolezza in un prodotto specifico che un attaccante può davvero raggiungere e sfruttare per violare la politica di sicurezza. L'elenco **CVE** di MITRE dà un nome alle singole vulnerabilità: CVE-2011-0352 (slide 11) è un buffer overflow concreto, un'istanza del tipo di debolezza CWE-120, Buffer Copy without Checking Size of Input.
  - *Exploit*: l'input, il codice o la procedura che attiva una vulnerabilità per raggiungere l'obiettivo dell'attaccante.
- **Accessibile e sfruttabile.** Un buffer overflow in una funzione che elabora sempre e solo una stringa costante è un difetto ma non una vulnerabilità: l'attaccante non può raggiungerlo. Un bug che richiede un input di 10 GB in un servizio che accetta al massimo 1 KB non è sfruttabile. Ma la raggiungibilità cambia nel tempo: un codice sicuro oggi diventa vulnerabile quando qualcuno, più avanti, lo collega a un input che arriva dalla rete. Per questo le debolezze vanno corrette anche quando non si conosce alcun exploit.
- **La politica.** "Violare una politica" lega la definizione agli obiettivi di sicurezza: una vulnerabilità è sempre relativa a quello che il sistema dovrebbe garantire (riservatezza, integrità, disponibilità; si veda la fine di questa lezione).

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

**Approfondimento.**

- **Difetti di progettazione** (architetturali): la specifica o l'architettura è insicura in sé, quindi anche un'implementazione perfetta è vulnerabile. Esempi: un protocollo senza autenticazione (Telnet; la cifratura Wi-Fi WEP con vettori di inizializzazione riutilizzati), la fiducia nel client (un prezzo calcolato nel browser e mandato al server), password salvate in chiaro, la fiducia implicita nelle tastiere USB della slide 13, controlli di autorizzazione mancanti per progetto. Correggere un difetto di progettazione spesso significa riprogettare, il che è costoso; per trovarlo servono l'analisi del rischio architetturale e la modellazione delle minacce.
- **Bug di implementazione** (a livello di codice): il progetto è valido ma il codice è sbagliato: un controllo dei limiti mancante (buffer overflow), un controllo dell'input dimenticato, la concatenazione di stringhe in una query SQL, una race condition. Spesso si trovano con la revisione del codice, l'analisi statica, il test e il fuzzing.
- *Altrettanto comuni*: Gary McGraw (*Software Security: Building Security In*) stima che all'incirca metà dei problemi di sicurezza siano difetti di progettazione e metà bug. Gli strumenti automatici sono bravi a trovare i bug e scarsi nel trovare i difetti di progettazione.
- **Altre origini.**
  - *Difetti di configurazione*: software sicuro installato in modo insicuro: password predefinite, modalità di debug lasciata attiva in produzione, permessi sui file troppo larghi o bucket di storage cloud aperti a tutti, servizi inutili attivi, impostazioni TLS superate. "Security misconfiguration" è una categoria della OWASP Top 10.
  - *Difetti "dell'utente"*: utenti che scelgono password deboli, ignorano gli avvisi sui certificati, cadono nel phishing, disattivano le funzioni di sicurezza. Una buona progettazione li riduce (impostazioni predefinite sicure, sicurezza usabile).
  - *Conseguenze impreviste di funzionalità volute*: la funzione fa esattamente ciò per cui è stata progettata, ma se ne abusa. L'e-mail è stata progettata per una consegna aperta, e lo spam ne è la conseguenza. Altri esempi: una pagina "password dimenticata" che rivela quali nomi utente esistono (enumerazione degli account), redirect aperti usati nel phishing, "invia questa pagina a un amico" trasformato in un relay di spam, resolver DNS aperti usati per amplificare gli attacchi DDoS.

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

**Approfondimento.**

- **Tipo 1: difetti visibili nel testo del programma.** Errori di logica: il solo codice sorgente mostra che il programma fa la cosa sbagliata, indipendentemente dalla macchina su cui gira. Un classico off-by-one:

```c
char buf[10];
for (int i = 0; i <= 10; i++)   /* off-by-one: the loop runs 11 times */
    buf[i] = 'A';               /* buf[10] is one element past the end */

/* Fix: for (int i = 0; i < 10; i++), or better i < sizeof buf */
```

Altri esempi di tipo 1: condizioni invertite, la variabile sbagliata, un `break` mancante in uno `switch`, `=` scritto al posto di `==`. La revisione del codice e il test ordinario li trovano.

- **Tipo 2: difetti dovuti all'interazione con la piattaforma o con altri sistemi.** Il programma sembra corretto al livello astratto ("copia il nome nel buffer", "somma i due importi", "cerca l'utente nel database"), ma la piattaforma sottostante non si comporta come l'astrazione:
  - *Buffer overflow in C/C++*: gli array C non portano con sé i propri limiti, e scrivere oltre la fine sovrascrive in silenzio la memoria adiacente (altre variabili, indirizzi di ritorno salvati). Per capirlo bisogna conoscere la disposizione della memoria di un processo (Lezione 3).
  - *Integer overflow/underflow*: gli interi matematici sono illimitati, quelli della macchina no (32 o 64 bit, complemento a due). Java e C# per impostazione predefinita si riavvolgono in silenzio; Python ha interi illimitati; Rust va in panic sull'overflow nelle build di debug e si riavvolge nelle build di release, a meno di usare le operazioni controllate.
  - *SQL injection, XSS (Cross-Site Scripting) e CSRF (Cross-Site Request Forgery) nelle applicazioni web*: il problema compare al confine fra l'applicazione e un altro sistema. Nell'injection i dati dell'utente passano in un altro linguaggio (SQL per il database, HTML/JavaScript per il browser) e vengono interpretati come codice. Il CSRF sfrutta il fatto che i browser allegano i cookie in automatico: un sito malevolo fa mandare al browser della vittima una richiesta autenticata verso un altro sito in cui la vittima ha fatto il login.

  Questi difetti sono "di livello più basso" e più difficili da vedere: bisogna capire la semantica della piattaforma, non solo il programma.

### Slide 40-42 · Spot the security flaws

Il codice di pagina 40, trascritto dall'immagine della slide:

```c
int balance;

void decrease(int amount)
{   if (balance <= amount)
        { balance = balance - amount; }
    else { printf("Insufficient funds\n"); }
}

void increase(int amount)
{   balance = balance + amount;
}
```

(Nella slide la stringa usa virgolette tipografiche e il segno meno è un trattino lungo; in un vero programma C devono essere i caratteri ASCII `"` e `-`.)

Le annotazioni del docente a pagina 41:

> - on `if (balance <= amount)`: *should be >=*
> - on `decrease(int amount)`: *what if amount is negative?*
> - on `balance = balance + amount;`: *what if the sum is too large for an int?*

La classificazione del docente a pagina 42 (nella slide la prima nuvoletta dice "should be >)", un refuso per ">="):

> - *should be >=*: 1. Logic error. *Can be found by code inspection only*
> - *what if amount is negative?*: 2. Lack of input validation of (untrusted) user. *Design flaw or implementation flaw?*
> - *what if the sum is too large for a 64 bit int?*: 3. Problem with interaction with underlying platform. *lower level than previous ones*

**Analisi del codice.**

*Che cosa fa il codice.* Una variabile globale `balance` rappresenta un conto in banca; `decrease` dovrebbe prelevare `amount` quando i fondi sono sufficienti, `increase` versa `amount`.

*Difetto 1: errore di logica (condizione invertita).* Il prelievo avviene solo quando `balance <= amount`, cioè proprio quando il conto **non** ha abbastanza soldi, e viene rifiutato quando li ha. Con `balance = 100`, `decrease(500)` lascia un saldo di -400, mentre `decrease(50)` stampa "Insufficient funds". La condizione deve essere `balance >= amount`. L'errore si vede leggendo il codice (un difetto di tipo 1 della slide 39): una revisione del codice o un solo unit test lo trovano.

*Difetto 2: validazione dell'input mancante (importi negativi).* Niente controlla che `amount > 0`. Anche con il difetto 1 corretto:

- `decrease(-1000)`: il test `balance >= -1000` passa e `balance - (-1000)` *aggiunge* 1000. Un "prelievo" che crea denaro.
- `increase(-1000)`: un "versamento" che preleva in silenzio, aggirando il controllo dei fondi e portando il saldo sotto zero.

Se `amount` arriva da un utente (un modulo web, una chiamata API), lo controlla l'attaccante. Difetto di progettazione o di implementazione? Entrambe le risposte si possono sostenere, ed è proprio il senso della domanda della slide: è un difetto di *progettazione* se la specifica non ha mai detto che gli importi devono essere positivi (un requisito mancante); è un difetto di *implementazione* se la specifica lo diceva e il programmatore ha dimenticato il controllo. Passare semplicemente a un tipo senza segno non è una cura: gli input negativi diventerebbero enormi valori positivi riavvolti.

*Difetto 3: integer overflow (interazione con la piattaforma).* `int` ha una dimensione fissa: 32 bit su tutte le piattaforme diffuse, quindi `INT_MAX` vale 2.147.483.647, e anche un intero a 64 bit ha un massimo, come sottolinea la slide. Se `balance + amount` supera il massimo, l'overflow con segno in C è **comportamento indefinito**; in pratica il risultato si riavvolge in un grande numero negativo. Un grosso versamento può quindi trasformare un conto ricco in un debito, e anche `balance - amount` con un `amount` negativo può andare in overflow. Il codice sorgente è matematicamente corretto; il difetto compare solo quando si sa come si comportano gli interi della macchina (un difetto di tipo 2, "di livello più basso").

*Altri problemi (oltre la slide).*

- **Nessuna segnalazione degli errori**: `decrease` restituisce `void`, quindi chi la chiama non può sapere se il prelievo è avvenuto.
- **Race condition**: `balance` è una variabile globale condivisa. Se due thread eseguono `decrease` nello stesso momento, entrambi possono superare il controllo prima che uno dei due sottragga (una race *check-then-act*), spendendo due volte gli stessi soldi; neanche `balance = balance + amount` è atomica. Si veda la Lezione 11 (Race Conditions).
- **Denaro in un `int`**: gli importi richiedono un'unità ben definita (per esempio i centesimi in un intero a 64 bit) o un tipo decimale, mai la virgola mobile.
- La `printf` è sicura perché la sua format string è una costante (si confronti la Lezione 4, Format Strings).

*Versione corretta.*

```c
#include <limits.h>
#include <stdbool.h>
#include <stdio.h>

static long long balance = 0;       /* in cents; not visible outside this file */

/* Returns true on success, false if the request is rejected. */
bool decrease(long long amount)
{
    if (amount <= 0) {              /* flaw 2: validate the untrusted input */
        fprintf(stderr, "Invalid amount\n");
        return false;
    }
    if (balance < amount) {         /* flaw 1: proceed only if balance >= amount */
        printf("Insufficient funds\n");
        return false;
    }
    balance -= amount;              /* safe: 0 < amount <= balance, no underflow */
    return true;
}

bool increase(long long amount)
{
    if (amount <= 0) {              /* flaw 2 */
        fprintf(stderr, "Invalid amount\n");
        return false;
    }
    if (balance > LLONG_MAX - amount) {   /* flaw 3: test BEFORE adding */
        fprintf(stderr, "Amount too large\n");
        return false;
    }
    balance += amount;
    return true;
}
```

Note sulla correzione:

- Il test di overflow è riscritto come `balance > LLONG_MAX - amount` invece di `balance + amount > LLONG_MAX`, perché quest'ultimo andrebbe in overflow prima di fare il confronto. GCC e Clang offrono anche `__builtin_add_overflow(balance, amount, &result)`, che esegue la somma e segnala se è andata in overflow.
- In un programma multi-thread entrambe le funzioni devono anche tenere un lock (per esempio un `pthread_mutex_t`) attorno al controllo e all'aggiornamento, in modo che controllo e aggiornamento avvengano in modo atomico.

### Slide 43 · Tackling software security

> To prevent standard mistakes, knowledge is crucial
>
> - mistakes may depend on the programming language, on the platform (Op.Sys., DB, Web app, ...) and on the (type of) application
>
> but knowledge alone is not enough: security must be taken into account from the beginning and throughout the software development life cycle

**Approfondimento.**

- **La conoscenza dipende dal contesto.** Un programmatore C deve conoscere buffer overflow e format string; un programmatore Java la deserializzazione e la reflection; uno sviluppatore web injection, XSS, CSRF e gestione delle sessioni; uno sviluppatore mobile la conservazione insicura dei dati e la comunicazione fra app; uno sviluppatore di smart contract la reentrancy e l'integer overflow. Fonti di riferimento: la CWE Top 25 Most Dangerous Software Weaknesses, la OWASP Top 10 (web) e la OWASP Mobile Top 10, gli standard di programmazione SEI CERT per C, C++ e Java.
- **Perché la conoscenza non basta.** Uno sviluppatore che conosce ogni trappola può comunque costruire un sistema insicuro se la sicurezza non è mai stata progettata: requisiti mancanti (chi può accedere a che cosa?), un'architettura senza confini di fiducia, nessun test degli abuse case. La sicurezza è una proprietà dell'intero sistema e dell'intero processo.
- **Il costo delle correzioni tardive.** Più tardi si trova un difetto, più costa: un difetto scoperto in progettazione costa una frazione di uno trovato dopo il rilascio, che porta con sé patch, risposta agli incidenti e danni alla reputazione. Da qui lo "**shift left**": spostare le attività di sicurezza il prima possibile nell'**SDLC** (Software Development Life Cycle: requisiti, progettazione, implementazione, test, rilascio, manutenzione).

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

**Approfondimento.** I sette passi descrivono il percorso di maturazione che i grandi produttori hanno davvero seguito. Microsoft è il caso da manuale: dopo i worm del 2001-2003 (Code Red, Nimda, Slammer, Blaster), il memo di Bill Gates sul *Trustworthy Computing* (gennaio 2002) portò al **Microsoft Security Development Lifecycle (SDL)**, obbligatorio per i suoi prodotti dal 2004.

1. *Non fare nulla, correggere quando si rompe* ("penetrate and patch"): puramente reattivo; i clienti fanno da tester.
2. *Patch regolari*: un processo organizzato di patch (Patch Tuesday, aggiornamenti automatici). Ancora reattivo.
3. *Penetration testing*: esperti di sicurezza attaccano il prodotto finito prima del rilascio. Utile, ma arriva tardi, è costoso e trova solo un campione dei problemi.
4. *Analisi statica*: strumenti che scandiscono il codice sorgente alla ricerca di schemi di bug noti (Lezione 6, Tools; Lezione 7, Program Analysis). Scala bene e può girare a ogni commit, al prezzo di falsi positivi e falsi negativi.
5. *Formazione*: si scrivono meno bug fin dall'inizio.
6. *Abuse case e test di sicurezza*: pensare, già al livello dei requisiti, a come si può abusare di ogni funzione, e trasformarlo in test.
7. *Sicurezza prima dello sviluppo*: requisiti di sicurezza, modellazione delle minacce e progettazione sicura (Lezione 12, Secure Software Design; Lezione 13, Security Engineering for Software).

Ogni passo sposta la sicurezza più indietro nel ciclo di vita; le organizzazioni mature fanno tutti e sette insieme. Modelli di maturità come **BSIMM** (Building Security In Maturity Model) e **OWASP SAMM** (Software Assurance Maturity Model) misurano quanto un'organizzazione è avanti.

### Slide 45 · Security in Software Development Life Cycle

**Figura.** Sei prodotti dello sviluppo disegnati come riquadri lungo una linea, nell'ordine dello sviluppo: **Requirements and use cases**, **Architecture and design**, **Test plans**, **Code**, **Tests and test results**, **Feedback from the field**. Una grande freccia circolare dietro di loro indica che il ciclo si ripete. Frecce dall'alto collegano un'attività di sicurezza a ciascun prodotto:

| Prodotto | Attività di sicurezza che vi puntano |
| --- | --- |
| Requirements and use cases | Abuse cases, Security requirements |
| Architecture and design | Risk analysis (dal confine fra requisiti e progetto in poi), External review |
| Test plans | Risk-based security tests |
| Code | Code review (tools) |
| Tests and test results | Risk analysis, Penetration testing |
| Feedback from the field | Penetration testing, Security operations |

**Approfondimento.** È il modello dei **sette touchpoint** di Gary McGraw (*Software Security: Building Security In*, 2006). Invece di un processo di sicurezza separato, un piccolo insieme di attività di sicurezza viene agganciato ai prodotti che ogni processo di sviluppo genera già, a cascata o agile che sia. McGraw ordina i touchpoint per efficacia:

1. **Code review (strumenti)**: analisi statica più revisione manuale, per trovare i bug di implementazione.
2. **Analisi del rischio architetturale**: trovare i difetti di progettazione analizzando le minacce contro l'architettura e il loro impatto.
3. **Penetration testing**: attaccare il sistema in funzione come farebbe un attaccante, guidati dall'analisi del rischio.
4. **Test di sicurezza basati sul rischio**: piani di test mirati ai rischi più alti (white-box), non solo alle funzionalità.
5. **Abuse case**: descrivere come un attaccante può abusare del sistema ("come attaccante, voglio ..."), il lato oscuro degli use case.
6. **Requisiti di sicurezza**: requisiti espliciti come "le password sono salvate con un hash lento e con salt" o "ogni accesso a una cartella clinica viene registrato".
7. **Security operations**: monitoraggio, logging e risposta agli incidenti, riportando nello sviluppo le lezioni degli attacchi reali.

L'*external review* (l'analisi fatta da persone esterne al gruppo di progetto) è un touchpoint in più, perché un gruppo interno condivide gli stessi punti ciechi. La freccia circolare dice che ciò che si impara in esercizio alimenta l'iterazione successiva.

## Concetti di sicurezza (pagine 46-63)

La pagina 46 è il divisore di sezione "Security concepts".

### Slide 47 · Security and software

> - Security is about regulating access to assets
>
> \- eg. information or functionality
>
> - Software provides functionality
>
> \- eg on-line exam results
>
> - This functionality comes with certain risks
>
> \- eg what are risks of on-line exam results?
>
> - Software security is about managing these risks

**Approfondimento.**

- **Asset**: tutto ciò che ha valore per uno stakeholder e va protetto: dati (voti, dati personali, credenziali), funzionalità (la possibilità di pubblicare i voti), risorse (tempo di CPU, banda, spazio di archiviazione), e anche la reputazione.
- **I rischi dei risultati d'esame online** (la domanda della slide), ordinati per obiettivo di sicurezza:
  - *Riservatezza*: altre persone vedono il tuo voto (una violazione della privacy, e del GDPR); i risultati di tutti gli studenti si possono enumerare cambiando la matricola nell'URL (un *insecure direct object reference*).
  - *Integrità*: uno studente o un estraneo cambia i voti (SQL injection in un modulo, credenziali del docente rubate, una richiesta "pubblica il voto" falsificata con un CSRF).
  - *Disponibilità*: il sito non funziona il giorno in cui escono i risultati (un attacco DoS, o semplicemente il sovraccarico).
  - *Accountability*: chi ha inserito o cambiato un voto, e può negarlo in seguito?
- **Gestire il rischio** non significa eliminarlo. Di solito il rischio si stima come probabilità × impatto, e l'obiettivo è portarlo a un livello accettabile a un costo accettabile (slide 50).

### Slide 48 · Security concepts (schema)

**Figura.** Una mappa concettuale di come le nozioni di sicurezza si collegano fra loro. Il lato di chi difende è scritto in nero (**owners**, **countermeasures**, **availability/usefulness**, **assets**), il lato dell'attacco o negativo in rosso (**attackers**, **threats**, **vulnerabilities**, **risks**). Tutte le frecce dello schema:

| Da | Relazione | A |
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

Un'icona arancione a forma di "ciclo" sta fra countermeasures e vulnerabilities, e segna l'anello: le contromisure possono avere vulnerabilità, che richiedono nuove contromisure.

**Approfondimento.** Lo schema adatta il modello dei concetti di sicurezza dei **Common Criteria** (ISO/IEC 15408), lo standard internazionale per la valutazione della sicurezza dei prodotti informatici. Letto come un racconto:

- I **proprietari** danno valore ai loro **asset** e vogliono che siano il più possibile disponibili e utili. Ma l'utilità stessa *aumenta il rischio*: più un sistema è raggiungibile, connesso e ricco di funzioni, più se ne può abusare. Un computer spento e sepolto nel cemento è perfettamente sicuro e perfettamente inutile.
- Gli **attaccanti** vogliono abusare degli asset e *danno origine* a **minacce** (azioni dannose potenziali). Le minacce *sfruttano* le **vulnerabilità**, e così creano **rischi** per gli asset.
- I proprietari *impongono* **contromisure** per ridurre i rischi. Ma le contromisure sono a loro volta sistemi (di solito software) e *possono avere* vulnerabilità, che *richiedono* altre contromisure: un ciclo senza fine. I motori antivirus, per esempio, analizzano ogni file non fidato con privilegi elevati e sono stati a loro volta sfruttati (si notino le righe "Antivirus RCE/LPE" nella tabella di Zerodium della slide 23).
- Il **rischio** combina la probabilità che una minaccia sfrutti una vulnerabilità con l'impatto sull'asset. Una vulnerabilità che nessuna minaccia può raggiungere, o un asset senza valore, comportano poco rischio.

La sicurezza è quindi un **equilibrio**: massimizzare l'utilità e minimizzare il rischio tirano in direzioni opposte (slide 29-31).

### Slide 49 · Security concepts (inventario)

> Any discussion of security should start with an inventory of
>
> - the *stakeholders*,
> - their *assets*, and
> - the *threats* to these assets by possible attackers
> - employees, clients, script kiddies, criminals
>
> Any discussion of security without understanding these issues is *meaningless*

**Approfondimento.**

- **Stakeholder**: chiunque abbia un interesse nel sistema: proprietari, utenti, clienti, amministratori, sviluppatori, autorità di controllo, e i terzi i cui dati vengono trattati. Stakeholder diversi hanno obiettivi diversi, a volte in conflitto: una banca vuole registrare ogni transazione, i suoi clienti vogliono la privacy.
- Gli **asset** di ciascuno stakeholder (slide 47).
- **Minacce e attaccanti.** L'ultimo punto elenca i possibili attaccanti, ciascuno con capacità e motivazioni diverse:
  - i *dipendenti* (insider): hanno già accesso e conoscenze, e spesso sono i più pericolosi;
  - i *clienti*: utenti legittimi che cercano di ottenere più di quanto spetta loro (manomettendo prezzi, quote, dati di altri utenti);
  - gli *script kiddie*: poco abili e opportunisti, usano strumenti già pronti;
  - i *criminali*: abili e mossi dal profitto.

  Dichiarare da quali di loro ci si difende è il **modello dell'attaccante** (o modello delle minacce).
- *Senza senso*: "questo sistema è sicuro?" non ha risposta senza "sicuro **contro chi**, a protezione di **che cosa**, **per chi**?". Un sistema sicuro contro gli script kiddie può cadere davanti a uno Stato; una cifratura che protegge i dati dagli estranei non serve a nulla contro un amministratore malevolo. Questo inventario è il primo passo della **modellazione delle minacce** (per esempio STRIDE, slide 56; gli attack tree), sviluppata nelle lezioni sulla progettazione.

### Slide 50 · Security concepts (politica e meccanismi)

> Security is about imposing countermeasures to reduce risks to assets to acceptable levels
>
> - A *security policy* is a specification of what *security requirements/goals* the countermeasures are intended to achieve
>   - secure against what and from whom?
> - *Security mechanisms* to enforce the policy
> - Bottlenecks:
>   - expressing what we (don't) want in a policy
>   - enforcing this, dynamically or statically

**Approfondimento.**

- **Livelli accettabili.** La sicurezza perfetta non esiste, e avvicinarsi a essa costerebbe troppo. I quattro modi classici di trattare un rischio: *ridurlo* (contromisure), *trasferirlo* (assicurazioni, esternalizzazione), *evitarlo* (rinunciare alla funzione rischiosa), *accettarlo* (consapevolmente, quando la protezione costerebbe più della perdita attesa).
- **Politica e meccanismo.** La *politica* dice **che cosa** deve valere ("solo il titolare del conto può leggerne gli estratti", "gli studenti leggono i propri voti, i docenti scrivono i voti dei propri corsi"). Il *meccanismo* dice **come** la si fa rispettare (password, liste di controllo degli accessi, cifratura, controllo dei tipi, sandboxing). Tenerle separate permette a un solo meccanismo di far rispettare molte politiche e rende le politiche verificabili. Politiche formali classiche: Bell-LaPadula per la riservatezza ("no read up, no write down"), Biba per l'integrità ("no read down, no write up"), Chinese Wall per i conflitti di interesse.
- **Collo di bottiglia 1: esprimere la politica.** Le politiche sono spesso implicite, incomplete o contraddittorie, e scrivere tutto ciò che *non* deve accadere è difficile (si ricordi la slide 32: la sicurezza riguarda ciò che un'applicazione non deve fare).
- **Collo di bottiglia 2: farla rispettare.**
  - *Dinamicamente*, durante l'esecuzione: controlli eseguiti mentre il programma gira (controlli di accesso, controlli dei limiti degli array in Java, stack canary, monitor a runtime). Sono precisi per l'esecuzione reale, ma costano in prestazioni e scoprono un problema solo quando accade.
  - *Staticamente*, prima dell'esecuzione: sistemi di tipi, analisi statica e verifica formale stabiliscono proprietà per *tutte* le esecuzioni possibili senza eseguire il programma, ma devono approssimare (producendo falsi allarmi), perché la maggior parte delle proprietà interessanti dei programmi è indecidibile (teorema di Rice). Si veda la Lezione 7 (Program Analysis).

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

**Approfondimento.**

- **Riservatezza** (confidentiality): le informazioni vengono rivelate solo a chi è autorizzato. Meccanismi: controllo degli accessi, cifratura. Violazioni: fughe di dati, intercettazioni, canali laterali. La riservatezza può riguardare anche i *metadati* (chi parla con chi, e quando).
- **Integrità** (integrity): informazioni e sistemi vengono modificati solo da chi è autorizzato, nei modi autorizzati; le modifiche non autorizzate vengono impedite o almeno rilevate. Meccanismi: controllo degli accessi, checksum e MAC, firme digitali, validazione dell'input. L'integrità del *codice* e del flusso di controllo del programma conta quanto quella dei dati: un buffer overflow che sovrascrive un indirizzo di ritorno è una violazione dell'integrità.
- **Disponibilità** (availability): gli utenti autorizzati ottengono in tempo l'accesso a informazioni e servizi. Violazioni: attacchi DoS e DDoS, crash (l'overflow di Cisco della slide 11), ransomware, esaurimento delle risorse. Meccanismi: ridondanza, limitazione della frequenza delle richieste, gestione robusta dell'input, backup.
- **Non ripudio** (non-repudiation): una parte non può negare in seguito di aver compiuto un'azione (inviare un messaggio, firmare un contratto, approvare un pagamento). Richiede un'autenticazione forte più prove a prova di manomissione, di solito **firme digitali** (solo chi possiede la chiave privata può produrle) e log di audit protetti. Sostiene l'**accountability**: ogni azione si può ricondurre a un individuo responsabile.
- Altri modelli estendono la triade: alcuni manuali aggiungono l'*autenticità* (i dati vengono davvero dal mittente dichiarato); l'esade di Parker aggiunge *possesso/controllo*, *autenticità* e *utilità*.

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

**Approfondimento.**

- **Perché di solito vince l'integrità.** Se qualcuno *legge* il saldo del tuo conto, è imbarazzante; se qualcuno lo *cambia*, perdi denaro. Se qualcuno legge la tua cartella clinica, la tua privacy è violata; se qualcuno la *altera* (gruppo sanguigno, allergie, dosaggi), puoi subire un danno o morire. Se qualcuno legge il tuo software succede poco (molto software è comunque open source); se qualcuno lo *modifica* (malware, backdoor, un sistema operativo manomesso), controlla tutto, riservatezza compresa, perché un sistema operativo compromesso può leggere tutti i tuoi dati. L'integrità del software è il fondamento di ogni altra proprietà.
- **Disponibilità e privacy.** Di solito la disponibilità è desiderabile, ma a volte l'obiettivo è l'opposto: i dati *non* devono essere disponibili, o devono smettere di esserlo dopo un certo tempo:
  - il *diritto alla cancellazione* del GDPR (il "diritto all'oblio", art. 17);
  - i limiti alla conservazione dei dati (log cancellati dopo un periodo fissato);
  - i messaggi effimeri e la *forward secrecy* (le chiavi di sessione vengono distrutte, quindi il traffico passato non si può decifrare in seguito nemmeno se trapelano le chiavi a lungo termine);
  - cancellare password e chiavi dalla memoria appena non servono più.

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

**Approfondimento.**

- **Nota sulla sigla.** Qui la "A" di CIA è scritta come *authentication*, mentre la slide 51 usa *availability*. Nella terminologia standard (ISO/IEC 27000, NIST) **CIA = Confidentiality, Integrity, Availability**; l'autenticazione è un obiettivo e un meccanismo a parte (la prima "A" di AAAA, slide 54). Conviene conoscere entrambe le versioni, perché il testo della slide può essere citato.
- **Tracciabilità e auditing (analisi forense)**: le azioni vengono registrate (chi ha fatto che cosa, quando) in log resistenti alla manomissione, così gli incidenti si possono indagare in seguito e attribuire.
- **Monitoraggio (auditing in tempo reale)**: log ed eventi vengono analizzati mentre il sistema è in funzione (sistemi di rilevamento delle intrusioni, piattaforme SIEM), così gli attacchi vengono individuati e fermati mentre accadono.
- **Sicurezza multilivello (MLS)**: dati e utenti hanno livelli di classificazione (Unclassified < Confidential < Secret < Top Secret), e il sistema controlla i flussi di informazione fra i livelli (Bell-LaPadula). Tipica dei sistemi militari e governativi.
- **Privacy e anonimato**: la privacy è il controllo sui propri dati personali (che cosa viene raccolto e per quale scopo); l'anonimato è l'impossibilità di collegare un'azione a un'identità (Tor, mix network). Nozioni vicine: pseudonimia, non collegabilità, minimizzazione dei dati.
- **Assurance**: una *meta*-proprietà, cioè una proprietà *sulle* altre proprietà: la fiducia giustificata che il sistema rispetti davvero i suoi obiettivi di sicurezza. Si costruisce con prove (revisioni del progetto, test, revisione del codice, verifica formale) e certificazioni, per esempio gli Evaluation Assurance Level dei Common Criteria, da EAL1 a EAL7.

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

**Approfondimento.**

- L'**autenticazione** verifica un'identità dichiarata. I fattori: qualcosa che *sai* (password, PIN), qualcosa che *hai* (smart card, telefono, token hardware), qualcosa che *sei* (impronta digitale, volto). L'autenticazione a più fattori combina fattori di tipo diverso. Vale per le persone, ma anche per macchine e messaggi (certificati TLS, MAC).
- L'**autorizzazione (controllo degli accessi)** decide se un soggetto autenticato può eseguire un'operazione su un oggetto. La "specifica di chi può fare che cosa" è la **politica di controllo degli accessi**, espressa con modelli come le access-control list (ACL), le capability, il controllo degli accessi basato sui ruoli (RBAC) o sugli attributi (ABAC). La fa rispettare un *reference monitor*, che deve essere sempre invocato (*complete mediation*), a prova di manomissione e abbastanza piccolo da poter essere verificato. Un bug classico è l'autenticazione senza autorizzazione: controllare *che* un utente abbia fatto il login, ma non *quale* utente possiede la risorsa richiesta.
- L'**auditing** registra gli eventi rilevanti per la sicurezza e li esamina, per scoprire se qualcosa è andato storto (violazioni della politica, intrusioni).
- L'**azione** è la risposta: bloccare un account, revocare credenziali, applicare patch, ripristinare dai backup, perseguire i responsabili.
- Da non confondere con la sigla delle reti *AAA*: Authentication, Authorization and Accounting (RADIUS, Diameter).

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

**Approfondimento.**

- **La corrispondenza.** Controllo degli accessi/autorizzazione è **prevenzione**; l'auditing è **rilevamento**; l'azione è **reazione**. (La slide scrive "persecute"; la parola intesa è *prosecute*, cioè agire legalmente contro i colpevoli.)
- La *prevenzione* nel software: validazione dell'input, linguaggi type-safe, privilegio minimo, cifratura, stack canary e memoria non eseguibile (Lezione 8, Buffer Overflow Defences).
- Il *rilevamento*: sistemi di rilevamento delle intrusioni, monitoraggio dei log, controllori dell'integrità dei file, rilevamento delle anomalie, rapporti sui crash, honeypot.
- La *reazione*: piani di risposta agli incidenti, backup e ripristino, patch, revoca delle chiavi, azioni legali.
- **L'analogia della casa.** Il vetro di una finestra non offre quasi nessuna prevenzione, eppure la maggior parte delle case non subisce mai un furto, perché i ladri temono di essere *scoperti* (allarmi, vicini, telecamere) e la *reazione* (polizia, prigione). La deterrenza funziona quanto le barriere. Nel software la prevenzione non è mai perfetta (c'è sempre un altro bug sconosciuto), quindi i sistemi devono anche saper rilevare una compromissione e riprendersi. Fa parte della **difesa in profondità** e della mentalità moderna detta "assume breach".

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

**Approfondimento.** Ogni minaccia è la violazione di un requisito di sicurezza, e il requisito è ciò che le contromisure devono garantire. La corrispondenza è sostanzialmente la classificazione delle minacce **STRIDE** di Microsoft (Loren Kohnfelder e Praerit Garg, 1999), molto usata nella modellazione delle minacce:

| Minaccia STRIDE | Proprietà violata | Esempio |
| --- | --- | --- |
| **S**poofing | Autenticazione | entrare con credenziali rubate, mittente di e-mail falsificato, IP o ARP spoofing |
| **T**ampering | Integrità | cambiare un prezzo in una richiesta HTTP, SQL injection che aggiorna righe, corruzione della memoria |
| **R**epudiation | Non ripudio | un utente nega di aver fatto un pagamento e non c'è un log o una firma che lo provi |
| **I**nformation disclosure | Riservatezza | fuga di dati, messaggi di errore troppo dettagliati, path traversal che legge `/etc/passwd` |
| **D**enial of service | Disponibilità | flooding, far cadere un servizio con un input troppo lungo, attacchi alla complessità algoritmica |
| **E**levation of privilege | Autorizzazione (controllo degli accessi) | buffer overflow in un programma setuid che dà root, pagine di amministrazione senza controlli |

Il termine "unauthorised access" della slide corrisponde all'elevation of privilege. La repudiation, la violazione del non ripudio (slide 51), è l'unica categoria STRIDE che la slide non elenca.

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

**Approfondimento.**

- **Risposta alla domanda della slide.** Bloccare un account dopo tre login falliti introduce una **vulnerabilità di denial of service**: chiunque conosca o indovini un nome utente può chiudere fuori di proposito il suo legittimo titolare, semplicemente digitando tre password sbagliate. Su larga scala un attaccante può bloccare *tutti* gli account (i nomi utente sono spesso prevedibili: indirizzi e-mail, matricole), o una vittima precisa in un momento critico (poco prima della chiusura di un'asta online o di una scadenza di trading). Se il messaggio di blocco è diverso per gli account inesistenti, permette anche l'*enumerazione degli utenti*.
- **Alternative migliori**: ritardi sempre più lunghi dopo ogni fallimento (exponential back-off), blocchi temporanei che scadono da soli, CAPTCHA dopo qualche fallimento, limiti di frequenza per indirizzo IP di origine *e* per account, autenticazione a più fattori, avvisi all'utente, e il rifiuto delle password che compaiono negli elenchi di password trapelate.
- **Contromisure con dei bug.** Il software di sicurezza è software: spesso gira con privilegi elevati ed elabora input non fidato, quindi i suoi bug sono particolarmente pericolosi. Esempi: motori antivirus sfruttati proprio attraverso i file che analizzano; vulnerabilità in gateway VPN e firewall sfruttate su larga scala; Heartbleed in OpenSSL, la libreria che fornisce la riservatezza di TLS, da cui uscivano chiavi private e password; l'aggiornamento difettoso di CrowdStrike Falcon del luglio 2024, che mandò in crash circa 8,5 milioni di macchine Windows, un disastro di disponibilità causato da un prodotto di sicurezza.

### Slide 58 · Countermeasures (tecnologie di sicurezza)

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

**Approfondimento.**

- La **crittografia** protegge i dati *in transito* (TLS, SSH, VPN) e *a riposo* (cifratura del disco, database cifrati, hashing delle password con bcrypt, scrypt o Argon2). Fornisce riservatezza (cifratura) e integrità e autenticità (MAC, firme digitali). Non aiuta quando il software alle estremità è compromesso: i dati vanno decifrati dove vengono usati.
- Il **controllo degli accessi** limita ciò che utenti e processi possono fare. Il *controllo degli accessi basato sui ruoli* (RBAC) assegna i permessi ai ruoli (studente, docente, amministratore) e i ruoli agli utenti, il che semplifica l'amministrazione e sostiene il privilegio minimo e la separazione dei compiti. Altri modelli: discrezionale (DAC, per esempio i permessi dei file Unix), obbligatorio (MAC, per esempio SELinux), basato sugli attributi (ABAC).
- La **sicurezza basata sul linguaggio** protegge dai *programmi* che si comportano male (codice difettoso o malevolo) grazie alle garanzie date dal linguaggio di programmazione e dal suo runtime:
  - *type safety*: le operazioni si applicano solo a valori del tipo giusto, quindi per esempio un intero non può mai essere usato come puntatore;
  - *memory safety*: niente accessi fuori dai limiti, niente use-after-free, niente puntatori pendenti (Java, C#, Python, Go e Rust controllano i limiti e gestiscono la memoria). La sola memory safety elimina i buffer overflow (Lezione 3), la classe di vulnerabilità più comune di C e C++;
  - *sandboxing*: eseguire il codice con permessi ridotti, così che nemmeno un codice malevolo possa toccare file, rete o altre risorse (la sandbox delle applet Java, la Code Access Security di .NET, le sandbox dei browser, WebAssembly).

  Il Security Manager di Java è stato deprecato (Java 17) e la Code Access Security non è supportata in .NET Core, quindi oggi il sandboxing si basa soprattutto su processi del sistema operativo, container e WebAssembly. L'attuale spinta verso i linguaggi memory-safe (Rust nel kernel Linux, in Android e in Windows; il rapporto del 2024 dell'Office of the National Cyber Director statunitense che raccomanda i linguaggi memory-safe) è la sicurezza basata sul linguaggio all'opera.

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

**Approfondimento.**

- Le applicazioni raramente implementano da zero i meccanismi di sicurezza; riusano quelli della piattaforma: TLS da librerie come OpenSSL (TLS è il successore di SSL; SSL 2.0/3.0 e TLS 1.0/1.1 sono deprecati, quindi si usa TLS 1.2 o 1.3), il controllo degli accessi dal sistema operativo (account, permessi dei file) o dal DBMS (`GRANT`/`REVOKE`, sicurezza a livello di riga), il sandboxing dal runtime (JVM, CLR, browser).
- Riusare un meccanismo ben collaudato è buona pratica ("non scriverti la crittografia da solo"), ma significa *fidarsene*: la piattaforma entra nella **Trusted Computing Base (TCB)**, l'insieme dei componenti dalla cui correttezza dipende la sicurezza del sistema. La TCB dovrebbe essere la più piccola possibile. Il "of course, ... has to be secure" della slide è l'avvertenza cruciale: Heartbleed (OpenSSL, 2014), Log4Shell (Log4j, 2021) e le evasioni dalla sandbox di Java sfruttate dal malware drive-by intorno al 2012-2013 hanno colpito ogni applicazione costruita su quelle piattaforme.
- Le applicazioni devono anche *usare* correttamente i meccanismi della piattaforma. Per esempio, disattivare la validazione dei certificati TLS (una scorciatoia comune durante lo sviluppo, che finisce in produzione) toglie in silenzio ogni protezione contro gli attacchi man-in-the-middle.

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

**Approfondimento.** L'infrastruttura ha due facce, come il software in generale (slide 5):

- *Fornitrice di sicurezza*: isolamento dei processi e permessi nel sistema operativo, protezione della memoria (memoria virtuale, pagine non eseguibili, ASLR), type safety e memory safety nel linguaggio, librerie sicure (crittografia, parser), controllo degli accessi nel database.
- *Fonte di insicurezza*:
  - il **linguaggio di programmazione** come interfaccia verso CPU e RAM: il C espone la memoria grezza (puntatori, nessun limite), ed è da lì che vengono i buffer overflow e i bug di format string; anche i linguaggi sicuri hanno vie di fuga non sicure (JNI in Java, `unsafe` in Rust e in C#);
  - **librerie e API**: funzioni pericolose (`gets`, `strcpy`, `system`), API complesse facili da usare male (API crittografiche, parser XML che per impostazione predefinita risolvono le entità esterne, da cui gli attacchi XXE), e dipendenze di terze parti vulnerabili (gli strumenti di software composition analysis e gli SBOM, software bill of materials, ne tengono traccia);
  - le **altre applicazioni**, come il database: la SQL injection esiste perché l'applicazione parla con il database costruendo stringhe in un altro linguaggio.

### Slide 61 · Threats & vulnerabilities

> - Knowledge about threats & vulnerabilities is crucial
> - Vulnerabilities can be specific to programming language, operating system, database, the type of application... and are continuously evolving
>   - we cannot hope to cover all vulnerabilities in this course
> - "Fortunately", people keep making the same mistakes and some old favourites never seem to die,
>   - esp. public enemy number 1: *the buffer overflow*
>
>   and some patterns keep re-emerging

**Approfondimento.**

- **I vecchi preferiti.** Il buffer overflow fu descritto già nel 1972 (il rapporto Anderson per l'aeronautica statunitense), sfruttato dal worm di Morris nel 1988, reso popolare da *Smashing the Stack for Fun and Profit* di Aleph One (Phrack 49, 1996), ed è ancora in cima alla **CWE Top 25** di MITRE: CWE-787 (Out-of-bounds Write) era al primo posto nel 2021, nel 2022 e nel 2023, e al secondo nel 2024. La SQL injection, descritta pubblicamente nel 1998, è ancora fra le prime tre.
- **Schemi che ritornano.** Le stesse cause di fondo ricompaiono in ogni nuova tecnologia: l'injection è passata da SQL a NoSQL, LDAP, XPath, motori di template e ora ai prompt dei grandi modelli linguistici (*prompt injection*); gli integer overflow sono passati dal C agli smart contract (slide 16-17); le race condition sono passate dai file system Unix (TOCTOU, Lezione 11) alle applicazioni web e agli smart contract (reentrancy). Imparare gli *schemi* di fondo (mescolare dati e codice, validazione mancante, aritmetica non controllata, race fra controllo e uso) dura più a lungo che memorizzare i singoli bug, e il resto del corso è organizzato attorno a loro.

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

**Approfondimento.** Tre origini diverse, con esempi:

1. **Bug**: il software non fa ciò che dovrebbe. Un controllo dei limiti mancante nell'applicazione, o in una libreria che usa (Heartbleed).
2. **Funzionalità inappropriate**: il software fa qualcosa che non dovrebbe, *per progetto*, perché una funzione comoda è anche pericolosa. Esempi: `gets()` nella libreria C (non può limitare la lunghezza dell'input; è stata tolta in C11), la conversione `%n` di `printf`, che *scrive* in memoria ed è la chiave degli attacchi di format string (Lezione 4), le entità esterne di XML, le macro di Office attive per impostazione predefinita, `register_globals` in PHP, la deserializzazione Java di classi arbitrarie.
3. **Uso inappropriato delle funzionalità**: la funzione va bene, lo sviluppatore la usa male. Esempi: costruire query SQL concatenando stringhe invece di usare i prepared statement; passare l'input dell'utente a `system()`; usare `strncpy` senza assicurarsi che la stringa sia terminata; usare una libreria AES corretta in modalità ECB o con un IV fisso; disattivare il controllo dei certificati. Le tre cause principali corrispondono alla slide: le funzioni sono complesse e documentate male (*complessità*), il modo insicuro è più facile o più veloce (*la funzionalità vince sulla sicurezza*), gli sviluppatori non conoscono i rischi (*ignoranza*).

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

**Approfondimento.** Dove viene trattato ciascun tema, secondo le slide delle lezioni pubblicate finora:

| Tema | Lezioni |
| --- | --- |
| Vulnerabilità specifiche di un linguaggio (C) | 3 Buffer Overflow, 4 Format Strings, 11 Race Conditions |
| Vulnerabilità generali | 5 Input Validation |
| Vulnerabilità specifiche di un tipo di applicazione (web, database) | 9 SQL Injection |
| Contromisure al livello della piattaforma e del compilatore | 8 Buffer Overflow Defences |
| Analisi statica e dinamica, strumenti | 6 Tools, 7 Program Analysis |
| Contromisure lungo il ciclo di vita dello sviluppo | 10 Design Principles, 12 Secure Software Design, 13 Security Engineering for Software |

- *Controllo degli accessi basato sul codice*: i permessi vengono concessi al *codice* in base alla sua origine (da dove è stato caricato, chi l'ha firmato) invece che all'utente che lo esegue, come nella stack inspection di Java.
- *Monitoraggio a runtime*: verificare delle proprietà durante l'esecuzione e fermare il programma quando vengono violate (reference monitor, control-flow integrity, sanitizer).
- *Flusso dell'informazione*: seguire come i dati si propagano in un programma, per garantire che gli input segreti non influenzino mai le uscite pubbliche (riservatezza) e che gli input non fidati non raggiungano mai senza controlli le operazioni sensibili (integrità; è la *taint analysis*).
