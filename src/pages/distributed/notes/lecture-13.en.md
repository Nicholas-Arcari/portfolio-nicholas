## Read-Impose Write-Majority: the (1,N) atomic register in the fail-silent model

### What is the structure of a $(1,N)$ atomic register in the fail-silent model?

- A $(1,N)$ atomic register offers atomic (linearizable) reads and writes in an asynchronous, fail-silent system of $N$ processes ($\Pi = \{p_1, p_2, \dots, p_N\}$), with one designated writer $p_w$ and many readers, without any failure detector.
- The algorithm works under the assumption of a **majority of correct processes** ($f < N/2$), and it uses majority quorums ($Q_1 \cap Q_2 \neq \emptyset$) to guarantee that reads and writes overlap.
- The Read-Impose Write-Majority algorithm is a variation of the Majority Voting regular register. The write is the same. The read has two phases: a **query phase**, which finds the most recent value as in Majority Voting, followed by an **impose phase**, which writes that value back to a majority before returning to the upper layer. In the impose phase the reader does exactly what a writer does.

### What is the pseudocode of the Read-Impose Write-Majority algorithm?

``` Read-Impose Write-Majority: (1, N) atomic register
Implements:
  (1, N)-AtomicRegister, instance onar.
Uses:
  BestEffortBroadcast, instance beb;
  PerfectPointToPointLinks, instance pl.

upon event < onar, Init > do
  (ts, val) := (0, ⊥);
  wts := 0;
  acks := 0;
  rid := 0;
  readlist := [⊥]^N;
  readval := ⊥;
  reading := FALSE;

upon event < onar, Read > do
  rid := rid + 1;
  acks := 0;
  readlist := [⊥]^N;
  reading := TRUE;
  trigger < beb, Broadcast | [READ, rid] >;

upon event < beb, Deliver | p, [READ, r] > do
  trigger < pl, Send | p, [VALUE, r, ts, val] >;

upon event < pl, Deliver | q, [VALUE, r, ts', v'] > such that r = rid do
  readlist[q] := (ts', v');
  if #(readlist) > N/2 then
    (maxts, readval) := highest(readlist);
    readlist := [⊥]^N;
    trigger < beb, Broadcast | [WRITE, rid, maxts, readval] >;

upon event < onar, Write | v > do
  rid := rid + 1;
  wts := wts + 1;
  acks := 0;
  trigger < beb, Broadcast | [WRITE, rid, wts, v] >;

upon event < beb, Deliver | p, [WRITE, r, ts', v'] > do
  if ts' > ts then
    (ts, val) := (ts', v');
  trigger < pl, Send | p, [ACK, r] >;

upon event < pl, Deliver | q, [ACK, r] > such that r = rid do
  acks := acks + 1;
  if acks > N/2 then
    acks := 0;
    if reading = TRUE then
      reading := FALSE;
      trigger < onar, ReadReturn | readval >;
    else
      trigger < onar, WriteReturn >;
```

### What do the variables and the handlers of Read-Impose Write-Majority do?

- `(ts, val)`: the pair stored by each process $p_i$, with the highest timestamp `ts` it has seen and the corresponding value `val`.
- `wts`: an integer counter kept only by the writer $p_w$, which generates the increasing timestamps of the writes.
- `acks`: the counter of the acknowledgments received for the current write or imposition.
- `rid`: an integer counter that identifies the operations of a process. It is used both by the reads and by the writes, and it lets a process discard the late answers to its previous operations.
- `readlist`: an array of $N$ positions, initially all $\bot$, which stores the pairs gathered from the members of the quorum during the query phase.
- `readval`: the value with the highest timestamp selected in the query phase, which is written back in the impose phase and then returned.
- `reading`: a flag that tells whether the acknowledgments that are arriving belong to the impose phase of a read (true) or to a write (false).
- `upon event < onar, Write | v >`: executed by the writer $p_w$. It increments `rid` and `wts`, resets `acks`, and broadcasts `[WRITE, rid, wts, v]` with best-effort broadcast.
- `upon event < beb, Deliver | p, [WRITE, r, ts', v'] >`: executed by any process $p_i$ that delivers a `WRITE` message, whether it comes from the writer or from a reader that is imposing. If the timestamp `ts'` is greater than the local `ts`, $p_i$ updates its pair, `(ts, val) := (ts', v')`. Whether it has updated the pair or not, $p_i$ sends the acknowledgment `[ACK, r]` back to the sender $p$, with the identifier of the operation.
- `upon event < pl, Deliver | q, [ACK, r] >`: executed when an acknowledgment arrives. Only the acknowledgments of the current operation count (`r = rid`). When `acks > N/2` (a majority has acknowledged), `acks` is reset. If `reading` is true, the impose phase is complete: the process sets `reading := FALSE` and returns `< onar, ReadReturn | readval >`. Otherwise the process is the writer, which has completed its write and returns `< onar, WriteReturn >`.
- `upon event < onar, Read >`: executed by a reader. It increments `rid`, resets `acks` and `readlist`, sets `reading := TRUE`, and broadcasts `[READ, rid]` to start the query phase.
- `upon event < beb, Deliver | p, [READ, r] >`: executed by a process that delivers a query. The process answers on the point-to-point link with `[VALUE, r, ts, val]`, which carries its current pair.
- `upon event < pl, Deliver | q, [VALUE, r, ts', v'] >`: executed when an answer arrives. Only the answers to the current read count (`r = rid`). The reader stores the pair, `readlist[q] := (ts', v')`. Once the answers of a majority have been collected (`#(readlist) > N/2`), the reader takes from `readlist` the pair `(maxts, readval)` with the highest timestamp, resets `readlist`, and broadcasts `[WRITE, rid, maxts, readval]` to start the impose phase.

As in Read-Impose Write-All, the read returns the value `readval` that it has imposed, and not the local `val`, which a concurrent write may have changed in the meantime.

### Why is the impose phase necessary to guarantee atomicity?

- Without the impose phase (that is, if a reader returned the value with the highest timestamp right after the query phase, as in the regular register), a **new value could be read before an old one**.
- Suppose that the writer $p_w$ starts a write $W(v_1)$ with timestamp $\mathit{ts}_1 = 1$, and that the `WRITE` message has reached only one process $p_a$: the write is still in progress.
- The reader $p_{r1}$ executes a query, and the majority that answers includes $p_a$: it sees $(1, v_1)$ and returns $v_1$.
- The reader $p_{r2}$ executes a read that begins **after** the read of $p_{r1}$ has completed. If the majority that answers $p_{r2}$ does not include $p_a$, and if $p_{r1}$ has not imposed $(1, v_1)$ on a majority during its read, all the answers contain the old pair $(0, v_0)$, and $p_{r2}$ returns $v_0$.
- Returning $v_0$ after $p_{r1}$ has returned $v_1$ violates atomicity (the ordering property). The impose phase forces $p_{r1}$ to write $(1, v_1)$ on a majority $Q_C$ before completing its read: any majority that answers $p_{r2}$ afterwards intersects $Q_C$, and $p_{r2}$ sees a timestamp greater than or equal to $1$.

A consequence of the impose phase is that not every `WRITE` message of the writer is accepted by the process that receives it. If one message of a write reaches a process quickly, and that process then reads and imposes the value, the imposition can arrive at the other processes before the messages of the writer, which are then discarded (and acknowledged all the same). Up to $N - 1$ of the $N$ messages of a write can end like this; the first one to arrive is always accepted, because no newer value exists yet.

### What are the message and step complexity of the Read-Impose Write-Majority algorithm?

- **Write operation:**
  - Message complexity: at most $2N$ messages per write ($1$ best-effort broadcast of $N$ messages, plus $N$ acknowledgments, of which a majority is enough to complete).
  - Step complexity: $2$ communication steps ($1$ for the broadcast and $1$ for the acknowledgments).
- **Read operation:**
  - Message complexity: at most $4N$ messages per read ($N$ messages for the query, $N$ answers with the values, $N$ messages for the imposition, and $N$ acknowledgments).
  - Step complexity: $4$ communication steps (query, answers, imposition, acknowledgments).
- **Resilience:**
  - $f < N/2$. The algorithm tolerates up to $\lfloor (N-1)/2 \rfloor$ crashes without blocking.

## Comparison of the register algorithms

### How do the register algorithms compare across failure models, consistency conditions and costs?

The table compares the four message-passing algorithms for $(1,N)$ registers, in the fail-stop model (with a perfect failure detector $\mathcal{P}$) and in the fail-silent model (with quorums, $f < N/2$):

| Register | Failure model | Read, messages | Read, steps | Write, messages | Write, steps | Resilience |
|---|---|---|---|---|---|---|
| $(1,N)$ regular | Fail-stop ($\mathcal{P}$) | $0$ (local) | $0$ (local) | $2N$ | $2$ | $f < N$ |
| $(1,N)$ regular | Fail-silent (quorums) | $2N$ | $2$ | $2N$ | $2$ | $f < N/2$ |
| $(1,N)$ atomic | Fail-stop ($\mathcal{P}$) | $2N$ | $2$ | $2N$ | $2$ | $f < N$ |
| $(1,N)$ atomic | Fail-silent (quorums) | $4N$ | $4$ | $2N$ | $2$ | $f < N/2$ |

What the table shows:

- **The cost of atomicity:** going from the regular to the atomic semantics is paid in the reads, not in the writes, because a read has to help the writer. In the fail-silent model a read goes from $2N$ messages and $2$ steps to $4N$ messages and $4$ steps, because of the impose phase.
- **The cost of doing without a failure detector:** replacing the perfect failure detector $\mathcal{P}$ with majority quorums ($f < N/2$) turns the reads of the regular register from local accesses, with no messages, into round trips on the network, with $O(N)$ messages, and it lowers the resilience from $f < N$ to $f < N/2$.

In general, a stronger abstraction, or the same abstraction in a weaker system, is paid in messages.

### What changes for registers with many writers?

The $(N,N)$ atomic register, in which every process can write, is not developed in the course. The only thing to know is its specification, which cannot use the ordering property any more and goes back to the linearization points:

- **Termination:** as for the $(1,N)$ atomic register.
- **Atomicity:** every read returns the value that was written most recently in a hypothetical execution, in which every failed operation appears to be complete or does not appear to have been invoked at all, and every complete operation appears to have been executed at some instant between its invocation and its completion.

The instant mentioned by the property is the linearization point of the operation.

## Introduction to consensus

### What is the consensus problem, and what are its milestones?

- Consensus is the fundamental abstraction of fault-tolerant distributed computing: a set of processes must agree on a single value, chosen among the values proposed by the processes themselves.
- The example of the original paper is that of some generals who communicate over unreliable channels and must decide whether to attack or to retreat: any decision is fine, as long as it is the same for everybody. A peaceful version is the commit of a transaction on a replicated database: either all the replicas commit, or all abort.
- The milestones of consensus:
  - **1982 - Lamport, Shostak and Pease (the Byzantine generals problem):** the problem is formalized, with crash failures and with arbitrary (Byzantine) failures.
  - **1985 - Fischer, Lynch and Paterson (the FLP impossibility result):** in an asynchronous system no deterministic algorithm solves consensus if even a single process can crash ($f = 1$), whatever the size of the system. Unlike all the problems seen so far, here a majority of correct processes and the quorums are not enough.
  - **1998 - Lamport (Paxos):** the Paxos algorithm is presented in "The Part-Time Parliament", and explained again in "Paxos Made Simple" (2001). Paxos solves consensus in eventually synchronous systems, with crash failures and a majority of correct processes ($f < N/2$).
  - **1999 - Castro and Liskov (PBFT, Practical Byzantine Fault Tolerance):** the first practical algorithm for consensus with Byzantine failures, which needs a polynomial, not exponential, number of messages.
  - **Systems in use:**
    - **Google Chubby:** a distributed lock service that uses Paxos.
    - **Apache ZooKeeper:** a coordination service based on Zab, a protocol of the Paxos family.
    - **Permissioned blockchains:** platforms such as Hyperledger Fabric, in which the participants are authenticated, use Paxos, PBFT or their variants.

## The specification of consensus

### What are the events and the properties of the (regular) consensus abstraction?

- **Events:**
  - Request: `< c, Propose | v >`, with which a process proposes the value $v$. Each process proposes at most once.
  - Indication: `< c, Decide | v >`, with which the consensus module outputs the decided value $v$.
- **Properties:**
  - **C1, termination (liveness):** every correct process eventually decides some value.
  - **C2, validity, also called non-triviality (safety):** if a process decides $v$, then $v$ was proposed by some process.
  - **C3, integrity (safety):** no process decides twice (a decision is irrevocable).
  - **C4, agreement (safety):** no two correct processes decide differently.

Consensus is a one-shot problem: each process proposes once and decides once. To decide a sequence of values, a new instance of consensus is needed for each of them.

### Which executions satisfy the properties of consensus, and which ones violate them?

- **Execution 1 (correct):**
  - The processes $p_1, p_2, p_3, p_4$ propose the values $v_1, v_1, v_2, v_3$ respectively.
  - All the processes decide $v_1$.
  - Analysis: termination (all the correct processes decide), validity ($v_1$ was proposed), integrity (each process decides once) and agreement (all decide the same value) are satisfied. The value decided does not have to be the one proposed by most processes: deciding $v_3$ would be correct as well.
- **Execution 2 (validity violated):**
  - The processes $p_1, p_2, p_3$ all propose the value $0$.
  - The processes decide the value $1$.
  - Analysis: **validity** is violated, because nobody proposed $1$. When all the processes propose the same value, that value is the only possible decision. This property is what rules out the trivial algorithm that always decides a fixed value without exchanging any message.
- **Execution 3 (agreement violated):**
  - Process $p_1$ decides $2$; the processes $p_2, p_3, p_4$ decide $1$. All the processes are correct.
  - Analysis: **agreement** is violated, because two correct processes decide different values ($2 \neq 1$).
- **Execution 4 (integrity violated):**
  - Process $p_1$ decides $2$, and later it triggers a second decision, `< c, Decide | 1 >`.
  - Analysis: **integrity** is violated. A decision is irrevocable: no process can decide twice.
- **Execution 5 (termination violated):**
  - The processes $p_1, p_2, p_3$ propose their values, and a correct process goes on forever without ever triggering `< c, Decide | v >`.
  - Analysis: **termination** (liveness) is violated: a correct process cannot wait forever.
- **Execution 6 (a faulty process decides differently):**
  - Process $p_1$ proposes $v_1$, decides $v_1$, and crashes immediately.
  - The processes $p_2, p_3, p_4$ are correct, propose $v_2$, and decide $v_2$.
  - Analysis: for **regular consensus** the execution is **correct**. Agreement only requires that no two **correct** processes decide differently, and $p_1$ is faulty. (For **uniform consensus** this execution would violate uniform agreement, which forbids **any** two processes, correct or faulty, to decide differently.)
- **Execution 7 (a faulty process decides a value that nobody proposed):**
  - A process decides $0$, a value that no process has proposed, and then crashes.
  - Analysis: **validity** is violated. Unlike agreement, validity speaks of any process that decides, not only of the correct ones.

## Consensus in the fail-stop model: Hierarchical Consensus

### What is the idea of a consensus algorithm based on leaders?

Without failures, consensus is easy and needs no vote: the process with the lowest rank acts as the leader, decides its own proposal, and tells everybody to decide the same value. The value is one that was proposed, each process decides once, and the leader sends the same value to everybody.

With failures, the leader can crash while it is sending its message. With a perfect failure detector $\mathcal{P}$ the others detect the crash, and the process with the next rank becomes the leader. But a danger appears. Suppose that the message of the crashed leader $p_1$, with the value $1$, reaches only $p_3$, and that $p_3$ decides $1$ as soon as it receives it. The new leader $p_2$, which has received nothing, decides its own value $2$ and sends it to everybody: $p_3$ can no longer change its decision, and two correct processes have decided differently.

The mistake is to decide upon receiving the message of the leader. In **Hierarchical Consensus** a process that receives the value of a leader does not decide: it only changes its own proposal to that value. A process decides only when it becomes the leader itself.

The algorithm proceeds in $N$ rounds, and the leader of round $r$ is the process with rank $r$:

- The leader of a round decides its current proposal, and broadcasts it in a `DECIDED` message.
- A process moves from round $r$ to round $r + 1$ in two cases only: when it has received the message of the leader of round $r$ (and has adopted its value), or when it has detected the crash of that leader.

The rounds are logical: they belong to the algorithm, not to the system, and they begin at different times at different processes.

The key observation concerns the first correct leader, that is, the correct process with the lowest rank. Since it is correct, it is never detected as crashed, and its broadcast reaches all the correct processes: every correct process with a higher rank can leave its round only by receiving its message and adopting its value. When those processes become leaders in their turn, they can only decide that value. A faulty leader of an earlier round may have decided something else before crashing, and this is allowed by regular consensus.

### What is the pseudocode of Hierarchical Consensus?

``` Hierarchical Consensus
Implements:
  Consensus, instance c.
Uses:
  BestEffortBroadcast, instance beb;
  PerfectFailureDetector, instance P.

upon event < c, Init > do
  detectedranks := ∅;
  round := 1;
  proposal := ⊥;
  proposer := 0;
  delivered := [FALSE]^N;
  broadcast := FALSE;

upon event < P, Crash | p > do
  detectedranks := detectedranks ∪ {rank(p)};

upon event < c, Propose | v > such that proposal = ⊥ do
  proposal := v;

upon round = rank(self) ∧ proposal ≠ ⊥ ∧ broadcast = FALSE do
  broadcast := TRUE;
  trigger < beb, Broadcast | [DECIDED, proposal] >;
  trigger < c, Decide | proposal >;

upon round ∈ detectedranks ∨ delivered[round] = TRUE do
  round := round + 1;

upon event < beb, Deliver | p, [DECIDED, v] > do
  r := rank(p);
  if r < rank(self) ∧ r > proposer then
    proposal := v;
    proposer := r;
  delivered[r] := TRUE;
```

- `detectedranks`: the ranks of the processes detected as crashed. When the round of one of them comes, it is skipped at once.
- `round`: the current round, which starts from $1$ and grows by one at a time, without ever skipping a value.
- `proposal`: the value that the process currently proposes; initially $\bot$, then the value proposed by the upper layer, then possibly the value of a leader.
- `proposer`: the rank of the last leader that made the process change its proposal.
- `delivered`: an array of $N$ flags; `delivered[r]` is true if the message of the leader of round `r` has been received.
- `broadcast`: a flag that makes a process act as a leader only once.

### How does Hierarchical Consensus proceed?

1. **Proposal:** when the upper layer proposes $v$, the process stores it in `proposal`. This happens once per process. The value $\bot$ cannot be proposed: the algorithm would wait forever for a real proposal.
2. **Becoming the leader:** the condition `round = rank(self) ∧ proposal ≠ ⊥ ∧ broadcast = FALSE` is true first at process $p_1$, as soon as it has a proposal. The leader sets `broadcast := TRUE`, sends `[DECIDED, proposal]` to everybody and decides `proposal`. If it is correct, it will make everybody adopt its value; if it is faulty, it may decide and crash.
3. **Receiving the message of a leader:** a process that delivers `[DECIDED, v]` from the process of rank `r` adopts `v` only if `r < rank(self)`, because only the leaders of lower rank matter to it, and only if `r > proposer`, so that a slow message of an old leader cannot overwrite the value of a more recent one. In any case it sets `delivered[r] := TRUE`.
4. **Changing round:** a process leaves the current round when the rank of the round is in `detectedranks` (the leader has crashed) or when `delivered[round]` is true (the message of the leader has arrived).

A process can change its proposal at most $N - 1$ times, and only the process with the highest rank can change it that often.

### What does Hierarchical Consensus cost?

- **Messages:** every leader sends one broadcast of $N$ messages, and there are at most $N$ leaders: $N^2$ messages in the worst case.
- **Steps:** $N$ communication steps in the worst case, from the first proposal to the last decision: the process with the highest rank has to wait until all the others have been leaders.

### Why is Hierarchical Consensus correct?

- **Integrity:** a process decides only in the handler guarded by `broadcast = FALSE`, which sets `broadcast := TRUE`: the handler is executed at most once.
- **Validity:** a process decides its `proposal`, which is different from $\bot$. A proposal is either the value given by the upper layer or the value received from a leader, which in turn decided its own proposal. Going back along the chain, the first value was proposed by the upper layer of some process.
- **Termination:** every round ends at every correct process. If the leader of the round is correct, its message arrives; if it crashes, the perfect failure detector eventually detects it. So every correct process eventually reaches the round of its own rank, becomes the leader and decides.
- **Agreement:** let $p_i$ be the correct process with the lowest rank. By termination it becomes the leader of round $i$ and decides its proposal $v$. Every other correct process has a rank higher than $i$, and it can leave round $i$ only after receiving the message of $p_i$, because $p_i$ is never detected: when it leaves that round, its proposal is $v$. From then on only $v$ circulates among the correct processes, and each of them, when its round comes, decides $v$.

It is not true that only the first correct leader can impose its value: a faulty leader can be fast enough to reach everybody before it crashes. What the proof needs is only that the first correct leader certainly does.

## Uniform consensus

### What is uniform consensus, and why is Hierarchical Consensus not uniform?

**Uniform consensus** has the same properties as regular consensus, except that agreement is replaced by:

- **Uniform agreement:** no two processes decide differently, whether they are correct or faulty.

It is what applications need when a decision has effects outside the system: a process that decides to commit a transaction, pays, and then crashes, must not have decided differently from the others.

Hierarchical Consensus does not satisfy uniform agreement, because a leader decides too early. A faulty leader $p_1$ can decide its value and crash before its message reaches anybody; the next leader $p_2$ then decides its own, different value.

### How does Hierarchical Uniform Consensus work?

A leader must not decide as soon as its round comes: it must decide only when its value is the only one left in the system.

1. The leader of the round sends its value to everybody in a `PROPOSAL` message: "change your mind".
2. Every process that receives it stores the value and answers with an acknowledgment.
3. When the leader has the acknowledgments of all the processes that it has not detected as crashed, every process that is alive holds its value. Only then does the leader broadcast a `DECIDED` message, with reliable broadcast.
4. Every process, the leader included, decides when it delivers the `DECIDED` message.
5. If the leader crashes before this point, the next leader takes over. If it had received the proposal of the crashed leader, it adopts it before proposing.

Here a process changes round only when the leader of the current round is detected as crashed: with a correct leader, everybody stays in its round and decides its value.

### What is the pseudocode of Hierarchical Uniform Consensus?

``` Hierarchical Uniform Consensus
Implements:
  UniformConsensus, instance uc.
Uses:
  PerfectPointToPointLinks, instance pl;
  BestEffortBroadcast, instance beb;
  ReliableBroadcast, instance rb;
  PerfectFailureDetector, instance P.

upon event < uc, Init > do
  detectedranks := ∅;
  ackranks := ∅;
  round := 1;
  proposal := ⊥;
  decision := ⊥;
  proposed := [⊥]^N;

upon event < P, Crash | p > do
  detectedranks := detectedranks ∪ {rank(p)};

upon event < uc, Propose | v > such that proposal = ⊥ do
  proposal := v;

upon round = rank(self) ∧ proposal ≠ ⊥ ∧ decision = ⊥ do
  trigger < beb, Broadcast | [PROPOSAL, proposal] >;

upon event < beb, Deliver | p, [PROPOSAL, v] > do
  proposed[rank(p)] := v;
  if rank(p) ≥ round then
    trigger < pl, Send | p, [ACK] >;

upon round ∈ detectedranks do
  if proposed[round] ≠ ⊥ then
    proposal := proposed[round];
  round := round + 1;

upon event < pl, Deliver | q, [ACK] > do
  ackranks := ackranks ∪ {rank(q)};

upon detectedranks ∪ ackranks = {1, ..., N} do
  trigger < rb, Broadcast | [DECIDED, proposal] >;

upon event < rb, Deliver | p, [DECIDED, v] > such that decision = ⊥ do
  decision := v;
  trigger < uc, Decide | decision >;
```

- `ackranks`: the ranks of the processes that have acknowledged the proposal of this process.
- `proposed`: an array of $N$ positions, in which a process stores the values proposed by the leaders.
- `decision`: the value decided, initially $\bot$; it guarantees that a process decides only once.
- `detectedranks ∪ ackranks = {1, ..., N}`: every process has either acknowledged or crashed. It is the same condition as `correct ⊆ acks` in the algorithms seen so far, written in a different way.

As it is written, the condition of the handler that sends the proposal stays true until the leader decides, so nothing prevents the proposal from being sent more than once. A flag like `broadcast` in the regular algorithm makes the leader send it only once.

### What does Hierarchical Uniform Consensus cost, and why is the decision sent with reliable broadcast?

- **Best case:** if the first leader is correct, $3N$ messages are enough: $N$ for the proposal, $N$ acknowledgments, and $N$ for the decision. The `DECIDED` message is what spares the other leaders their rounds: without it, the cost would again be $N^2$.
- **Worst case:** every leader that crashes before deciding costs at most $2N$ messages (its proposal and the acknowledgments). With $f$ failures, the leader of rank $f + 1$ at the latest is correct, so the total is at most $2N \cdot f + 3N$ messages, that is, $O(f \cdot N)$. Since in practice the failures are few, this is much better than $N^2$.

The decision is sent with **reliable broadcast** because a best-effort broadcast would endanger termination. Suppose that the leader $p_1$ crashes while it is sending `DECIDED`, and that the message reaches only $p_2$. Process $p_2$ decides; since its `decision` is no longer $\bot$, when its round comes it does not send any proposal. But $p_2$ is correct and is never detected as crashed, so the other correct processes wait in its round forever, without ever deciding. With reliable broadcast, if the correct process $p_2$ delivers `DECIDED`, every correct process delivers it too. The other properties are not in danger: when `DECIDED` is sent, the value of the leader is the only one left in the system.
