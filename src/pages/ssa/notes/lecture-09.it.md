La Lezione 9 è la trattazione dedicata e più approfondita della SQL injection (introdotta nella Lezione 5): un ripasso di SQL (DML e DDL), come funziona l'injection in una query di login, le tante **tecniche di evasione** che aggirano la validazione dell'input basata su firme e il rilevamento delle intrusioni (IDS), i caratteri pericolosi per la SQL injection, e le difese, che culminano di nuovo nelle query parametrizzate. Le slide sono 14. Gli esempi di codice sono importanti per l'esame.

## Ripasso di SQL (pagine 2-5)

### Slide 2 · What is SQL?

> - Allows us to access a database
> - ANSI and ISO standard computer language - The most current standard is SQL99
> - SQL can: Execute queries against a database; Retrieve data from a database; Insert new records in a database; Delete records from a database; Update records in a database
> - There are many different versions of the SQL language
> - They support the same major keywords in a similar manner (such as SELECT, UPDATE, DELETE, INSERT, WHERE, and others).
> - Most of the SQL database programs also have their own proprietary extensions in addition to the SQL standard!

**Approfondimento.** **SQL** (Structured Query Language) è il linguaggio standard (ANSI/ISO) per parlare con i database relazionali; la slide cita SQL99, anche se lo standard è andato avanti (SQL:2003, 2008, 2011, 2016). Tutti i database condividono le parole chiave di base (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `WHERE`), ma ciascuno aggiunge **estensioni proprietarie**, il che conta per la sicurezza perché un payload di injection, e le primitive d'attacco disponibili (come la `xp_cmdshell` di SQL Server della Lezione 5, slide 19), dipendono spesso dal database. Capire SQL è un prerequisito per capire come l'injection lo manipola.

### Slide 3 · SQL Database Tables

> - A relational database contains one or more tables identified each by a name
> - Tables contain records (rows) with data
> - For example, the following table is called "users" and contains data distributed in rows and columns:

![Lezione 9, pagina 3](L09_p03.webp "50% 1400x375")

**Figura.** La tabella d'esempio `users` usata in tutta la lezione:

| userID | Name | LastName | Login | Password |
| --- | --- | --- | --- | --- |
| 1 | John | Smith | jsmith | hello |
| 2 | Adam | Taylor | adamt | qwerty |
| 3 | Daniel | Thompson | dthompson | dthompson |

**Approfondimento.** Un database relazionale conserva i dati in **tabelle** con un nome, fatte di **righe** (record) e **colonne** (campi). Questa tabella `users` è l'esempio che accompagna le dimostrazioni di injection. Si noti l'anti-pattern di sicurezza che illustra (non è il tema della lezione ma vale la pena segnalarlo): le password sono conservate **in chiaro** (`hello`, `qwerty`). I sistemi reali devono conservare solo un hash lento e con salt della password (bcrypt/scrypt/Argon2, Lezione 1, slide 14), così che una violazione del database, o un'injection riuscita che scarica questa tabella, non riveli subito tutte le password.

### Slide 4 · SQL Queries and DML

> With SQL, we can query a database and have a result set returned. Using the previous table, a query like this:
>
> `SELECT LastName FROM users WHERE UserID = 1;`
>
> Gives a result set like this:
>
> ```
> LastName
> --------
> Smith
> ```
>
> SQL includes a syntax to update, insert, and delete records:
>
> - SELECT - extracts data
> - UPDATE - updates data
> - INSERT INTO - inserts new data
> - DELETE - deletes data

**Approfondimento.** Queste quattro istruzioni sono il **Data Manipulation Language (DML)**, le operazioni sui *dati* delle tabelle. Una `SELECT ... FROM ... WHERE ...` recupera le righe che soddisfano una condizione (qui il `LastName` della riga con `UserID = 1`, che restituisce "Smith"). La clausola `WHERE` è proprio il punto in cui colpisce l'injection: corrompendo la condizione, un attaccante cambia *quali* righe vengono toccate, lette, aggiornate o cancellate (l'`OR 1=1` della Lezione 5). Poiché l'injection può arrivare anche a `UPDATE` e `DELETE`, non è solo un problema di aggiramento dell'autenticazione o di lettura, ma può anche modificare o distruggere dati.

### Slide 5 · Data Definition Language (DDL)

> - The Data Definition Language (DDL) part of SQL permits: Database tables to be created or deleted; Define indexes (keys); Specify links between tables; Impose constraints between database tables
> - Some of the most commonly used DDL statements in SQL are: CREATE TABLE - creates a new database table; ALTER TABLE - alters (changes) a database table; DROP TABLE - deletes a database table

**Approfondimento.** Il **DDL** definisce la *struttura* (lo schema) del database, invece dei suoi dati: creare, modificare o eliminare tabelle, indici, chiavi e vincoli. Conta per l'injection perché un'injection potente (soprattutto con query accodate, Lezione 5, slide 19) potrebbe eseguire DDL: `DROP TABLE users` distrugge l'intera tabella (si ricordi il famoso fumetto xkcd di "Bobby Tables", uno studente di nome `Robert'); DROP TABLE Students;--`). Per questo l'account del database usato da un'applicazione web **non deve avere diritti DDL** (privilegio minimo, slide 12): così nemmeno un'injection riuscita può alterare lo schema.

## Come funziona la SQL injection (pagine 6-8)

### Slide 6 · How Common is SQL Injection?

> - It is probably the most common Website vulnerability today
> - It is a flaw in "web application" development, it is not a Database or web server problem - Most programmers are still not aware of this problem - Many tutorials and demo "templates" are vulnerable - Even worse, a lot of solutions posted on the Internet are not good enough
> - Vulnerable Applications: Almost all SQL databases and programming languages are potentially vulnerable (MS SQL Server, Oracle, MySQL, Postgres, DB2, MS Access, Sybase, Informix, etc) - Accessed through applications developed using: Perl and CGI scripts; ASP, JSP, PHP; XML, XSL and XSQL; Javascript; VB, MFC, and other ODBC-based tools and APIs; DB specific Web-based applications and API's; Reports and DB Applications; 3 and 4GL-based languages (C, OCI, Pro\*C, and COBOL); …

**Approfondimento.** Due inquadramenti importanti:

- **È un bug dell'applicazione, non del database o del web server.** Il database e il web server funzionano esattamente come sono stati progettati; la vulnerabilità è nel *codice dell'applicazione* che costruisce SQL a partire da un input non fidato. Quindi la correzione va fatta nell'applicazione (la "debolezza in profondità" della Lezione 1), e nessuna patch del database né regola del firewall la cura. La persistenza del bug viene attribuita alla mancanza di consapevolezza e alla diffusione di cattivi esempi (tutorial vulnerabili e risposte copiate in stile Stack Overflow, il "perché è ancora un problema?" della Lezione 5, slide 18).
- **È universale.** *Ogni* database SQL e *ogni* linguaggio che costruisce SQL dinamico è potenzialmente vulnerabile; il lungo elenco fa capire che non è una stranezza di una sola piattaforma. La causa di fondo (query costruite concatenando stringhe) non dipende né dal linguaggio né dal database.

### Slide 7 · How does SQL Injection work?

> Common vulnerable login query
>
> ```sql
> SELECT * FROM users WHERE login = 'victor' AND password = '123'
> ```
>
> (If it returns something then login!)
>
> ASP/MS SQL Server login syntax
>
> ```
> var sql = "SELECT * FROM users WHERE login = '" + formusr + "' AND password = '" + formpwd + "'";
> ```

**Analisi del codice.** Lo stesso schema di login vulnerabile della Lezione 5, ora in ASP/JScript su MS SQL Server.

- *Come dovrebbe funzionare*: la query seleziona la riga il cui `login` e la cui `password` corrispondono alle credenziali inviate; se torna una riga, il login viene accettato.
- *Il difetto*: `formusr` e `formpwd` (i campi del modulo) vengono **concatenati** direttamente nella stringa della query, fra apici singoli. L'apice singolo è il delimitatore delle stringhe, quindi gli apici forniti dall'attaccante escono dal contesto della stringa e iniettano SQL. È la stessa identica causa di fondo della Lezione 5; la slide successiva mostra l'exploit.

### Slide 8 · Inject through Strings

> ```
> formusr = ' or 1=1 - -
> formpwd = anything
> ```
>
> Final query would look like this:
>
> ```sql
> SELECT * FROM users WHERE username = ' ' or 1=1 - - AND password = 'anything'
> ```
>
> The character `'`
>
> - Closes the string parameter
> - Everything after is considered part of the SQL command
> - Misleading Internet suggestions include: Escape it : replace `'` with `''`
> - String fields are very common but there are other types of fields: Numeric; Dates

**Analisi del codice.** L'exploit, passo per passo:

- *Il payload.* `formusr = ' or 1=1 --` (la slide spazia il commento come `- -`; in SQL vero è `--`, il commento di una riga). L'`'` iniziale **chiude la stringa del `login`**; `or 1=1` rende la condizione `WHERE` vera per ogni riga; `--` commenta il resto della query, compreso il controllo `AND password = ...`. Così la query restituisce tutte le righe e la password non viene mai controllata: l'aggiramento dell'autenticazione.
- *L'intuizione chiave ("il carattere `'`").* L'apice singolo chiude il parametro stringa, e **tutto ciò che segue viene interpretato come comando SQL**, non come dati. È l'essenza dell'injection: i dati diventano codice.
- *"Misleading Internet suggestions": fare l'escaping di `'` come `''`.* Una correzione comune ma **inadeguata** è sostituire ogni apice singolo con due (`''`, il modo SQL di inserire un apice letterale). La slide avverte che è fuorviante perché: (1) aiuta solo nei contesti *stringa*, e (2) molti campi sono **numerici o date**, che *non* sono racchiusi fra apici nella query (per esempio `... WHERE id = $id`), quindi per iniettare non serve alcun apice (`$id = 1 OR 1=1`). L'escaping degli apici non fa nulla contro un'injection in un campo numerico. È esattamente per questo che la vera correzione è la parametrizzazione (slide 14), non l'escaping degli apici.
- *La correzione* (anticipata): usare una query parametrizzata, così `formusr`/`formpwd` vengono collegati come dati (slide 14).

## Evasione, IDS e caratteri dell'injection (pagine 9-11)

### Slide 9 · Evasion techniques

> - Input validation circumvention and IDS Evasion techniques are very similar and rely on "signatures"
> - Signatures can be evaded easily
> - Input validation, IDS detection AND strong database and OS hardening must be used together
>
> Evading `' OR 1=1` signature:
>
> - `' OR 'unusual' = 'unusual'`
> - `' OR 'something' = 'some'+'thing'`
> - `' OR 'text' = N'text'`
> - `' OR 'something' like 'some%'`
> - `' OR 2 > 1`
> - `' OR 'text' > 't'`
> - `' OR 'whatever' IN ('whatever')`
> - `' OR 2 BETWEEN 1 AND 3`

**Approfondimento.** È la metà "IDS" della lezione, e l'argomento centrale *contro* il fare affidamento sul filtraggio con black list.

- **Le difese basate su firme sono fragili.** Sia la validazione dell'input ingenua sia un **IDS/WAF** (Intrusion Detection System / Web Application Firewall) spesso funzionano riconoscendo delle **firme**, schemi di input noti come malevoli, prima fra tutte la stringa letterale `' OR 1=1`. Ma la *logica* che serve all'attaccante (una clausola `WHERE` sempre vera) si può esprimere in innumerevoli modi equivalenti nel significato ma diversi nel testo, che quindi sfuggono a qualunque firma fissa.
- **L'elenco delle evasioni** mostra otto modi di scrivere una condizione sempre vera senza l'`OR 1=1` letterale: confrontare una stringa con se stessa (`'unusual'='unusual'`), la concatenazione di stringhe (`'some'+'thing'`), i letterali Unicode (`N'text'`), `LIKE` con un carattere jolly (`'some%'`), disuguaglianze numeriche (`2 > 1`), il confronto lessicografico (`'text' > 't'`), `IN`, `BETWEEN`. Ognuno elude una firma che cerca `1=1`. Lo spazio degli equivalenti è di fatto infinito, quindi **il black-listing non può vincere** (la lezione ricorrente della Lezione 4, slide 35-38; Lezione 5, slide 27).
- **Serve la difesa in profondità.** Poiché ogni singola firma si può eludere, la slide insiste che validazione dell'input, rilevamento con IDS *e* un forte irrobustimento del database e del sistema operativo (privilegio minimo, sistemi aggiornati, funzioni pericolose disattivate) vanno **messi a strati insieme**: nessuno di essi basta da solo. La vera cura (la parametrizzazione, slide 14) elimina del tutto la vulnerabilità, ma questi livelli mitigano il rischio residuo.

### Slide 10 · SQL Injection Characters

> - `'` or `"` - character String Indicators
> - `--` or `#` - single-line comment
> - `/*…*/` - multiple-line comment
> - `+` - addition, concatenate (or space in url)
> - `||` (double pipe) - concatenate
> - `%` - wildcard attribute indicator
> - `?Param1=foo&Param2=bar` - URL Parameters
> - `PRINT` - useful as non transactional command
> - `@variable` - local variable
> - `@@variable` - global variable
> - `waitfor delay '0:0:10'` - time delay

**Approfondimento.** La cassetta degli attrezzi dell'attaccante fatta di token speciali: che cosa cercare (chi difende) e che cosa provare (nei test autorizzati):

- I **delimitatori di stringa** `'` `"`: uscire da un letterale stringa (il vettore di injection principale).
- I **commenti** `--`, `#` (MySQL), `/* ... */`: troncare il resto della query per scartare le condizioni finali (il controllo della password), o per spezzare e offuscare un payload. I commenti in linea `/* */` si possono perfino inserire *dentro* le parole chiave per eludere le firme (`UN/**/ION`).
- La **concatenazione** `+` (SQL Server), `||` (Oracle/standard): costruire stringhe ed eludere le firme (slide 9); si noti che `+` codifica anche uno spazio in un URL.
- Il **carattere jolly** `%`: nelle clausole `LIKE` corrisponde a qualunque cosa (usato nelle evasioni e per enumerare i dati).
- I **parametri dell'URL**: i punti d'ingresso da cui arrivano i payload nelle applicazioni web.
- **`PRINT`**: un comando di SQL Server che produce output fuori da una transazione, utile per sondare.
- **`@variable` / `@@variable`**: variabili locali e globali (di sistema); `@@version` e `@@servername` fanno uscire informazioni sul server.
- **`waitfor delay '0:0:10'`**: la chiave dell'**injection cieca, basata sui tempi**. Quando l'applicazione non restituisce né dati né errori (così l'attaccante non può vedere direttamente i risultati della query), si inietta un ritardo condizionale: "se la prima lettera della password dell'amministratore è 'a', aspetta 10 secondi". Misurando i tempi di risposta, l'attaccante estrae i dati un bit alla volta, anche senza alcun output visibile. Mostra che l'injection funziona anche contro le applicazioni "silenziose".

### Slide 11 · Input Validation and Circumvention

> - Some people use PHP addslashes() function to escape characters - single quote ('), double quote ("), backslash (\\), NUL (the NULL byte)
> - This can be easily evaded by using replacements for any of the previous characters in a numeric field
> - IDS and input validation can also be circumvented by encoding - URL encoding - Unicode/UTF-8 - Hex encoding - char() function
> - MySQL Input Validation Circumvention:
>   - Inject without quotes (string = "%"): `' or username like char(37);`
>   - Inject without quotes (string = "root"): `' union select * from users where login = char(114,111,111,116);`

**Analisi del codice.** Perché l'escaping e il filtraggio improvvisati falliscono, con esempi in MySQL:

- **`addslashes()` non basta.** La `addslashes()` di PHP fa l'escaping con la barra rovesciata di `'`, `"`, `\` e NUL. Ma (1) in un **campo numerico** non servono apici per iniettare, quindi fare l'escaping degli apici è irrilevante; e (2) in passato i trucchi con i set di caratteri multibyte (per esempio GBK, l'aggiramento con `0xbf27`) potevano rendere del tutto inutile `addslashes`. L'escaping è lo strumento sbagliato.
- **Evasione con le codifiche.** Un filtro che cerca i caratteri pericolosi letterali viene accecato dalle codifiche: la codifica URL (`%27` per `'`), le forme Unicode/UTF-8 sovralunghe, la codifica esadecimale, e la funzione SQL `char()` che costruisce una stringa dai codici dei caratteri. L'input supera il filtro, poi il database (o un livello precedente) lo decodifica di nuovo nell'attacco.
- **`char()` per evitare del tutto gli apici.** Gli esempi in MySQL costruiscono costanti stringa *senza alcun carattere di apice*, così un filtro che blocca `'`, `"` e perfino le parole chiave viene aggirato: `char(37)` è `%` (quindi `username like char(37)` corrisponde a tutto); `char(114,111,111,116)` compone `root` (quindi `login = char(114,111,111,116)` prende di mira l'account root) e `union select * from users` estrae l'intera tabella con una `UNION`. La lezione: poiché l'attaccante può esprimere il payload senza i caratteri che una black list blocca, **nessuna quantità di filtraggio dei caratteri è affidabile**: prima si canonizza (Lezione 4, slide 41) e, soprattutto, si parametrizza.

## Difendersi dalla SQL injection (pagine 12-14)

### Slide 12 · Defending against SQL Injections (1)

> - Sanitize all input. - Assume all input is harmful. - Validate user input that contains dangerous keywords or SQL characters, such as "xp\_cmdshell", "--", and ";". - Consider using regular expressions to remove unwanted characters. This approach is safer than writing your own search and replace routines.
> - Run with least privilege. - Do not execute an SQL SELECT statement as "sa". Create low-privilege accounts to access data. - Use SQL permissions to lock down databases, stored procedures, and tables. - Remove unused stored procedures.

**Approfondimento.** Il primo gruppo di difese (si noti che sono *difesa in profondità*, non la cura principale, che è la slide 14):

- **Sanificare tutto l'input / considerare dannoso ogni input** (il "non fidarsi mai dell'input" della Lezione 5). Validare rispetto agli schemi attesi, meglio con espressioni regolari collaudate che con cerca-e-sostituisci fatti in casa (che sono facili da sbagliare: la lezione di phf). La slide cita la black list dei token pericolosi (`xp_cmdshell`, `--`, `;`), ma dalle slide 9-11 si vede che il black-listing *non* è affidabile da solo, quindi è solo uno dei livelli.
- **Eseguire con il privilegio minimo** (il principio cardine della Lezione 10). L'account del database dell'applicazione web **non** deve essere il super-utente (`sa` in SQL Server, l'equivalente di root): si usa un account con pochi privilegi che può eseguire solo le query specifiche di cui ha bisogno, con `GRANT`/`REVOKE` di SQL per chiudere tabelle, procedure e database. **Togliere le stored procedure inutilizzate** (soprattutto quelle pericolose come `xp_cmdshell`), per ridurre la superficie d'attacco (Lezione 3, slide 52). Così anche un'injection riuscita resta confinata: non può eliminare tabelle, leggere altri database o eseguire comandi del sistema operativo.

### Slide 13 · Defending against SQL Injections (2)

> - Do not allow clients to view ODBC/OLE DB error messages. Handle these errors with your own code. By default, ASP pages returns error messages to clients.
> - Enable logging of all user access, and set alerts to log all failed attempts to access objects.
> - Do not use string concatenations to build SQL queries. Instead, use parameterized queries or parameterized stored procedures, because they explicitly define input and output values and do not process multiple statements as a batch.

**Approfondimento.** Il secondo gruppo:

- **Non mostrare al client i messaggi di errore dettagliati del database.** Gli errori verbosi `ODBC/OLE DB` (restituiti per impostazione predefinita dal vecchio ASP) fanno uscire la struttura della query, i nomi di tabelle e colonne e il tipo di database, il che aiuta moltissimo un attaccante a costruire e mettere a punto un'injection (ed è già di per sé un difetto di divulgazione di informazioni). Gli errori vanno catturati lato server, mostrando all'utente un messaggio generico e registrando il dettaglio internamente. (Si ricordi la Lezione 5, slide 28: una pagina che restituisce un errore SQL è "un brutto segno".)
- **Registrare tutti gli accessi e dare l'allarme sui tentativi falliti** (auditing e rilevamento, Lezione 1, slide 55): tentativi di accesso falliti ripetuti sono la firma di un'injection che sonda, quindi registrare e dare l'allarme permette il rilevamento e la risposta anche quando la prevenzione è imperfetta.
- **La cura principale, detta chiaramente: non costruire le query concatenando stringhe; usare query parametrizzate o stored procedure parametrizzate.** La slide dà i due motivi per cui funziona: **separano esplicitamente i valori di ingresso e di uscita dal codice della query** (così l'input è dati, mai eseguito), e **non elaborano più istruzioni come un unico lotto** (bloccando l'injection con query accodate, Lezione 5, slide 19). È la correzione definitiva; il codice è nella slide successiva.

### Slide 14 · Back to the previous example (la correzione parametrizzata)

> The vulnerable `var sql = "SELECT * FROM users WHERE login = '" + formusr + "' AND password = '" + formpwd + "'";` is replaced by:
>
> ```csharp
> SqlConnection objConnection = new SqlConnection(_ConnectionString);
> objConnection.Open();
> SqlCommand objCommand = new SqlCommand(
>     "SELECT * FROM User WHERE login = @Name AND password = @Password",
>     objConnection);
> objCommand.Parameters.Add("@Name", NameTextBox.Text);
> objCommand.Parameters.Add("@Password", PasswordTextBox.Text);
> SqlDataReader objReader = objCommand.ExecuteReader();
> if (objReader.Read())
> { ...
> ```
>
> Why is it safer? Because the SQL server knows that the value of the parameter is not actual code to execute, but data

**Analisi del codice.** La correzione con query parametrizzata in ADO.NET / C# per il login vulnerabile delle slide 7-8.

- *Come funziona.* Il testo della query contiene i **segnaposto** con nome `@Name` e `@Password` al posto dei valori concatenati. I valori veri vengono forniti a parte con `Parameters.Add("@Name", NameTextBox.Text)` e `Parameters.Add("@Password", PasswordTextBox.Text)`. L'input dell'utente non diventa mai parte della stringa della query.
- *Perché è sicura (la risposta della slide stessa).* **Il server SQL sa che il valore del parametro è un dato, non codice.** Il database analizza e compila *prima* il modello della query, con i segnaposto che indicano dove vanno i valori; i valori collegati riempiono poi quelle posizioni come puri dati e non vengono *mai* analizzati come SQL. Così un `formusr` uguale a `' OR 1=1 --` viene cercato alla lettera come un nome utente uguale a quell'intera stringa (e non trovato), invece di essere eseguito. È il "separare il codice dai dati" (Lezione 4, slide 33) imposto dal motore del database, ed è per questo che sconfigge in un colpo *tutti* i trucchi di evasione delle slide 9-11, senza bisogno di filtri o firme.
- *La stessa correzione, in ogni stack.* Questo è `SqlCommand.Parameters` in .NET; gli equivalenti sono il `PreparedStatement` di JDBC con `?` (Lezione 5, slide 15), i prepared statement di PDO/mysqli in PHP, e il `cursor.execute(sql, params)` parametrizzato in Python. (Nota minore: la query corretta dice `FROM User` mentre l'originale usava `users`, un refuso della slide; e l'applicazione dovrebbe comunque conservare solo password con hash e trattare il caso senza righe come "login fallito".)

Questo chiude il cerchio aperto nella Lezione 5: la concatenazione è la malattia, la parametrizzazione è la cura, e la lunga deviazione attraverso le tecniche di evasione (slide 9-11) dimostra *perché* la cura deve essere la parametrizzazione e non il filtraggio.
