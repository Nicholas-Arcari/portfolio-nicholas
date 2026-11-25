## Recap of the Read-One Write-All regular register and its limits

### What is the Read-One Write-All (ROWA) algorithm, and how does it work?

The Read-One Write-All (ROWA) algorithm implements a single-writer, multi-reader $(1,N)$ regular register in the fail-stop model, with a perfect failure detector $\mathcal{P}$. The register is a shared variable initialized to $\bot$ (or $0$), written by one designated process $p_0$ and read by all the $N$ processes.

The two operations work as follows:

- **Write operation:** when it invokes `write(v)`, the writer $p_0$ sends the message `[WRITE, v]` to all the processes of $\Pi$ (itself included) with best-effort broadcast ($\text{BEB}$). Each process that receives it updates its local variable, $\mathit{val} := v$, and sends an acknowledgment `ACK` back to $p_0$ on a point-to-point link. The writer terminates the write (returning a confirmation) only after receiving the acknowledgments of all the processes that the failure detector has not detected as crashed (the set `correct`).
- **Read operation:** when it invokes `read()`, any reader $p_i$ just returns the value stored in its local variable $\mathit{val}$, without any communication.

### What are the message and step complexity of the ROWA algorithm?

- **Write, messages:** a write generates $2N$ point-to-point messages when there are no failures ($N$ messages for the dissemination with best-effort broadcast, plus $N$ acknowledgments back to the writer).
- **Write, steps:** exactly $2$ communication steps ($1$ step to disseminate the value, and $1$ step to collect the acknowledgments).
- **Read, messages:** $0$ messages. Reading is strictly local.
- **Read, steps:** $0$ communication steps.

### How does ROWA handle process crashes with a perfect failure detector $\mathcal{P}$?

The ROWA algorithm tolerates any number of crashes: up to $N - 1$, and formally its properties are not violated even if all the $N$ processes crash (if nobody is left, nobody can observe a violation). The reason is that the system has a perfect failure detector $\mathcal{P}$, which satisfies strong completeness (eventually every crashed process is permanently detected by every correct process) and strong accuracy (no process is detected before it crashes): the writer never waits forever for the acknowledgment of a crashed process, and it never stops waiting for a process that is alive.

When a process $p_k$ crashes, $\mathcal{P}$ eventually triggers the event `Crash` for $p_k$ at $p_0$, and $p_0$ removes $p_k$ from the set `correct`. Consequently, $p_0$ completes its write as soon as it has the acknowledgments of all the processes that are still in `correct`. A reader does not care about the crashes of the others at all, because it reads locally.

### What happens in an execution in which the writer crashes?

Consider an execution with the writer $p_0$ and the readers $p_1, p_2, p_3$:

1. $p_0$ invokes `write(5)` and starts the best-effort broadcast.
2. The message `[WRITE, 5]` reaches $p_1$ and $p_2$, which update their local copies to $5$ and send their acknowledgments.
3. Before the message for $p_3$ is delivered, the writer $p_0$ crashes. Since the source of the broadcast is faulty, that message can be lost. The write is never completed: it is a failed operation.
4. The reader $p_3$, which never receives the update, reads its local copy and returns $\bot$, now and forever.
5. The reader $p_1$, which has updated its local copy, reads $5$.

This behavior is allowed by regular consistency. Because the write failed in the middle of its execution, it is concurrent with all the subsequent reads, and a read that is concurrent with a write may return either the old value ($\bot$) or the value being written ($5$).

### Why does ROWA fail with an eventually perfect failure detector ($\diamond\mathcal{P}$)?

The ROWA algorithm is no longer correct if the perfect failure detector $\mathcal{P}$ is replaced by an eventually perfect failure detector $\diamond\mathcal{P}$. In an eventually synchronous system, before the global stabilization time ($\mathrm{GST}$), $\diamond\mathcal{P}$ can wrongly suspect correct processes, because of arbitrary network delays.

Consider the following scenario in a system of two processes ($p_0$ is the writer, $p_1$ is a reader):

1. $p_0$ invokes `write(5)` and sends `[WRITE, 5]` to $p_1$ and to itself. $p_0$ receives its own acknowledgment.
2. Because of a transient delay before $\mathrm{GST}$, $\diamond\mathcal{P}$ at $p_0$ wrongly suspects $p_1$.
3. Process $p_0$ updates $\text{correct} := \{p_0\}$, sees that it has received the acknowledgments of all the processes in `correct`, and terminates `write(5)` too early.
4. After `write(5)` has returned, $p_1$ (which is perfectly alive) invokes `read()`.
5. Because the message `[WRITE, 5]` is still in transit, $p_1$ reads its local copy and returns $\bot$.

This violates the validity of the regular register: a read that follows a completed write **must** return the value of that write (or of a later one). Returning $\bot$ after `write(5)` has returned is a safety violation. The problem is that the set `correct` can be wrong, so the writer can return from a write before having imposed its value on the other processes.

## Majority Voting: a regular register in the fail-silent model

### How can a regular register be implemented in a fail-silent asynchronous system, without a failure detector?

In a fail-silent system there is no failure detector at all (neither $\mathcal{P}$ nor $\diamond\mathcal{P}$): the system is asynchronous, and crashes cannot be detected. To implement a $(1,N)$ regular register without timing assumptions, failure detection is replaced by an assumption on the number of failures: a **majority of the processes is correct**, that is, $f < N/2$. The algorithm uses perfect point-to-point links and best-effort broadcast.

### What is a quorum, and why is the assumption of a majority of correct processes ($f < N/2$) critical?

In a system of $N$ processes, a **quorum** $Q$ is any subset of processes of size: $$|Q| \ge \left\lfloor \frac{N}{2} \right\rfloor + 1$$

Quorum-based algorithms rely on the **intersection property of quorums:** $$\forall Q_1, Q_2 \subseteq \Pi \text{ such that } |Q_1| \ge \left\lfloor \frac{N}{2} \right\rfloor + 1 \text{ and } |Q_2| \ge \left\lfloor \frac{N}{2} \right\rfloor + 1 \implies Q_1 \cap Q_2 \neq \emptyset$$

Any two quorums intersect in at least one process. When the number of crashes is bounded by $f < N/2$, the set of all the correct processes is itself a quorum $Q_{\text{correct}}$, of size at least $\lfloor N/2 \rfloor + 1$: an operation that waits for the answers of a quorum always terminates. Moreover, any quorum contacted by a write ($Q_{\text{write}}$) and any quorum contacted by a read ($Q_{\text{read}}$) share at least one process: $$Q_{\text{write}} \cap Q_{\text{read}} \neq \emptyset$$

This intersection guarantees that a reader that contacts a majority always meets at least one process that has seen, and stored, the value of the last completed write.

### Why is reading the local copy not enough any more, and why are timestamps needed?

The write starts as in ROWA: the writer broadcasts the value, and every process that receives it stores it and sends an acknowledgment. Since crashes cannot be detected, however, the writer cannot wait for everybody: it returns as soon as it has the acknowledgments of a majority. This changes two things.

- **The read cannot be local.** When the write returns, the processes outside the majority that acknowledged it may not have received the value yet, because their messages are slow. If one of them read its local copy, it would return the old value after the end of the write, which is not regular. So the reader must ask too: it broadcasts a request, and it waits for the values stored by a majority of processes. By the intersection property, at least one of the answers comes from a process that has seen the last completed write.
- **The reader needs a way to choose.** Suppose that the writer writes $1$ and then $2$, and that the second write is acknowledged by a different majority. A reader can then find both values among the answers, and it must be able to tell which one is the more recent. For this reason the writer attaches a **timestamp** (a sequence number) to every value it writes, and the reader returns the value with the highest timestamp among those it has received.

The majority that answers is called a set of **witnesses** of the value, and it can be different for every operation. The algorithm is called Majority Voting because the processes of a majority, so to speak, vote for the value of the register.

### What is the Majority Voting algorithm for a $(1,N)$ regular register?

The Majority Voting algorithm lets a single writer and $N$ readers maintain a regular register in an asynchronous, fail-silent system.

``` Majority Voting: (1, N) regular register
upon event < onrr, Init > do
  (ts, val) := (0, ⊥);
  wts := 0;
  acks := 0;
  rid := 0;
  readlist := [⊥]^N;

upon event < onrr, Write | v > do
  wts := wts + 1;
  acks := 0;
  trigger < beb, Broadcast | [WRITE, wts, v] >;

upon event < beb, Deliver | p, [WRITE, ts', v'] > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < pl, Send | p, [ACK, ts'] >;

upon event < pl, Deliver | q, [ACK, ts'] > such that ts' = wts do
  acks := acks + 1;
  if acks > N/2 then
    acks := 0;
    trigger < onrr, WriteReturn >;

upon event < onrr, Read > do
  rid := rid + 1;
  readlist := [⊥]^N;
  trigger < beb, Broadcast | [READ, rid] >;

upon event < beb, Deliver | p, [READ, r] > do
  trigger < pl, Send | p, [VALUE, r, ts, val] >;

upon event < pl, Deliver | q, [VALUE, r, ts', v'] > such that r = rid do
  readlist[q] := (ts', v');
  if #(readlist) > N/2 then
    v := highestval(readlist);
    readlist := [⊥]^N;
    trigger < onrr, ReadReturn | v >;
```

**Explanation of the variables and of the handlers:**

- **Initialization:**
  - `(ts, val)`: the local copy of the register at each process, together with the timestamp of the value; initially it is $(0, \bot)$.
  - `wts`: the timestamp of the writes, used only by the writer and incremented at every write.
  - `acks`: the counter of the acknowledgments received for the current write.
  - `rid`: a counter that identifies the reads of a process.
  - `readlist`: an array of $N$ positions, in which a reader stores the pairs (timestamp, value) received from the witnesses during a read.
- **Start of a write:** the writer increments `wts`, resets `acks` to $0$, and sends `[WRITE, wts, v]` to everybody with best-effort broadcast.
- **Serving a write:** a process that receives `[WRITE, ts', v']` compares `ts'` with its local `ts`. If `ts' > ts`, it adopts the pair: `(ts, val) := (ts', v')`. In any case it sends `[ACK, ts']` back to the writer. An old `WRITE` message, which arrives after a more recent one, does not overwrite the local state, but it is acknowledged all the same.
- **End of a write:** the writer counts only the acknowledgments that carry the timestamp of the current write (`ts' = wts`), so that it is not confused by the late acknowledgments of previous writes. When `acks > N/2`, that is, when a majority has acknowledged, the writer resets `acks` and triggers `WriteReturn`.
- **Start of a read:** the reader increments `rid`, empties `readlist`, and sends `[READ, rid]` to everybody with best-effort broadcast.
- **Serving a read:** a process that receives `[READ, r]` answers with `[VALUE, r, ts, val]`: its current timestamp and value, together with the identifier of the read.
- **End of a read:** the reader accepts only the answers to its current read (`r = rid`), and stores each of them in `readlist[q]`. When the positions of `readlist` that are different from $\bot$ are a majority (`#(readlist) > N/2`), the reader takes the value with the highest timestamp (`highestval(readlist)`), empties `readlist`, and returns that value.

The identifier `rid` plays for the reads the role that `wts` plays for the writes. Without it, the late answers to an old read could be counted among the answers to a new read, which could then return without having heard from a fresh majority.

### What are the message complexity, the step complexity and the resilience of the Majority Voting algorithm?

- **Write, messages:** at most $2N$ messages ($N$ for the broadcast plus $N$ acknowledgments).
- **Write, steps:** $2$ communication steps (the broadcast, then the acknowledgments of a quorum).
- **Read, messages:** at most $2N$ messages ($N$ for the read request plus $N$ answers with the values).
- **Read, steps:** $2$ communication steps (the request, then the answers of a quorum).
- **Resilience:** $f < N/2$. The algorithm tolerates up to $\lfloor (N-1)/2 \rfloor$ crashes.

Compared with ROWA, doing without the failure detector is paid twice: with one more assumption (the majority of correct processes), and with reads that are no longer free ($2N$ messages and $2$ steps instead of $0$).

### What happens to safety and liveness if the crashes are not a minority ($f \ge N/2$)?

If the number of crashes reaches half of the processes ($f \ge N/2$), a quorum of $\lfloor N/2 \rfloor + 1$ answers can no longer be collected.

- **Liveness:** it is lost. Writers and readers remain blocked forever, waiting for answers that will never arrive: in a system of $10$ processes with $5$ crashes, the counter of the acknowledgments can reach at most $5$, and the condition `acks > N/2` never becomes true.
- **Safety:** it is **preserved**. A blocked operation does not return, so it cannot return a wrong value. An algorithm based on majorities, if it is well designed, fails in this way: it stops, but it never gives a wrong answer.

## Consistency conditions for registers: regular, sequential and atomic

### What are the definitions of regular consistency, sequential consistency and linearizability?

A register offers the operations `write(v)` and `read()`, each of which takes an interval of time between its invocation $\text{inv}(O)$ and its return $\text{ret}(O)$. As in the previous lecture, $O_1$ precedes $O_2$ if $\text{ret}(O_1) < \text{inv}(O_2)$, and two operations are concurrent if their intervals overlap.

The three consistency conditions of the course are:

- **Regular consistency:**
  - **Termination:** every operation invoked by a correct process eventually completes.
  - **Validity:** a read that is not concurrent with any write returns the value of the last write completed before it. A read that is concurrent with one or more writes returns either the value of the last completed write or the value of one of the concurrent writes.
- **Sequential consistency** (Lamport, 1979): "the result of any execution is the same as if the (read and write) operations by all processes on the data store were executed in some sequential order and the operations of each individual process appear in this sequence in the order specified by its program". In other words, an execution is sequentially consistent if all its operations can be arranged in one global sequence $G$ such that:
  - $G$ respects the local order of the operations of each process;
  - each read returns the value of the most recent write that precedes it in $G$ (the initial value, if there is none).
- **Linearizability (atomic consistency):** an execution is linearizable (atomic) if each operation $O$ appears to take effect instantaneously at some moment between its invocation and its return, that is, inside the interval $[\text{inv}(O), \text{ret}(O)]$. This moment is the **linearization point** of the operation. The operations, taken in the order of their linearization points, must form a correct sequential execution: each read returns the value of the last write whose linearization point comes before its own.

The sequence $G$ of sequential consistency is fictional: it does not have to respect the order in which the operations of different processes happen in real time. It is enough that it exists. Sequential consistency gives each process the illusion of using a single storage, accessed one operation at a time: a process that sees only the register cannot distinguish a sequentially consistent execution from one in which the accesses are really serialized with a lock, even though nobody takes any lock.

### What are the relations between regular, sequential and atomic consistency?

- **Atomic consistency $\implies$ sequential consistency:** every linearizable execution is sequentially consistent, because the linearization points, taken in order, define a global sequence $G$ that respects the local order of every process.
- **Atomic consistency $\implies$ regular consistency:** every linearizable execution is regular. The linearization point of a write falls inside the write, so a read that starts after the end of the write has its linearization point after that of the write, and it cannot return an older value. A read that is concurrent with the write returns the old value or the new one, according to the position of its linearization point, and both are allowed by the regular semantics.
- **Regular consistency and sequential consistency are not comparable:**
  - Regular consistency $\nRightarrow$ sequential consistency.
  - Sequential consistency $\nRightarrow$ regular consistency.

So atomic consistency is the strongest of the three: it implies both the others, while the other two do not imply each other, and neither of them implies atomic consistency.

### Why are regular consistency and sequential consistency not comparable?

- **An execution that is sequentially consistent but not regular:** process $p_1$ writes $5$. After the write has completed, process $p_2$ reads and obtains $\bot$; a third process $p_3$ reads $5$. The execution is not regular, because the read of $p_2$ is not concurrent with the write and should return $5$. It is sequentially consistent, though: in the global sequence `read() → ⊥`, `write(5)`, `read() → 5` every read returns the right value, and no local order is violated, because the three operations belong to three different processes. The sequence differs from what happened in real time, but this is allowed.
- **An execution that is regular but not sequentially consistent:** process $p_0$ writes $5$. During the write, process $p_1$ performs two reads one after the other: the first returns $5$, the second returns $\bot$. The execution is regular, because both reads are concurrent with the write, and each of them may return either $\bot$ or $5$. It is not sequentially consistent: $G$ must keep the two reads of $p_1$ in their local order, so there are only three candidates, and all of them fail.
  - `write(5)`, `read() → 5`, `read() → ⊥`: the second read cannot return $\bot$ after the write.
  - `read() → 5`, `write(5)`, `read() → ⊥`: the first read cannot return $5$ before the write, and the second one cannot return $\bot$ after it.
  - `read() → 5`, `read() → ⊥`, `write(5)`: the first read cannot return $5$ before the write.

### Why is atomic consistency strictly stronger than the other two?

There are executions that are both regular and sequentially consistent, and still not atomic. Process $p_0$ writes $5$. Process $p_1$ performs three reads in sequence, which return $\bot$, $5$ and $5$; the first two are concurrent with the write. Process $p_2$ performs one read, which starts after the end of the second read of $p_1$, while the write is still in progress, and which returns $\bot$.

- **Regular:** yes. The read of $p_2$ is concurrent with the write, so it may return $\bot$.
- **Sequentially consistent:** yes, with the global sequence in which $p_2$ reads $\bot$, $p_1$ reads $\bot$, $p_0$ writes $5$, and $p_1$ reads $5$ twice.
- **Atomic:** no. The second read of $p_1$ returned $5$, so the linearization point of the write comes before the end of that read. The read of $p_2$ starts later: its linearization point comes after that of the write, and it should return $5$.

## Compositionality of consistency conditions

### What does compositionality mean for a consistency condition?

Suppose that a system has several registers $r_1, r_2, \dots, r_k$, each implemented independently of the others (by different algorithms, which exchange different messages), and that each register, taken alone, satisfies a consistency condition $C$. The condition $C$ is **compositional** if this is enough to guarantee that any execution that uses all the registers together satisfies $C$ as well.

More formally, let an execution $E$ be the sequence of the read and write operations on a set of registers $R$, and let $E|_{r_i}$ be the sequence of the operations of $E$ on the register $r_i$. The condition $C$ is compositional if and only if: $$\big(\forall r_i \in R: \ C(E|_{r_i}) = \text{True}\big) \iff C(E) = \text{True}$$

### Are regular and atomic consistency compositional?

- **Atomic consistency (linearizability) is compositional:** if every register of a system is linearizable, then the whole execution on all the registers is linearizable.
- **Regular consistency is compositional:** an execution on a set of independent regular registers is regular.

### Why is sequential consistency not compositional?

Sequential consistency is **not compositional**. Two independent registers $X$ and $Y$ can each be sequentially consistent, while the execution that uses both of them is not.

Consider the classical counterexample with two registers ($X$, $Y$) and two processes ($p_0$, $p_1$):

- Process $p_0$ executes `write_X(5)`, then `write_X(8)`, then `read_Y() → 8`.
- Process $p_1$ executes `write_Y(8)`, then `write_Y(5)`, then `read_X() → 5`.

Taking the registers one at a time:

1. **Register $X$ alone:** the operations are `write_X(5)`, `write_X(8)` and `read_X() → 5`. A valid sequence is `write_X(5)`, `read_X() → 5`, `write_X(8)`, with the read placed between the two writes. The register is sequentially consistent.
2. **Register $Y$ alone:** the operations are `write_Y(8)`, `write_Y(5)` and `read_Y() → 8`. A valid sequence is `write_Y(8)`, `read_Y() → 8`, `write_Y(5)`. The register is sequentially consistent.

Taking the two registers together:

- To return $8$, `read_Y() → 8` must be placed after `write_Y(8)` and before `write_Y(5)`.
- To return $5$, `read_X() → 5` must be placed after `write_X(5)` and before `write_X(8)`.
- The local order of $p_0$ requires `write_X(8)` before `read_Y() → 8`.
- The local order of $p_1$ requires `write_Y(5)` before `read_X() → 5`.

Putting the four constraints in a row gives a cycle: $$W_X(8) \xrightarrow{\text{order of } p_0} R_Y \xrightarrow{\text{value}} W_Y(5) \xrightarrow{\text{order of } p_1} R_X \xrightarrow{\text{value}} W_X(8)$$

Here an arrow means "must come before", $R_Y$ is the read of $Y$ that returns $8$, and $R_X$ is the read of $X$ that returns $5$. Since a sequence cannot contain a cycle, no global sequence $G$ exists: the composed execution is **not sequentially consistent**.

This is the practical reason for preferring atomic consistency: on a single register a process cannot tell a sequentially consistent register from an atomic one, but as soon as several registers are used together, sequential consistency can be lost.

## Exercise: the values returned by the reads

### Which execution does the exercise consider?

A $(1,N)$ register, initially $\bot$, is used by four processes. Process $p_1$ is the writer: it executes `write(1)`, `write(2)` and `write(3)`, and it crashes during `write(3)`. The other processes execute five reads, whose return values are not given:

``` The execution of the exercise
p1: ---------[write(1)]----------[  write(2)  ]--[write(3)--X
p2: --------------------------------------------------------------[ read5 ]----->
p3: ---------------[      read2      ]-------[  read3   ]----------------------->
p4: ----------------------[ read1 ]------------[        read4         ]--------->
```

A bracket marks the invocation or the return of an operation, and `X` marks the crash of the writer. In particular:

- `read2` overlaps the end of `write(1)` and the beginning of `write(2)`.
- `read1` starts after the end of `write(1)` and overlaps the beginning of `write(2)`; it lies entirely inside `read2`.
- `read3` starts before the end of `write(2)` and overlaps the beginning of `write(3)`.
- `read4` starts after the end of `write(2)`, just before `write(3)`, and it ends after the crash.
- `read5` starts after the crash, before the end of `read4`.

The exercise asks for all the values that each read can return, first if the register is regular and then if it is atomic.

### Which values can the reads return if the register is regular?

- `read1` can return $1$ or $2$. It starts after the end of `write(1)`, so it cannot return $\bot$ any more, and it is concurrent with `write(2)`.
- `read2` can return $\bot$, $1$ or $2$. It is concurrent with two writes, `write(1)` and `write(2)`, and before the first of them the register contains $\bot$.
- `read3` can return $1$, $2$ or $3$. It is concurrent with `write(2)` and with `write(3)`, and the last write completed before it is `write(1)`.
- `read4` can return $2$ or $3$. The last write completed before it is `write(2)`, and it is concurrent with `write(3)`.
- `read5` can return $2$ or $3$. The writer crashed during `write(3)`, so this write never returns, and it is concurrent with every operation that follows.

### Which values can the reads return if the register is atomic?

In an atomic register the returned values must also be compatible with a choice of the linearization points. The pattern to look for is a write that overlaps two reads which are **not concurrent** with each other: the first read influences the second one, because if the first read returns the new value, the linearization point of the write has already passed, and the second read cannot return an older value. If the two reads are concurrent, instead, they do not influence each other: the linearization point of the write can always be placed between their linearization points, in either order.

Applied to this execution:

- `read1` and `read2` are concurrent: all the combinations of their regular values are possible.
- `read3` follows both `read1` and `read2`, so it cannot return a value older than the ones they returned. For instance, if `read2` returns $2$, then `read3` returns $2$ or $3$, not $1$.
- `read4` follows `read1` and `read2` too, but its regular values, $2$ and $3$, are never older than theirs. It is concurrent with `read3`, so the two do not influence each other: `read3` may return $3$ while `read4` returns $2$.
- `read5` follows `read3`: if `read3` returns $3$, then `read5` returns $3$. It is concurrent with `read4`, which does not constrain it. The failed `write(3)` may take effect even after the crash of the writer, or never.

Writing the values in the order (`read1`, `read2`, `read3`, `read4`, `read5`):

- $(1, 2, 2, 3, 3)$ and $(1, 1, 3, 2, 3)$ are atomic.
- $(1, 2, 1, 2, 2)$ is regular but not atomic: `read3` returns $1$ after `read2` has returned $2$.
- $(1, 1, 3, 3, 2)$ is regular but not atomic: `read5` returns $2$ after `read3` has returned $3$.
