Lecture 11 covers concurrency bugs as a security problem: what a race condition is, the "window of vulnerability" between a check and an action, fixing it by making code atomic (Java `synchronized`, locks), and the security-critical **TOCTOU** (Time-Of-Check-to-Time-Of-Use) flaws on file systems (the classic setuid `mkdir`, `access`/`open`, symlink attacks). The slide deck has 25 pages. The code examples are exam-relevant.

## What a race condition is (pages 2-6)

### Slide 2 · Requirements for race condition

> - Two or more processes have access to the same object
> - Algorithm used by processes does not properly enforce an *access order*
> - At least one process modifies the object

**Expansion.** A **race condition** needs **three** ingredients simultaneously: (1) **shared access**, two or more concurrent threads/processes touch the same object (a variable, a file, a database row); (2) **no enforced ordering**, the code does not control the order in which their operations interleave; and (3) **at least one writer**, at least one of them *modifies* the object (two readers never conflict). When all three hold, the result depends on the unpredictable *timing* of the interleaving, so the program is sometimes correct and sometimes not. Remove any one ingredient (no sharing, enforced ordering via locks, or read-only access) and the race disappears. The name "race" is literal: the outcome depends on which thread "wins the race" to the object.

### Slides 3-4 · Simple Java servlet (the buggy counter)

```java
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class Counter extends HttpServlet {
    int count = 0;
    public void doGet(HttpServletRequest in, HttpServletResponse out)
            throws ServletException, IOException {
        out.setContentType("text/plain");
        PrintWriter p = out.getWriter();
        count++;                                 // (slide 4: p.println(++count + ...))
        p.println(count + " hits so far!");
    }
}
```

**Code analysis.** A hit-counter servlet, the textbook race condition.

- *Why it races.* A servlet container handles many requests **concurrently**, running `doGet` in **multiple threads at once**, all sharing the single instance field `count` (one `Counter` object serves all requests). So all three ingredients of Slide 2 are present: shared `count`, no ordering, and a writer (`count++`).
- *The bug.* `count++` (and the `++count` of Slide 4) is **not atomic**: it compiles to *read `count`, add 1, write `count` back* (three steps). If two threads run it at once, both can read the same old value (say 41), both add 1, both write 42, so **two hits are counted as one** (a *lost update*). The displayed count is wrong, and occasionally two users see the same number.
- *Slide 4* just rewrites `count++; println(count...)` as `println(++count...)`; it is **still racy**, combining the increment into the print does not make it atomic (the read-modify-write is unchanged), and it adds a second race between the increment and the read of `count` for printing. (Minor typo: the slides write `Printwriter`; the real class is `PrintWriter`.)
- *Why it matters for security*: a wrong counter is harmless, but the *same bug pattern* on a security-relevant shared value, a balance, a quota, an "isAuthenticated" flag, a reference count, is exploitable (Slides 11-12, 20). The fix is to make the update atomic (Slides 7-9).

### Slide 5 · Race Conditions (the general shape)

> - In a pre-emptively multi-tasked environment, anything can happen in-between the execution of two statements - Check if something is OK to do - Do it (perhaps the conditions have changed?)
> - Semaphores and locks are mechanisms that prevent concurrent access to, or modification of, an object by different processes

**Expansion.** In a **pre-emptively multitasked** system the scheduler can **switch threads at any point**, even between two consecutive statements, so **"anything can happen in between"**. The dangerous pattern is **check-then-act**: you *check* that something is OK, then *act* on that assumption, but between the two the condition may have **changed** (another thread modified the shared object). This is the essence of both race conditions and TOCTOU (Slide 19). The classic fix mechanisms are **locks and semaphores**: they serialise access so that the check and the act happen as one uninterruptible unit (mutual exclusion). A *semaphore* is a counter guarding a resource; a *lock/mutex* grants exclusive access to one thread at a time.

### Slide 6 · To fix race conditions

> - Race condition occurs when a certain condition assumed true does not hold
> - *Window of vulnerability*: interval of time when violation of assumption leads to incorrect behavior
> - Reduce window to zero: make relevant code atomic
> - An operation that cannot be interrupted with regards to an object is called "atomic"

**Expansion.** The fix framed precisely. A race occurs because an assumption ("the balance is still ≥ the amount I just checked") can be **falsified by another thread**. The **window of vulnerability** is the time span between establishing the assumption (the check) and relying on it (the act); during that window another thread can break it. The cure is to **shrink that window to zero** by making the check-and-act **atomic**, an **atomic** operation is one that **cannot be interrupted** with respect to the object, so no other thread can observe or modify it mid-operation. Atomicity is achieved with locks (next slides), atomic hardware instructions (compare-and-swap), or transactions (databases).

## Fixing with locks (pages 7-9)

### Slide 7 · Java synchronized

> - The synchronized keyword ensures that only a single thread will execute a statement or block at a time - Prevents thread from observing object in inconsistent state - Enforces appropriate sequencing of state transitions
> - The JVM implementation is responsible for enforcing it
> - It can have a significant impact on efficiency

**Expansion.** Java's **`synchronized`** keyword provides mutual exclusion: a thread must acquire the object's **monitor (intrinsic lock)** before entering a `synchronized` method or block, and only **one thread at a time** can hold it, so the protected code runs atomically with respect to that lock. This **prevents another thread from seeing the object in a half-updated (inconsistent) state** and enforces a well-defined ordering of state changes. The JVM guarantees the locking (and the associated memory-visibility, via the Java Memory Model). The trade-off noted on the slide: **synchronization costs performance**, threads block waiting for the lock, serialising what could be parallel work, so you synchronise the *minimum* necessary (Slide 9), not everything. Over-synchronising also risks **deadlock** (two threads each waiting for a lock the other holds).

### Slide 8 · Revised Java servlet (synchronized method)

```java
public class Counter extends HttpServlet {
    int count = 0;
    public synchronized void doGet(HttpServletRequest in, HttpServletResponse out)
            throws ServletException, IOException {
        out.setContentType("text/plain");
        PrintWriter p = out.getWriter();
        count++;
        p.println(count + " hits so far!");
    }
}
```

**Code analysis.** The first fix: declare the whole `doGet` method **`synchronized`**. Now only one thread executes `doGet` at a time (holding the lock on the `Counter` instance), so the read-modify-write of `count` is atomic and no hits are lost.

- *The downside.* Synchronising the **entire method** serialises *everything* in it, including the slow I/O (`setContentType`, `getWriter`, `println` writing to the network). While one request is slowly writing its response, **all other requests block**, destroying concurrency and throughput, a performance (and availability) problem. Only the tiny `count++` actually needs protection. (Minor typo: the slide capitalises `Public`; Java keywords are lowercase.)
- *Lesson*: correct but too coarse; the next slide narrows the lock.

### Slide 9 · Improved Java servlet (synchronized block)

```java
public class Counter extends HttpServlet {
    int count = 0;
    public void doGet(HttpServletRequest in, HttpServletResponse out)
            throws ServletException, IOException {
        int my_count;
        out.setContentType("text/plain");
        PrintWriter p = out.getWriter();
        synchronized (this) {
            my_count = ++count;        // only the shared update is locked
        }
        p.println(my_count + " hits so far!");
    }
}
```

**Code analysis.** The better fix: a **`synchronized` block** around *only* the critical section.

- *How it works.* Only `my_count = ++count;` runs under the lock, the one operation that touches the shared `count`. The increment is atomic *and* the current value is captured into the **thread-local** variable `my_count` while still holding the lock. The slow I/O (`println`) happens **outside** the lock, using the private `my_count`, so requests no longer block each other during I/O.
- *Why `my_count` matters.* Reading `count` again for the `println` (as in Slide 8) would be a *second*, unprotected access, another race (the value could change between the increment and the print). Capturing it into `my_count` inside the lock guarantees each request prints the exact value it produced.
- *The principle*: **make the critical section as small as possible**, protect exactly the shared-state access and nothing more. This maximises concurrency while eliminating the race. (Modern Java would prefer `AtomicInteger count; int my_count = count.incrementAndGet();`, a lock-free atomic.)

## More examples of races (pages 10-13)

### Slide 10 · Other Example Race Condition (chmod)

> - User 1 creates a file with world-writable permissions
> - User 1 wants to change the permissions to exclude others with `chmod 700 filename`
> - User 2 tries to overwrite the file in-between
> - Will user 1 or user 2 succeed? - User 1 should have set the umask correctly!

**Expansion.** A filesystem race. User 1 creates a file that is momentarily **world-writable**, then runs `chmod 700` to lock it down. But there is a **window** between creation and the `chmod` during which the file *is* writable by everyone, so User 2 can race in and overwrite it. Whether User 2 succeeds depends on timing. The fix ("set the `umask` correctly") is to **create the file secure from the start**: the `umask` (user file-creation mask) removes permission bits at creation time, so with a correct umask the file is *never* world-writable, there is no insecure window to race against. This is the "secure defaults / fail securely" principle (Lecture 10): establish the secure state atomically at creation, rather than creating-then-fixing with a gap in between.

### Slide 11 · Database Race Condition

> - If (condition for field 1) then do something to field 2
> - However process 2 changes field 1 in-between...
> - Result: invalid combination of values (e.g., bank account balance)

**Expansion.** The check-then-act race in a database. Process 1 checks a condition on `field 1`, then updates `field 2` based on it, but Process 2 modifies `field 1` in the window between, so the update to `field 2` is now based on a stale condition, leaving an **invalid combination of values** (a broken invariant, e.g., a bank balance inconsistent with its transaction log). This is why databases provide **transactions** with isolation levels and locking (`SELECT ... FOR UPDATE`, serializable isolation): they make the check-and-act atomic at the database level, so no concurrent transaction can slip in between. Application-level check-then-act on database data, without a transaction, is a classic race.

### Slide 12 · Example Race Condition (overdraft)

> - Two processes: red and blue
> - Red: Check that user 1 has enough money to pay check #y
> - Blue: Check that user 1 has enough money to pay check #x
> - Red: Pay check #y
> - Is there really enough money to pay check #x?

**Expansion.** A concrete, exploitable check-then-act race, the classic **double-spend / overdraft**. Both processes *check* the balance (say €100, enough for either check alone), **both checks pass** because neither has deducted yet, then both *pay* (deduct €100 each), overdrawing the account to -€100. The invariant "never pay more than the balance" is violated because the two **check-then-act** sequences interleaved. This is the real-world version of the servlet `count++` bug, and the same class as the "spending the same money twice" warning in the Lecture 1 `decrease` function. It is exploitable: an attacker *deliberately* fires concurrent requests to win the race (concurrent withdrawals, coupon redemptions, voting). The fix: make check-and-deduct atomic (a locked critical section or a database transaction with proper isolation).

### Slide 13 · Effects of Race Conditions

> - Normally: race conditions show up as periodic errors; frequency of the error will depend upon how likely the 'bad' order is to occur; it is often hard to get race condition errors to repeat
> - When exploited: crackers can attempt to force the particular conditions that will produce a flaw; depending upon the exact form of the flaw, it may be produced with high probability; most common (mis)use: modify the value of some shared object

**Expansion.** Why races are dangerous *and* hard to catch:

- **Normally** (as a reliability bug) races produce **intermittent, non-reproducible** errors, they occur only on the rare "bad" interleaving, with a frequency depending on timing, and are notoriously **hard to reproduce and debug** (they may vanish under a debugger that changes timing, a "Heisenbug").
- **When exploited**, the attacker turns this around: instead of waiting for the rare bad interleaving, they **deliberately force** it, by hammering the system with concurrent requests, slowing a step (Slide 15's `nice`), or widening the window, so an event that is "rare" by accident becomes **reliably reproducible** on demand. The **most common exploit** is to **modify a shared object** at the critical moment (a balance, a filename, a permission). This is why a race condition that looks like a harmless flaky bug can be a serious, repeatably-exploitable vulnerability.

## The mkdir TOCTOU attack (pages 14-17)

### Slide 14 · Example: mkdir (the non-atomic sequence)

> mkdir is actually a fairly complex sequence of actions. Here are some of the actions triggered by mkdir under an early implementation for a Unix system:
>
> - Superuser creates a directory object dir
> - Permissions are set to 777.
> - Superuser does a chown to change the ownership of the directory to the calling user.
> - Modify permissions via umask(2) to match the environment umask value.
>
> Can you spot the problem??

**Expansion.** The classic setuid race. On old Unix, `mkdir` was a **setuid-root** program (it had to be, because creating a directory entry requires privilege). But it did its job in **several separate, non-atomic steps**: (1) create the directory object `dir`, (2) set its permissions to 777 (world-everything), (3) `chown` it to the user who invoked `mkdir`, (4) apply the umask. The crucial flaw: between step 1/2 (the directory exists, owned by **root**) and step 3 (ownership transferred to the user), there is a **window** in which a root-owned object exists at a name the attacker knows. Because these steps are **not atomic**, an attacker can interfere in the gap, the "can you spot the problem?" is answered on the next two slides.

### Slide 15 · One difficulty (the exploitation setup)

> From the man pages: The mkdir command creates specified directories in mode 777. The directories are then modified by umask(2), according to how you have set up umask.
>
> Patient crackers can automate a process to exploit this race condition to obtain ownership of file. Here is a well-known method:
>
> - Find a writable directory
> - Start a scanning program that will look for creation of /tmp/junk
> - Start up mkdir /tmp/junk and use nice to cause it to run slowly in the background.
> - Move scanner to foreground.

**Expansion.** How the attacker **widens and wins** the race (recall Slide 13: force the bad timing). The attacker runs `mkdir /tmp/junk` but uses **`nice`** to lower its scheduling priority so it runs **slowly**, deliberately **stretching the window of vulnerability** between the steps of Slide 14. Meanwhile a fast **scanner** program watches for the moment `/tmp/junk` is created (step 1, owned by root). By moving the scanner to the foreground (high priority) and the slow `mkdir` to the background, the attacker makes it very likely the scanner acts **inside the window**. This is the general technique for exploiting races: slow down the victim, run fast, and arrange to act between the check/creation and the use.

### Slide 16 · Flaw continued (the symlink substitution)

> When the scanner spots the new directory:
>
> 1. Remove the original /tmp/junk
> 2. Create a link from the secret file you want to /tmp/junk
>
> Suppose the scanner's link in (2) beat the mkdir's chown. Now mkdir will change the ownership of the secret file to cracker.

**Code analysis.** The payoff of the race, a **symlink attack**.

- *The exploit.* The instant the scanner sees `/tmp/junk` created (step 1 of `mkdir`, owned by root), it (1) **deletes** the real `/tmp/junk` and (2) creates a **symbolic link** named `/tmp/junk` pointing at a **secret file the attacker wants to own** (e.g., `/etc/passwd`). If this wins the race, i.e., happens *before* `mkdir` performs its `chown` (step 3), then **`mkdir`'s `chown` follows the symlink and changes the ownership of the target secret file to the attacker**. The attacker now owns a file they should never control, a privilege escalation. `mkdir` was tricked because the *name* `/tmp/junk` referred to the root-created directory at check time but to the attacker's symlink at use time: a textbook **TOCTOU** (Slide 19).
- *Why it works.* The vulnerability is operating on a **filename** (which can be swapped out from under you) rather than on a stable handle, and performing the privileged `chown` on whatever that name resolves to *at that moment*.
- *The fix.* Make the operation atomic / remove the race: create the directory **already owned correctly** (modern `mkdir` uses the `mkdir(2)` syscall which creates with the caller's ownership and the mode masked by umask in one atomic kernel operation, no separate chown step, no window); never `chown` a path that an unprivileged user controls; use `O_NOFOLLOW`/`lstat` and operate on file descriptors, not names (Slide 23); and avoid predictable names in shared directories (Slide 24).

### Slide 17 · Why do these problems arise?

> - Problem: there are many of these race conditions in operating systems. Many occur in common system utilities. - It is a lot of trouble to identify and then fix them. Often the fix will cause systems to run slower, since it is necessary to coordinate access. Most sites do not have anyone with the time or ability to do so properly.
> - The above explains why it is important that all users of a system be trustworthy.

**Expansion.** Two sobering observations. First, race conditions are **pervasive** in OS code and common utilities, **hard to find** (intermittent, Slide 13) and **hard to fix** (correct synchronization/coordination is difficult and often **slows the system**, the performance cost of Slide 7), and many organisations lack the expertise to fix them properly. Second, the historical consequence: because so many setuid utilities had local-privilege-escalation races, **local users had to be trusted**, these attacks require a *local* account to run the scanner and the slow victim. This is exactly why multi-user systems treated local access as a significant privilege, and why the shift to single-user machines and sandboxing changed the threat model.

## TOCTOU in general (pages 18-25)

### Slide 18 · Yet another example (encryption buffer reuse)

> Using same buffer for plaintext and ciphertext
>
> - Load buffer with plaintext
> - Encrypt buffer
> - Send buffer contents to recipient
>
> Looks harmless, until in multithreaded application, last two steps swapped and plaintext is sent. Impossible? Not for Internet Information Server 4 when using SSL (occasional unencrypted packet sent). Use two buffers, zeroing out the ciphertext buffer across calls

**Code analysis.** A race with a **confidentiality** impact.

- *The intended sequence.* One buffer is reused: load it with plaintext, encrypt it in place, send the (now encrypted) contents.
- *The race.* In a **multithreaded** server, the ordering of "encrypt" and "send" is not guaranteed across threads, or the buffer is shared between requests, so occasionally the **send happens before the encryption completes** (or reads a buffer another thread has refilled with plaintext), and **plaintext is transmitted instead of ciphertext**. The secret leaks onto the network. This is not hypothetical: **Microsoft IIS 4 over SSL** did exactly this, occasionally sending an **unencrypted packet**, a serious confidentiality breach from a timing bug.
- *The fix.* Do **not share one buffer** between the plaintext and ciphertext roles across concurrent calls: use **two separate buffers** (so a send can never pick up un-encrypted data), and **zero out the ciphertext buffer between calls** (so stale plaintext/ciphertext cannot leak, the data-hygiene point of Lecture 10, Slides 14 and 30). More generally, do not share mutable state between concurrent requests without synchronization.

### Slide 19 · Race condition vs TOCTOU

> - Race condition aka data race is a common type of bug in concurrent programs - basically: two execution threads mess with the same variable at the same time - not necessarily a security bug
> - Non-atomic check and use aka TOCTOU (Time Of Check, Time of Use) a closely related type of security flaw - Problem: some precondition required for an action is invalidated between the time it is checked and the time the action is performed - typically, this precondition is an access control condition - typically, it involves some concurrency

**Expansion.** The key conceptual distinction:

- A **data race / race condition** is the general concurrency bug, two threads access the same variable concurrently with at least one writing (Slide 2). It is **not necessarily a security bug** (the hit counter is just wrong, not insecure).
- **TOCTOU (Time-Of-Check to Time-Of-Use)** is the **security-relevant** special case (CWE-367): a **precondition is checked, then relied upon for an action, but is invalidated in between**. Crucially, the invalidated precondition is **typically an access-control condition** ("this file is mine", "I have permission", "the balance is sufficient"), so the race lets the attacker **bypass a security check**. It "typically involves concurrency" (the attacker's thread changes the state in the gap), though on a filesystem even a single process can be raced by an external attacker swapping a symlink.

All the file examples (mkdir, chmod, access/open) are TOCTOU: check a name/permission, then act on it, with the attacker changing what the name points to in between.

### Slide 20 · Race condition (x = x+1 and banking)

> - Two concurrent execution threads both execute the statement `x = x+1;` where x initially has the value 0.
> - What is the value of x in the end? Answer: x can have the value 2 or 1
> - The root cause of the problem is that x = x+1 is not an atomic operation, but happens in two steps, reading x and assigning the new value, which may be interleaved in unexpected ways
> - Why can this lead to security problems? Think of internet banking, and running two simultaneous sessions with the same bank account… Do try this at home!

**Code analysis.** The minimal race, the same bug as the counter (Slide 3), stated at its core.

- *Why `x` can be 1 instead of 2.* `x = x+1` is **not atomic**: it is *read `x`, compute `x+1`, write back*. Correct interleaving (thread A fully, then B) gives 2. But if both threads **read `x` (=0) before either writes**, both compute 1 and both write 1, so the final value is **1, a lost update**. The outcome depends on the interleaving.
- *The security angle ("do try this at home").* Replace `x` with a **bank balance** and run **two simultaneous sessions/requests** on the same account: the lost-update race becomes the overdraft/double-spend of Slide 12. Many real financial and e-commerce bugs (withdrawing twice, redeeming a voucher twice, exceeding a limit) are exactly this `x = x+1` race at the database/application layer. The fix is atomicity: a database transaction, an atomic increment, or a lock around the read-modify-write.

### Slide 21 · Classic example: mkdir on Unix (summary)

> - mkdir is setuid root, ie. executes as root
> - It creates new directory non-atomically, in two steps: 1. creates the directory, with owner is root; 2. sets the owner, to whoever invoked mkdir
> - Attack: by creating a symbolic link between steps 1 and 2, attacker can own any file

**Expansion.** A concise restatement of the `mkdir` TOCTOU of Slides 14-16: a **setuid-root** program performs a privileged operation **non-atomically** (create-as-root, then chown-to-user), and the attacker slips a **symbolic link** into the gap so the privileged `chown` retargets a file of their choosing, letting them **own any file**. It is the canonical TOCTOU/symlink attack, memorise this pattern: *setuid program + non-atomic privileged operation on a filename + attacker-controlled symlink in the window*.

### Slide 22 · Other classic UNIX race conditions

> - lpr - print utility with option to remove file after printing - could be used to delete arbitrary files
> - but this still happens - CVE-2003-1073: A race condition in the at command for Solaris 2.6 through 9 allows local users to delete arbitrary files via the -r argument with .. sequences in the job name, then modifying the directory structure after at checks permissions to delete the file and before the deletion actually takes place
> - Combination of race condition with failure to check that file names do not contain ..

**Expansion.** More real TOCTOU bugs, showing the pattern recurs:

- **`lpr`** (printer utility) had an option to delete a file after printing; by racing a symlink, it could be made to **delete arbitrary files** the user should not be able to touch.
- **CVE-2003-1073** (`at` on Solaris) is a documented example that "still happens": `at` **checked permissions** to delete a file, and the attacker then **modified the directory structure** (via `..` path components in the job name) **before the deletion actually occurred**, redirecting the delete to an arbitrary file, a textbook check-then-act window. It also combines the race with a **path-traversal** failure (not rejecting `..`, Lecture 5, Slide 24), showing how two weaknesses compound (as in the Lecture 4 cfingerd case).

### Slide 23 · Example race condition (access / open)

```c
const char *filename = "/tmp/erik";
if (access(filename, R_OK) != 0) {
    ... // handle error and exit;
}
// file exists and we have access
int fd = open(filename, O_RDONLY);
...
```

> Between calls to access and open the file might be removed!

**Code analysis.** The textbook C TOCTOU, the `access`/`open` race (the slide's code shows a stray "int fd" merged into the comment; the real second step is `int fd = open(filename, O_RDONLY);`).

- *What it tries to do.* `access(filename, R_OK)` **checks** whether the *real* user has read permission on the file (it uses the real UID, often used by setuid programs to "check on behalf of the invoking user"). If the check passes, the program **opens** the file.
- *The TOCTOU flaw.* Between the `access` **check** and the `open` **use**, the file the *name* refers to can **change**: the attacker can delete `/tmp/erik` and replace it with a **symlink to a sensitive file** (e.g., `/etc/shadow`). The `access` check passed for the original file, but `open` now opens the *substituted* target, which the user should not be able to read. The check and the use apply to **different files**, bypassing the permission check.
- *The fix.* **Never check a name and then act on the name separately.** Instead: `open` the file **once** (operating on the returned **file descriptor**, which is bound to the actual object, not the name), then check permissions on the *descriptor* with `fstat`; and use flags like `O_NOFOLLOW` to refuse symlinks. Avoid `access()` entirely for this purpose, it exists only for the unusual setuid "check as real user" case and is a classic TOCTOU trap. Operating on descriptors (handles), not filenames, closes the window.

### Slide 24 · Race condition & file systems

> Signs of trouble:
>
> - Access to files using filenames rather than file handles or file descriptors - filenames may point to different files at different moments in time
> - Creating files or directories in publicly accessible places, for instance /tmp - Especially if these have predictable file names

**Expansion.** The two red flags for filesystem races, a practical checklist:

- **Operating on filenames instead of file descriptors.** A **filename is not a stable reference**, the file it names can be replaced (deleted and re-created, symlinked) between two operations, which is the root of every TOCTOU above. A **file descriptor** (or handle) is bound to the actual file object at open time and cannot be swapped, so once you have opened a file, do all further checks and operations on the *descriptor* (`fstat`, `fchmod`, `read`), not the name.
- **Creating files in shared, world-writable directories like `/tmp`, especially with predictable names.** If an attacker can **predict the filename** your program will use in `/tmp`, they can **pre-create it** (as a symlink, or with their own permissions) before you do, hijacking it. Defences: use the atomic, exclusive creation flag **`O_CREAT | O_EXCL`** (which fails if the file already exists, defeating pre-creation), use `mkstemp()` which creates a file with an **unpredictable** name securely, set a correct **umask** (Slide 10), and prefer a private directory over `/tmp`.

### Slide 25 · Promising future for data races?

> - Trend: more multi-CPU machines - to keep improving computer power in accordance with Moore's Law, despite physical constraints
> - Hence: more multi-threaded software - to take advantage of max. available computing power
> - Hence: many problems with data races in code - as programmers cannot cope with concurrency - writing correct concurrent programs is hard
> - \[Interesting article to read: "The free lunch is over: a fundamental turn toward concurrency in software", by Herb Sutter\]

**Expansion.** A forward-looking warning (ironically titled, the "promising future" is for *attackers*). The hardware trend is **more cores, not faster cores**: physical limits (power, heat) ended the era of ever-rising clock speeds, so performance gains now come from **parallelism** (multi-CPU, multi-core). To use that power, software must be **multi-threaded**, which means **more concurrency, hence more data races**, because **writing correct concurrent code is genuinely hard** and most programmers get it wrong. So the number of race-condition (and TOCTOU) bugs is expected to *grow*, making this an increasingly important class of vulnerability. Herb Sutter's influential 2005 essay **"The Free Lunch Is Over"** made exactly this argument: programs no longer get faster for free with each CPU generation, developers must embrace concurrency, and with it, concurrency's bugs. The modern response: safer concurrency models (immutability, message passing, async/await), languages that prevent data races at compile time (Rust's ownership and `Send`/`Sync`), and race detectors (ThreadSanitizer, Lecture 6).
