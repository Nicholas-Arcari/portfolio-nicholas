Lecture 9 is the dedicated, deeper treatment of SQL injection (Lecture 5 introduced it): a refresher on SQL itself (DML and DDL), how injection works in a login query, the many **evasion techniques** that defeat signature-based input validation and intrusion detection (IDS), the dangerous SQL-injection characters, and the defences, culminating again in parameterized queries. The slide deck has 14 pages. The code examples are exam-relevant.

## SQL refresher (pages 2-5)

### Slide 2 · What is SQL?

> - Allows us to access a database
> - ANSI and ISO standard computer language - The most current standard is SQL99
> - SQL can: Execute queries against a database; Retrieve data from a database; Insert new records in a database; Delete records from a database; Update records in a database
> - There are many different versions of the SQL language
> - They support the same major keywords in a similar manner (such as SELECT, UPDATE, DELETE, INSERT, WHERE, and others).
> - Most of the SQL database programs also have their own proprietary extensions in addition to the SQL standard!

**Expansion.** **SQL** (Structured Query Language) is the standard language (ANSI/ISO) for talking to relational databases, the slide cites SQL99, though the standard has since advanced (SQL:2003, 2008, 2011, 2016). All databases share the core keywords (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `WHERE`), but each adds **proprietary extensions**, which matters for security because an injection payload, and the available attack primitives (like SQL Server's `xp_cmdshell` of Lecture 5, Slide 19), are often database-specific. Understanding SQL is a prerequisite for understanding how injection manipulates it.

### Slide 3 · SQL Database Tables

> - A relational database contains one or more tables identified each by a name
> - Tables contain records (rows) with data
> - For example, the following table is called "users" and contains data distributed in rows and columns:

![Lecture 9, page 3](L09_p03.webp "50% 1400x375")

**Figure.** The example `users` table used throughout the lecture:

| userID | Name | LastName | Login | Password |
| --- | --- | --- | --- | --- |
| 1 | John | Smith | jsmith | hello |
| 2 | Adam | Taylor | adamt | qwerty |
| 3 | Daniel | Thompson | dthompson | dthompson |

**Expansion.** A relational database stores data in named **tables** of **rows** (records) and **columns** (fields). This `users` table is the running example for the injection demonstrations. Note the security anti-pattern it illustrates (not the lecture's focus but worth flagging): the passwords are stored in **plaintext** (`hello`, `qwerty`). Real systems must store only a salted, slow hash of the password (bcrypt/scrypt/Argon2, Lecture 1, Slide 14), so that a database breach, or a successful injection that dumps this table, does not immediately reveal every password.

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

**Expansion.** These four statements are the **Data Manipulation Language (DML)**, the operations on the *data* in tables. A `SELECT ... FROM ... WHERE ...` retrieves the rows matching a condition (here, the `LastName` of the row with `UserID = 1`, returning "Smith"). The `WHERE` clause is exactly where injection strikes: by corrupting the condition, an attacker changes *which* rows are affected, read, updated or deleted (the `OR 1=1` of Lecture 5). Because injection can reach `UPDATE` and `DELETE` too, it is not only an authentication-bypass/read problem but can also modify or destroy data.

### Slide 5 · Data Definition Language (DDL)

> - The Data Definition Language (DDL) part of SQL permits: Database tables to be created or deleted; Define indexes (keys); Specify links between tables; Impose constraints between database tables
> - Some of the most commonly used DDL statements in SQL are: CREATE TABLE - creates a new database table; ALTER TABLE - alters (changes) a database table; DROP TABLE - deletes a database table

**Expansion.** **DDL** defines the *structure* (schema) of the database, rather than its data: creating/altering/dropping tables, indexes, keys and constraints. It matters for injection because a powerful injection (especially a stacked query, Lecture 5, Slide 19) could run DDL: `DROP TABLE users` destroys the entire table (recall the famous "Bobby Tables" xkcd, a student named `Robert'); DROP TABLE Students;--`). This is why the database account used by a web application should have **no DDL rights** (least privilege, Slide 12): even a successful injection then cannot alter the schema.

## How SQL injection works (pages 6-8)

### Slide 6 · How Common is SQL Injection?

> - It is probably the most common Website vulnerability today
> - It is a flaw in "web application" development, it is not a Database or web server problem - Most programmers are still not aware of this problem - Many tutorials and demo "templates" are vulnerable - Even worse, a lot of solutions posted on the Internet are not good enough
> - Vulnerable Applications: Almost all SQL databases and programming languages are potentially vulnerable (MS SQL Server, Oracle, MySQL, Postgres, DB2, MS Access, Sybase, Informix, etc) - Accessed through applications developed using: Perl and CGI scripts; ASP, JSP, PHP; XML, XSL and XSQL; Javascript; VB, MFC, and other ODBC-based tools and APIs; DB specific Web-based applications and API's; Reports and DB Applications; 3 and 4GL-based languages (C, OCI, Pro\*C, and COBOL); …

**Expansion.** Two important framings:

- **It is an application bug, not a database or web-server bug.** The database and web server work exactly as designed; the vulnerability is in the *application code* that builds SQL from untrusted input. So the fix belongs in the application (Lecture 1's "weakness in depth"), and no database patch or firewall rule cures it. The persistence of the bug is blamed on lack of awareness and on bad examples propagating (vulnerable tutorials and copied Stack-Overflow-style answers, the "why is it still a problem?" of Lecture 5, Slide 18).
- **It is universal.** *Every* SQL database and *every* language that builds dynamic SQL is potentially vulnerable; the long list drives home that this is not a quirk of one platform. The root cause (string-concatenated queries) is language- and database-independent.

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

**Code analysis.** The same vulnerable login pattern as Lecture 5, now in ASP/JScript against MS SQL Server.

- *How it is meant to work*: the query selects the row whose `login` and `password` match the submitted credentials; if a row comes back, the login is accepted.
- *The flaw*: `formusr` and `formpwd` (the form fields) are **concatenated** directly into the query string, inside single quotes. The single quote is the string delimiter, so attacker-supplied quotes break out of the string context and inject SQL. This is the identical root cause of Lecture 5; the next slide shows the exploit.

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

**Code analysis.** The exploit, step by step:

- *The payload.* `formusr = ' or 1=1 --` (the slide spaces the comment as `- -`; in real SQL it is `--`, the single-line comment). The leading `'` **closes the `login` string**; `or 1=1` makes the `WHERE` condition true for every row; `--` comments out the rest of the query, including the `AND password = ...` check. So the query returns all rows and the password is never checked, the authentication bypass.
- *The key insight ("the character `'`").* The single quote closes the string parameter, and **everything after it is interpreted as SQL command**, not data. This is the data-becomes-code essence of injection.
- *"Misleading Internet suggestions": escaping `'` as `''`.* A common but **inadequate** fix is to replace each single quote with two (`''`, SQL's way of embedding a literal quote). The slide warns this is misleading because: (1) it only helps in *string* contexts, and (2) many fields are **numeric or dates**, which are *not* wrapped in quotes in the query (e.g., `... WHERE id = $id`), so no quote is needed to inject (`$id = 1 OR 1=1`). Escaping quotes does nothing for a numeric-field injection. This is exactly why the real fix is parameterization (Slide 14), not quote-escaping.
- *The fix* (previewed): use a parameterized query so `formusr`/`formpwd` are bound as data (Slide 14).

## Evasion, IDS and injection characters (pages 9-11)

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

**Expansion.** This is the "IDS" half of the lecture, and the core argument *against* relying on blacklist filtering.

- **Signature-based defences are fragile.** Both naive input validation and an **IDS/WAF** (Intrusion Detection System / Web Application Firewall) often work by matching **signatures**, patterns of known-malicious input, famously the literal string `' OR 1=1`. But the *logic* an attacker needs (a `WHERE` clause that is always true) can be expressed in countless ways that are semantically equivalent but textually different, so they slip past any fixed signature.
- **The evasion list** shows eight ways to write an always-true condition without the literal `OR 1=1`: comparing a string to itself (`'unusual'='unusual'`), string concatenation (`'some'+'thing'`), Unicode literals (`N'text'`), `LIKE` with a wildcard (`'some%'`), numeric inequalities (`2 > 1`), lexicographic comparison (`'text' > 't'`), `IN`, `BETWEEN`. Each evades a signature looking for `1=1`. The space of equivalents is effectively infinite, so **blacklisting cannot win** (the recurring lesson of Lecture 4, Slides 35-38; Lecture 5, Slide 27).
- **Defense in depth is required.** Because any single signature can be evaded, the slide insists that input validation, IDS detection, *and* strong database and OS hardening (least privilege, patched systems, disabled dangerous features) must be **layered together**, no one of them is sufficient. The real cure (parameterization, Slide 14) removes the vulnerability entirely, but these layers mitigate residual risk.

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

**Expansion.** The attacker's toolkit of special tokens, what to look for (as a defender) and what to try (in authorised testing):

- **String delimiters** `'` `"`: break out of a string literal (the primary injection vector).
- **Comments** `--`, `#` (MySQL), `/* ... */`: truncate the rest of the query to discard trailing conditions (the password check), or to split/obfuscate a payload. Inline `/* */` comments can even be inserted *inside* keywords to evade signatures (`UN/**/ION`).
- **Concatenation** `+` (SQL Server), `||` (Oracle/standard): build strings and evade signatures (Slide 9); note `+` also encodes a space in a URL.
- **Wildcard** `%`: in `LIKE` clauses, matches anything (used in evasions and to enumerate data).
- **URL parameters**: the entry points through which payloads arrive in web apps.
- **`PRINT`**: a SQL Server command that produces output outside a transaction, useful to probe.
- **`@variable` / `@@variable`**: local and global (system) variables; `@@version`, `@@servername` leak server information.
- **`waitfor delay '0:0:10'`**: the key to **blind/time-based injection**. When the application returns no data or error (so the attacker cannot see query results directly), they inject a conditional delay: "if the first letter of the admin password is 'a', wait 10 seconds". By timing the response, the attacker extracts data one bit at a time, even with no visible output. This shows injection works even against "silent" applications.

### Slide 11 · Input Validation and Circumvention

> - Some people use PHP addslashes() function to escape characters - single quote ('), double quote ("), backslash (\\), NUL (the NULL byte)
> - This can be easily evaded by using replacements for any of the previous characters in a numeric field
> - IDS and input validation can also be circumvented by encoding - URL encoding - Unicode/UTF-8 - Hex encoding - char() function
> - MySQL Input Validation Circumvention:
>   - Inject without quotes (string = "%"): `' or username like char(37);`
>   - Inject without quotes (string = "root"): `' union select * from users where login = char(114,111,111,116);`

**Code analysis.** Why ad-hoc escaping and filtering fail, with MySQL examples:

- **`addslashes()` is not enough.** PHP's `addslashes()` backslash-escapes `'`, `"`, `\` and NUL. But (1) in a **numeric field** no quotes are needed to inject, so escaping quotes is irrelevant; and (2) historically, multibyte-charset tricks (e.g., GBK, the `0xbf27` bypass) could defeat `addslashes` entirely. Escaping is the wrong tool.
- **Encoding evasion.** A filter looking for literal dangerous characters is blinded by encoding: URL-encoding (`%27` for `'`), Unicode/UTF-8 overlong forms, hex encoding, and the SQL `char()` function that builds a string from character codes. The input passes the filter, then the database (or an earlier layer) decodes it back into the attack.
- **`char()` to avoid quotes entirely.** The MySQL examples build string constants *without any quote character*, so a filter that blocks `'`, `"` and even keywords is bypassed: `char(37)` is `%` (so `username like char(37)` matches everything); `char(114,111,111,116)` spells `root` (so `login = char(114,111,111,116)` targets the root account) and `union select * from users` pulls the whole table via a `UNION`. The lesson: because the attacker can express the payload without the characters a blacklist blocks, **no amount of character filtering is reliable**, canonicalize first (Lecture 4, Slide 41) and, above all, parameterize.

## Defending against SQL injection (pages 12-14)

### Slide 12 · Defending against SQL Injections (1)

> - Sanitize all input. - Assume all input is harmful. - Validate user input that contains dangerous keywords or SQL characters, such as "xp\_cmdshell", "--", and ";". - Consider using regular expressions to remove unwanted characters. This approach is safer than writing your own search and replace routines.
> - Run with least privilege. - Do not execute an SQL SELECT statement as "sa". Create low-privilege accounts to access data. - Use SQL permissions to lock down databases, stored procedures, and tables. - Remove unused stored procedures.

**Expansion.** The first set of defences (note these are *defense in depth*, not the primary cure, which is Slide 14):

- **Sanitize all input / assume all input is harmful** (Lecture 5's "never trust input"). Validate against expected patterns, preferably with vetted regular expressions rather than home-grown search-and-replace (which is error-prone, the phf lesson). The slide mentions blacklisting dangerous tokens (`xp_cmdshell`, `--`, `;`), but note from Slides 9-11 that blacklisting is *not* reliable on its own, hence it is only one layer.
- **Run with least privilege** (Lecture 10's core principle). The web application's database account should **not** be the super-user (`sa` in SQL Server, the equivalent of root): use a low-privilege account that can only run the specific queries it needs, with SQL `GRANT`/`REVOKE` locking down tables, procedures and databases. **Remove unused stored procedures** (especially dangerous ones like `xp_cmdshell`), to shrink the attack surface (Lecture 3, Slide 52). Then even a successful injection is confined: it cannot drop tables, read other databases, or run OS commands.

### Slide 13 · Defending against SQL Injections (2)

> - Do not allow clients to view ODBC/OLE DB error messages. Handle these errors with your own code. By default, ASP pages returns error messages to clients.
> - Enable logging of all user access, and set alerts to log all failed attempts to access objects.
> - Do not use string concatenations to build SQL queries. Instead, use parameterized queries or parameterized stored procedures, because they explicitly define input and output values and do not process multiple statements as a batch.

**Expansion.** The second set:

- **Suppress detailed database error messages to the client.** Verbose `ODBC/OLE DB` errors (returned by default in old ASP) leak the query structure, table and column names, and database type, which hugely helps an attacker craft and debug an injection (and is itself an information-disclosure flaw). Catch errors server-side and show the user a generic message, while logging the detail internally. (Recall Lecture 5, Slide 28: a page returning a SQL error is "a bad sign".)
- **Log all access and alert on failed attempts** (auditing/detection, Lecture 1, Slide 55): repeated failed access attempts are a signature of an injection probe, so logging and alerting enable detection and response even if prevention is imperfect.
- **The primary cure, stated plainly: do not build queries by string concatenation; use parameterized queries or parameterized stored procedures.** The slide gives the two reasons this works: they **explicitly separate input/output values from the query code** (so input is data, never executed), and they **do not process multiple statements as a batch** (blocking stacked-query injection, Lecture 5, Slide 19). This is the definitive fix; the code is on the next slide.

### Slide 14 · Back to the previous example (the parameterized fix)

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

**Code analysis.** The ADO.NET / C# parameterized-query fix for the vulnerable login of Slides 7-8.

- *How it works.* The query text contains named **placeholders** `@Name` and `@Password` instead of the concatenated values. The real values are supplied separately via `Parameters.Add("@Name", NameTextBox.Text)` and `Parameters.Add("@Password", PasswordTextBox.Text)`. The user input never becomes part of the query string.
- *Why it is safe (the slide's own answer).* **The SQL server knows the parameter value is data, not code.** The database parses and compiles the query template *first*, with the placeholders marking where values go; the bound values then fill those slots as pure data and are *never* parsed as SQL. So a `formusr` of `' OR 1=1 --` is looked up literally as a username equal to that whole string (and not found), rather than being executed. This is "separate code from data" (Lecture 4, Slide 33) enforced by the database engine, which is why it defeats *all* the evasion tricks of Slides 9-11 at once, no filtering or signature needed.
- *Same fix, every stack.* This is `SqlCommand.Parameters` in .NET; the equivalents are JDBC `PreparedStatement` with `?` (Lecture 5, Slide 15), PDO/mysqli prepared statements in PHP, and parameterized `cursor.execute(sql, params)` in Python. (Minor note: the fixed query reads `FROM User` while the original used `users`, a slide typo; and the application should still store only hashed passwords and handle the no-row case as "login failed".)

This closes the loop opened in Lecture 5: concatenation is the disease, parameterization is the cure, and the long detour through evasion techniques (Slides 9-11) proves *why* the cure must be parameterization rather than filtering.
