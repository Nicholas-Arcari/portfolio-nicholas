const e=`## Atomic registers: abstraction and specification

### What is a $(1,N)$ atomic register?

A $(1,N)$ atomic register is a shared memory abstraction for a system of $N$ processes $\\Pi = \\{p_0, p_1, \\dots, p_{N-1}\\}$, in which exactly one designated process $p_w \\in \\Pi$ is the writer, while all the $N$ processes (the writer included) can read. The register stores a value (for simplicity a positive integer, initialized to a default value $v_0 = 0$ or $\\bot$) and offers two operations:

- \`write(v)\`: invoked only by the writer $p_w$, to change the stored value to $v$.
- \`read()\`: invoked by any process $p_i \\in \\Pi$, to obtain the value currently stored in the register.

As for the regular register, every operation $O$ is delimited by two events: an invocation $\\text{inv}(O)$ and a return $\\text{ret}(O)$. An operation is **pending** between the two; if the process crashes while the operation is pending, the operation is **failed**, and it never returns.

### Which properties specify a $(1,N)$ atomic register?

A $(1,N)$ atomic register is a regular register with one more property:

- **Termination (liveness):** if a correct process invokes an operation, then the operation eventually returns.
- **Validity (safety):** a read returns the last value written, or the value that is being written concurrently.
- **Ordering (safety):** if a read returns a value $v_2$ after a read that precedes it (on the same process or on a different one) has returned a value $v_1$, then $v_1$ has not been written after $v_2$.

### How does the ordering property relate to linearization points?

With a single writer, the ordering property is equivalent to the definition of atomicity given with the **linearization points**: every completed operation $O$ (and possibly some of the failed ones) appears to take effect instantaneously at one point in time, its linearization point $\\text{LP}(O)$, inside the interval $[\\text{inv}(O), \\text{ret}(O)]$.

If an operation $O_1$ completes before an operation $O_2$ begins ($\\text{ret}(O_1) < \\text{inv}(O_2)$), their linearization points are in the same order: $\\text{LP}(O_1) < \\text{LP}(O_2)$. Every read returns the value of the most recent write in the order of the linearization points.

The definition with the linearization points is the more general one: the book uses the ordering property for the registers with one writer, and goes back to the linearization points for the registers with many writers.

### How do executions distinguish the regular, sequential and atomic semantics?

Consider some executions with the writer $p_1$ and the readers $p_2, p_3$:

- **Execution A (regular, not atomic):**
  - The writer $p_1$ executes \`write(5)\` and then \`write(6)\`.
  - Concurrently with \`write(6)\`, the reader $p_2$ executes two reads one after the other: the first returns $6$, the second returns $5$.
  - **Analysis:** both reads are concurrent with \`write(6)\`, so the execution is **regular**. Since the first read returns $6$, the linearization point of \`write(6)\` comes before the end of that read ($\\text{LP}(\\text{write}(6)) < \\text{LP}(\\text{read}_1) < \\text{LP}(\\text{read}_2)$), and the second read should see $6$ or a newer value. The ordering property is violated: the execution is **not atomic**.
- **Execution B (atomic):**
  - The writer $p_1$ executes \`write(5)\` and then \`write(6)\`.
  - The reader $p_2$ executes three reads in sequence, which return $5$, $6$ and $6$.
  - **Analysis:** the returned values never go back, and a linearization point can be chosen inside each operation. The execution is **atomic** (and therefore **regular**).
- **Execution C (a violation across two processes):**
  - The writer $p_1$ executes \`write(5)\` and then \`write(6)\`.
  - The reader $p_2$ executes a read that returns $6$, and completes.
  - Then the reader $p_3$ invokes a read, which returns $5$.
  - **Analysis:** the ordering property concerns reads that precede each other, also when they belong to different processes. Since the read of $p_2$ precedes the read of $p_3$ and returns $6$, the read of $p_3$ cannot return $5$: the execution is **not atomic**.
- **Execution D (concurrent reads):**
  - The writer $p_1$ invokes \`write(5)\`.
  - The readers $p_2$ and $p_3$ execute two concurrent reads during \`write(5)\`: $p_2$ returns $5$, while $p_3$ returns $0$ (the initial value).
  - **Analysis:** since the two reads are concurrent with each other and with \`write(5)\`, the linearization point of the write can be placed between that of the read of $p_3$ and that of the read of $p_2$. The execution is **atomic**.
- **Execution E (a failed write):**
  - The writer $p_1$ invokes \`write(5)\` and crashes before the write returns.
  - If a reader later reads and obtains $0$, the execution is **atomic** and regular: the failed write is concurrent with every later read, and it is as if it had not taken effect yet.
  - If the reader $p_2$ obtains $5$ and afterwards the reader $p_3$ obtains $0$, the execution is **regular** but **not atomic**: the ordering property is violated.
  - **Analysis:** with a failed write, in an atomic register either no read returns $5$, or, once a read has returned $5$, all the reads that follow it return $5$. The linearization point of a failed operation can also come after the crash of the process that invoked it.
- **Execution F (only sequentially consistent):**
  - The writer $p_1$ executes \`write(5)\`, and some time later \`write(6)\`.
  - Between the two writes, the reader $p_2$ executes a read that returns $6$.
  - **Analysis:** the read returns a value that has not been written yet and is not being written, so the execution is **not regular**, and therefore **not atomic**. It is **sequentially consistent**, with the global sequence \`write(5)\`, \`write(6)\`, \`read() → 6\`.

## Phase 1: from a regular register to a (1,1) atomic register

### Which execution of a regular register violates atomicity when there is only one reader?

Atomic registers are first built using only regular registers, without exchanging messages: the processes communicate only by reading and writing the registers below. The construction has two phases; the first one produces a $(1,1)$ atomic register, with one writer $p_w$ and one reader $p_r$.

With a single reader, the only execution that a regular register allows and an atomic register forbids is the one in which the reader sees a new value and then an old one. Suppose that $p_w$ writes $v_1 = 5$ and then $v_2 = 8$. If the reader $p_r$ executes a read $R_1$ concurrent with \`write(8)\`, $R_1$ may return the new value $8$. If $p_r$ then executes a second read $R_2$, still concurrent with \`write(8)\`, a regular register allows $R_2$ to return the old value $5$ (the last value written before \`write(8)\`). Returning $8$ in $R_1$ and then $5$ in $R_2$ violates the ordering property.

### How do timestamps turn the regular register into a $(1,1)$ atomic register?

The values alone do not say which one is the newer: a number is a number. The algorithm, however, is free to decide what to write in the underlying register. The writer attaches to every value $v$ an increasing integer timestamp $\\mathit{ts}$, and writes the pair $(\\mathit{ts}, v)$ into an underlying $(1,N)$ regular register $\\mathrm{RR}$.

The reader $p_r$ keeps in a local variable the pair with the highest timestamp that it has seen so far. When $p_r$ executes an atomic read, it reads the underlying regular register and obtains a pair $(\\mathit{ts}', v')$. If $\\mathit{ts}'$ is greater than the stored timestamp, $p_r$ replaces the stored pair with the new one and returns $v'$. Otherwise (the regular register has returned an old value during a concurrent write), $p_r$ ignores the pair and returns the value it has stored.

### What is the pseudocode of the $(1,1)$ atomic register?

\`\`\` From a (1, N) regular register to a (1, 1) atomic register
Implements:
  (1, 1)-AtomicRegister, instance ooar.
Uses:
  (1, N)-RegularRegister, instance onrr.

upon event < ooar, Init > do
  (ts, val) := (0, ⊥);
  wts := 0;

upon event < ooar, Write | v > do
  wts := wts + 1;
  trigger < onrr, Write | (wts, v) >;

upon event < onrr, WriteReturn > do
  trigger < ooar, WriteReturn >;

upon event < ooar, Read > do
  trigger < onrr, Read >;

upon event < onrr, ReadReturn | (ts', v') > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < ooar, ReadReturn | val >;
\`\`\`

- \`wts\`: kept by the writer $p_w$, initialized to $0$ and incremented before every write, so that the timestamps are strictly increasing.
- \`(ts, val)\`: kept by the reader $p_r$, initialized to $(0, \\bot)$. It holds the pair with the highest timestamp seen by $p_r$.
- \`< ooar, Write | v >\`: the invocation of the atomic write. The writer increments \`wts\` and writes the pair \`(wts, v)\` on the regular register.
- \`< onrr, WriteReturn >\`: the regular register signals that the write of the pair has completed, and the atomic write returns.
- \`< ooar, Read >\`: the invocation of the atomic read, which becomes a read of the regular register.
- \`< onrr, ReadReturn | (ts', v') >\`: the regular register returns a pair. If \`ts' > ts\`, the stored pair is replaced. In any case the value returned to the upper layer is the stored \`val\`, which hides any old value returned by the regular register.

### What is the cost of the $(1,1)$ atomic register?

The algorithm exchanges no messages of its own: its cost is counted in operations on the underlying regular register.

- **Write:** exactly $1$ write on the regular register.
- **Read:** exactly $1$ read on the regular register.

## Phase 2: from (1,1) atomic registers to a (1,N) atomic register

### Why is one $(1,1)$ atomic register per reader not enough?

To go from $(1,1)$ to $(1,N)$ (one writer $p_w$ and $N$ readers), the first idea is to give each reader its own $(1,1)$ atomic register, with all these registers written by $p_w$. This does not guarantee atomicity among different readers.

A \`write(v)\` on the $(1,N)$ register becomes $N$ writes on the registers $\\mathrm{AR}_1, \\mathrm{AR}_2, \\dots, \\mathrm{AR}_N$, and these writes are not instantaneous: they complete at different times. If the reader $p_i$ reads $\\mathrm{AR}_i$ after the write on $\\mathrm{AR}_i$ has completed, it sees the new value $v$. If the reader $p_j$ then reads $\\mathrm{AR}_j$ while the write on $\\mathrm{AR}_j$ is still in progress, it may see the old value. Each register is atomic, but the read of $p_i$ precedes the read of $p_j$ and $p_j$ returns an older value: the ordering property is violated. Making the writer wait for all the $N$ writes before it returns does not help, because the problem arises before the end of the write.

### How does a reader that writes make the register atomic for all the readers?

The fix is on the side of the reader: when a read returns, the value that it returns must already be visible to everybody. So every reader **helps the writer**, by propagating the value it has read before returning.

The construction uses an $N \\times N$ matrix of $(1,1)$ atomic registers $\\mathrm{AR}_{r,w}$, in which process $r$ is the reader and process $w$ is the writer. Each process $p_i$ therefore owns a **row** of $N$ registers that it writes, $\\{\\mathrm{AR}_{k,i} \\mid k \\in \\Pi\\}$, one for every reader, and a **column** of $N$ registers that it reads, $\\{\\mathrm{AR}_{i,k} \\mid k \\in \\Pi\\}$, one for every writer. The row of the writer $p_w$ carries the values written on the $(1,N)$ register; the rows of the other processes are used only to relay the values that they have read.

When a process $p_i$ reads the $(1,N)$ register, it proceeds in two phases:

1. **Phase 1 (read the column):** $p_i$ reads all the registers of its column, which contain the value written by $p_w$ and the values relayed by the other readers, and it selects the pair $(\\mathit{ts}_{\\max}, v_{\\max})$ with the highest timestamp.
2. **Phase 2 (write the row):** before returning $v_{\\max}$, $p_i$ writes $(\\mathit{ts}_{\\max}, v_{\\max})$ into all the registers of its row, and it waits for all these writes to complete.

Because of the second phase, any read invoked by any process $p_j$ after the end of the read of $p_i$ finds in its column, in the register $\\mathrm{AR}_{j,i}$, a timestamp at least as high as $\\mathit{ts}_{\\max}$.

### What is the pseudocode of the $(1,N)$ atomic register built on the matrix of $(1,1)$ registers?

\`\`\` From (1, 1) atomic registers to a (1, N) atomic register
Implements:
  (1, N)-AtomicRegister, instance onar.
Uses:
  (1, 1)-AtomicRegister (multiple instances).

upon event < onar, Init > do
  ts := 0;
  acks := 0;
  writing := FALSE;
  readval := ⊥;
  readlist := [⊥]^N;
  forall q ∈ Π, r ∈ Π do
    Initialize a new instance ooar.q.r of (1, 1)-AtomicRegister
      with writer r and reader q;

upon event < onar, Write | v > do
  ts := ts + 1;
  writing := TRUE;
  forall q ∈ Π do
    trigger < ooar.q.self, Write | (ts, v) >;

upon event < ooar.q.self, WriteReturn > do
  acks := acks + 1;
  if acks = N then
    acks := 0;
    if writing = TRUE then
      trigger < onar, WriteReturn >;
      writing := FALSE;
    else
      trigger < onar, ReadReturn | readval >;

upon event < onar, Read > do
  forall r ∈ Π do
    trigger < ooar.self.r, Read >;

upon event < ooar.self.r, ReadReturn | (ts', v') > do
  readlist[r] := (ts', v');
  if #(readlist) = N then
    (maxts, readval) := highest(readlist);
    readlist := [⊥]^N;
    forall q ∈ Π do
      trigger < ooar.q.self, Write | (maxts, readval) >;
\`\`\`

- \`ooar.q.r\`: the register of the matrix that has process \`q\` as its reader and process \`r\` as its writer. The registers \`ooar.q.self\` are the row of a process, and the registers \`ooar.self.r\` are its column. Every process takes part in the initialization of all the $N^2$ registers, also of those that it neither reads nor writes, because a register is a distributed object and its implementation may need the help of all the processes.
- \`ts\`: the timestamp of the writes, kept by the only writer.
- \`writing\`: a flag that is true only at the writer, while it is writing. It tells whether the writes that complete on a row belong to a write or to the second phase of a read.
- \`acks\`: the counter of the operations on the $(1,1)$ registers of the row that have returned.
- \`readlist\`: the array in which a reader stores the pairs returned by the $N$ registers of its column; \`#(readlist)\` is the number of its positions that are different from $\\bot$.
- \`highest(readlist)\`: the pair of \`readlist\` that has the highest timestamp.

### How do writes and reads proceed, step by step?

1. **Start of a write:** when the writer receives \`< onar, Write | v >\`, it increments \`ts\`, sets \`writing := TRUE\`, and starts in parallel the writes of \`(ts, v)\` on the $N$ registers of its row.
2. **End of a write:** every time one of these writes returns, \`acks\` is incremented. When \`acks = N\` (the whole row has been written), the writer resets \`acks\`, triggers \`< onar, WriteReturn >\` and sets \`writing := FALSE\`.
3. **Start of a read (phase 1):** when a reader receives \`< onar, Read >\`, it starts in parallel the reads of the $N$ registers of its column.
4. **End of phase 1, start of phase 2:** the pairs returned by the registers of the column are stored in \`readlist\`. When all the $N$ registers have answered (\`#(readlist) = N\`), the reader selects the pair \`(maxts, readval)\` with the highest timestamp, empties \`readlist\`, and starts the writes of \`(maxts, readval)\` on the $N$ registers of its row.
5. **End of a read:** when all the $N$ writes on the row have returned (\`acks = N\`), the reader, for which \`writing\` is false, triggers \`< onar, ReadReturn | readval >\`.

The read is more complex than the write: this is a pattern that returns in all the algorithms for atomic registers.

### Why is the algorithm correct, and where is the linearization point of a write?

- **Termination** follows from the termination of the $(1,1)$ atomic registers: an operation ends after $N$ reads and $N$ writes on them, at most.
- **Validity** follows from their validity.
- **Ordering:** suppose that a read returns a value $v_2$ with timestamp $s_2$. Before returning, the reader has written $(s_2, v_2)$ in all the registers of its row. By the ordering property of the $(1,1)$ registers, every read that starts later finds in its column a timestamp greater than or equal to $s_2$, so it cannot return an older value $v_1$ with timestamp $s_1 < s_2$.

The linearization point of a write is the earlier between the end of the write and the end of the first read that returns its value: it is the first moment at which some process (the writer, or a reader that has seen the value) has finished writing the value on its whole row. From that moment on, every read that starts finds the value in its column. Consider a \`write(5)\` and a first read that returns $5$ and ends before the write does. A second read, which starts before the end of the first one, may still return $\\bot$, because the two reads are concurrent; a third read, which starts after the end of the first one, must return $5$. In this sense a read helps the write: a fast reader can complete its row before a slow writer does.

### What are the cost and the resilience of the matrix algorithm?

- **Registers:** exactly $N^2$ underlying $(1,1)$ atomic registers. The real cost is not the space but the messages, because each of these registers is itself implemented by exchanging messages.
- **Write:** $N$ writes on $(1,1)$ registers, executed in parallel.
- **Read:** $N$ reads (phase 1) followed by $N$ writes (phase 2) on $(1,1)$ registers, $2N$ operations in all.
- **Resilience:** the algorithm communicates only through the registers, so failures are not its concern: it tolerates whatever the underlying registers tolerate. If these are built on regular registers that work with any number of crashes, the construction works with any number of crashes too.

## Phase 3: a (1,N) atomic register with message passing (Read-Impose Write-All, fail-stop)

### What is the Read-Impose Write-All (RIWA) algorithm in the fail-stop model?

In a message-passing system, in the **fail-stop model** (a perfect failure detector $\\mathcal{P}$, best-effort broadcast, and perfect point-to-point links), the idea of the matrix becomes the **Read-Impose Write-All (RIWA)** algorithm. It is a modified version of the Read-One Write-All regular register, in which "the read operation writes".

Every process $p_i \\in \\Pi$ keeps a local copy \`val\` of the value of the register, together with its timestamp \`ts\`.

- **Write:** the writer $p_w$ broadcasts the new value, with a timestamp greater by one than its current one, and waits for the acknowledgments of all the processes that $\\mathcal{P}$ has not detected as crashed.
- **Read:** the reader $p_i$ takes its local \`val\` (which the broadcasts keep up to date). To guarantee atomicity, however, before returning it $p_i$ must **impose** it on all the processes: it broadcasts the value as if it were a write, and it waits for the acknowledgments, exactly as a writer does.
- **Every process** accepts a value only if its timestamp is higher than the local one, and it sends the acknowledgment in any case.

Without the imposition the algorithm would be Read-One Write-All, which is only regular: during a slow \`write(5)\`, a process that has already received $5$ reads $5$ and returns, and afterwards a process that has not received it yet reads $\\bot$. With the imposition, when the first read returns every process that has not crashed stores $5$ or a newer value, and the second read cannot return $\\bot$ any more.

### What is the pseudocode of the Read-Impose Write-All (RIWA) algorithm?

\`\`\` Read-Impose Write-All: (1, N) atomic register
Implements:
  (1, N)-AtomicRegister, instance onar.
Uses:
  BestEffortBroadcast, instance beb;
  PerfectPointToPointLinks, instance pl;
  PerfectFailureDetector, instance P.

upon event < onar, Init > do
  (ts, val) := (0, ⊥);
  correct := Π;
  writeset := ∅;
  readval := ⊥;
  reading := FALSE;

upon event < P, Crash | p > do
  correct := correct \\ {p};

upon event < onar, Read > do
  reading := TRUE;
  readval := val;
  trigger < beb, Broadcast | [WRITE, ts, val] >;

upon event < onar, Write | v > do
  trigger < beb, Broadcast | [WRITE, ts + 1, v] >;

upon event < beb, Deliver | p, [WRITE, ts', v'] > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < pl, Send | p, [ACK] >;

upon event < pl, Deliver | p, [ACK] > do
  writeset := writeset ∪ {p};

upon correct ⊆ writeset do
  writeset := ∅;
  if reading = TRUE then
    reading := FALSE;
    trigger < onar, ReadReturn | readval >;
  else
    trigger < onar, WriteReturn >;
\`\`\`

- \`(ts, val)\`: the local copy of the register, with its timestamp, kept by every process.
- \`correct\`: the set of the processes that the perfect failure detector $\\mathcal{P}$ has not detected as crashed.
- \`writeset\`: the set of the processes that have acknowledged the current broadcast.
- \`readval\`, \`reading\`: the value that a read is imposing, and the flag that tells a read from a write.
- \`[WRITE, ts', v']\`: the message broadcast both by the writes and by the impositions of the reads.
- \`[ACK]\`: the acknowledgment sent back on the point-to-point link by a process that has handled a \`WRITE\` message.

### How does RIWA handle crashes, writes and reads?

1. **Crashes (\`< P, Crash | p >\`):** process $p$ is removed from \`correct\`. If an operation is waiting for acknowledgments and the processes left in \`correct\` are all in \`writeset\`, the condition \`correct ⊆ writeset\` becomes true and the operation completes, without waiting for the crashed process.
2. **Start of a write (\`< onar, Write | v >\`):** the writer $p_w$ broadcasts \`[WRITE, ts + 1, v]\`. It does not increment its own \`ts\` at this point: it will do so when it delivers its own message, like every other process.
3. **Delivery of a write or of an imposition (\`< beb, Deliver | p, [WRITE, ts', v'] >\`):** a process that receives the message checks whether \`ts' > ts\`. If so, it updates its local copy, \`(ts, val) := (ts', v')\`. In any case it sends \`[ACK]\` back to the sender $p$: a process that still stores $\\bot$ and reads will try to impose $\\bot$, everybody will reject it, but without the acknowledgments that read would never end.
4. **Collection of the acknowledgments (\`< pl, Deliver | p, [ACK] >\`):** the sender collects the acknowledgments in \`writeset\`. When \`correct ⊆ writeset\` (all the processes that have not crashed have acknowledged), the write, or the imposition of the read, is complete: \`writeset\` is emptied and the operation returns.
5. **Start of a read (\`< onar, Read >\`):** the reader $p_i$ sets \`reading := TRUE\`, saves its local value in \`readval\`, and broadcasts \`[WRITE, ts, val]\` to impose that value on all the processes before returning.

The algorithm is correct for the same reasons as Read-One Write-All, as far as termination and validity are concerned. For the ordering, a read returns only after every process that has not crashed stores a pair with a timestamp at least as high as the one of the value read, so a read that starts later cannot return an older value. The linearization point of a write is the moment at which its value (or a newer one) has replaced the old one at the last process. No process knows when this moment occurs, but it exists, and this is all that matters.

### Why does a read return the copy \`readval\` and not \`val\`?

When a read starts, the reader copies its local value in \`readval\`, and it is this copy that it imposes. Between the broadcast and the arrival of the acknowledgments, the reader may deliver a \`WRITE\` message of the writer with a newer value, which overwrites \`val\`. If the read returned \`val\`, it would return a value that it has not imposed, and that perhaps no other process has received yet: a read started afterwards by another process could return the older value, and the ordering property would be violated.

### What are the complexity and the resilience of the RIWA algorithm?

- **Message complexity:**
  - **Write:** $1$ best-effort broadcast ($N$ messages) plus $N$ acknowledgments, at most $2N$ messages.
  - **Read:** $1$ best-effort broadcast ($N$ messages) plus $N$ acknowledgments, at most $2N$ messages (because of the imposition).
- **Time complexity (message delays):**
  - **Write:** $2$ message delays ($1$ for the broadcast and $1$ for the acknowledgments).
  - **Read:** $2$ message delays ($1$ for the imposition and $1$ for the acknowledgments).
- **Resilience:** $f < N$. The algorithm tolerates up to $N - 1$ crashes, because the perfect failure detector $\\mathcal{P}$ removes the crashed processes from \`correct\`, and an operation completes as soon as all the surviving processes have acknowledged.

Reads and writes have the same pattern of messages, and therefore the same cost. Compared with the regular register in the same model, where a read is local and costs nothing, the $2N$ messages of a read are the price of atomicity.

## Phase 4: the fail-silent (1,N) atomic register (overview of Read-Impose Write-Majority)

### Why does Read-Impose Write-All not work in an asynchronous fail-silent system, and how does Read-Impose Write-Majority solve the problem?

In an asynchronous fail-silent system (without any failure detector), a process cannot distinguish a crashed process from a slow link. Waiting for the acknowledgments of "all the correct processes" can therefore block an operation forever, as soon as a single process crashes.

To tolerate crashes without a failure detector, the algorithm uses **quorums**, under the assumption of a **majority of correct processes**: $$f < \\frac{N}{2} \\quad \\text{or} \\quad N \\ge 2f + 1$$

In the **Read-Impose Write-Majority (RIWM)** algorithm:

1. **Intersection of quorums:** any two quorums (sets of at least $\\lfloor N/2 \\rfloor + 1$ processes) have at least one process in common ($Q_1 \\cap Q_2 \\neq \\emptyset$).
2. **Write:** the writer broadcasts a \`WRITE\` message with the timestamp and the value, and waits for the acknowledgments of a majority ($|\\mathit{writeset}| \\ge \\lfloor N/2 \\rfloor + 1$).
3. **Read, in two phases:**
  - **Phase 1 (query a majority):** the reader broadcasts a \`READ\` message and collects the pairs (timestamp, value) of a majority of processes. It selects the pair $(\\mathit{ts}_{\\max}, v_{\\max})$ with the highest timestamp.
  - **Phase 2 (impose on a majority):** the reader broadcasts a \`WRITE\` message with $(\\mathit{ts}_{\\max}, v_{\\max})$, and waits for the acknowledgments of a majority before returning $v_{\\max}$.

Because any quorum of a read intersects any quorum of a write, phase 1 sees the highest timestamp written by any completed write. Phase 2 guarantees that any later read sees a timestamp greater than or equal to $\\mathit{ts}_{\\max}$, which preserves atomicity in asynchronous fail-silent executions. This is the pattern of all the algorithms for atomic registers: a first phase gathers the information, and a second phase writes the value before the read returns. The details of the algorithm are in the next lecture.
`;export{e as default};
