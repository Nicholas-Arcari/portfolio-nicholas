## Reliable broadcast on a line topology

### What is the system model of a line topology with an oracle that notifies the new neighbors?

A line topology consists of $n$ processes $p_1, p_2, \dots, p_n$ arranged in a line, so that each internal process $p_i$ (for $1 < i < n$) is connected only to its left neighbor $p_{i-1}$ and to its right neighbor $p_{i+1}$. Process $p_1$ is the left endpoint, and process $p_n$ is the right endpoint.

- **Local variables:** each process $p_i$ has two variables, `left` and `right`, with the identifiers of its two neighbors. For $p_1$, `left` is null ($\bot$), and for $p_n$, `right` is null ($\bot$).
- **Neighbor oracle:** processes may crash, and a perfect oracle notifies a process $p_i$ when one of its neighbors has crashed, by triggering one of two events:
  - `NewLeftNeighbor(p_x)`: $p_x$ is the new left neighbor of $p_i$ (or $\bot$, if $p_i$ has become the left endpoint).
  - `NewRightNeighbor(p_x)`: $p_x$ is the new right neighbor of $p_i$ (or $\bot$, if $p_i$ has become the right endpoint).
- **Communication:** there are perfect point-to-point links between neighbors, and a process can communicate only with its neighbors. The oracle is the only source of information on failures: neither a perfect failure detector nor a leader election is available.

When a process crashes, the oracle reconnects the line: if $p_3$ crashes, $p_2$ eventually receives `NewRightNeighbor(p_4)` and $p_4$ eventually receives `NewLeftNeighbor(p_2)`, not necessarily at the same time.

### How can a regular reliable broadcast be designed on a line topology with the neighbor oracle?

The way to solve an exercise like this is to start from the case without failures, and then to add the failures. On a line without failures, a process $p_i$ that broadcasts a message $m$ sends $m$ on its left link and on its right link; each process that receives $m$ for the first time delivers it to the upper layer and relays it. With failures, a crashed neighbor breaks the chain. The oracle detects the crash and reconnects the line, skipping the crashed process. But a message that was in transit towards the crashed process is lost, and a process cannot know whether its old neighbor had the time to relay it. So, whenever the oracle notifies a new neighbor, a process sends again to the new neighbor all the messages it has delivered. This is true for the source of a message as well as for a process that is only relaying it.

``` Regular reliable broadcast on a line
upon event init do
    delivered := ∅
    leftProcess := left
    rightProcess := right

upon event < rrb, Broadcast | m > do
    delivered := delivered ∪ {(p_i, m)}
    trigger < rrb, Deliver | p_i, m >
    sendLeft((p_i, m))
    sendRight((p_i, m))

upon event < pl, Deliver | relay, (p_s, m) > do
    if (p_s, m) ∉ delivered then
        delivered := delivered ∪ {(p_s, m)}
        trigger < rrb, Deliver | p_s, m >
        sendLeft((p_s, m))
        sendRight((p_s, m))

upon event < Oracle, NewLeftNeighbor | p_x > do
    leftProcess := p_x
    for all (p_s, m) ∈ delivered do
        sendLeft((p_s, m))

upon event < Oracle, NewRightNeighbor | p_x > do
    rightProcess := p_x
    for all (p_s, m) ∈ delivered do
        sendRight((p_s, m))

procedure sendLeft((p_s, m)) do
    if leftProcess ≠ null then
        trigger < pl, Send | leftProcess, (p_s, m) >

procedure sendRight((p_s, m)) do
    if rightProcess ≠ null then
        trigger < pl, Send | rightProcess, (p_s, m) >
```

- `upon event init`: initializes the local state. The set `delivered` stores the pairs $(p_s, m)$, with the original source $p_s$ and the message $m$, to avoid delivering a message twice. The variables `leftProcess` and `rightProcess` start from the initial neighbors of the process.
- `upon event < rrb, Broadcast | m >`: executed when process $p_i$ broadcasts a message $m$. The process records $(p_i, m)$ in `delivered`, delivers $m$ to its own upper layer, and sends the pair to its left and right neighbors. The pair carries the original source, because the processes that receive the message from a relay must deliver it with the name of the source.
- `upon event < pl, Deliver | relay, (p_s, m) >`: executed when a pair $(p_s, m)$ arrives on a perfect link from a neighbor. If the pair has not been delivered yet, it is added to `delivered`, the message is delivered to the upper layer with source $p_s$, and the pair is relayed on both links. Relaying in both directions is a simplification: the neighbor from which the message came receives it again, finds it in `delivered` and ignores it.
- `upon event < Oracle, NewLeftNeighbor | p_x >`: executed when the left neighbor has crashed and $p_x$ is the new left neighbor. Process $p_i$ updates `leftProcess := p_x`, and sends again to $p_x$ all the pairs in `delivered`. If the crashed neighbor failed while it was relaying a message, the flow of that message along the reconnected line is restored.
- `upon event < Oracle, NewRightNeighbor | p_x >`: the same on the right side: the process updates `rightProcess := p_x` and sends again all the pairs in `delivered`.
- `sendLeft` and `sendRight`: two procedures that check whether `leftProcess` or `rightProcess` is different from null before sending on the perfect link.

The algorithm is a best-effort broadcast, because a correct source keeps pushing its message whenever a neighbor changes. It is also a regular reliable broadcast, for the same reason: every correct process that has delivered a message behaves like a source for it, and keeps pushing it towards its neighbors until they are correct processes that have received it. It is the eager algorithm of the complete graph, adapted to the line. Performance is not a concern here: the aim is the simplest algorithm that is correct.

### Can the algorithm for the line be adapted to implement uniform reliable broadcast?

The algorithm above does not implement uniform reliable broadcast. If a process $p_i$ broadcasts $m$, delivers it locally at once, and crashes before its messages reach the neighbors, then $p_i$ (a faulty process) has delivered $m$ while no correct process ever delivers it: uniform agreement is violated.

In the complete graph, uniform broadcast is obtained with acknowledgments: a message is kept pending, and it is delivered only when all the processes that are alive are known to have it. Here there is no global failure detector, but the idea still works, because a message propagates along the line without skipping anybody: when both endpoints have received it, everybody has.

- **A wave of acknowledgments from the endpoints:** a message $m$ propagates outwards along the line until it reaches both endpoints (the current ones, if some processes have crashed).
- **Generation of the acknowledgments:** when an endpoint (a process with `leftProcess` or `rightProcess` equal to null) receives $m$, it generates an acknowledgment (`ACK_LEFT` from the left endpoint, `ACK_RIGHT` from the right one) that propagates back inwards, relayed like any other message.
- **Conditional delivery:** a process $p_i$ that receives $m$ stores it in a set `pending` and relays it. It delivers $m$ to its upper layer **only** when it has received both `ACK_LEFT` and `ACK_RIGHT` for $m$: the first says that everybody on its left has $m$, the second that everybody on its right has it.
- **Failures in the middle and at the endpoints:** when its neighbor changes, a process sends again to the new neighbor both the messages and the acknowledgments it holds. If an endpoint crashes, the oracle notifies its neighbor that it is the new endpoint ($p_x = \bot$): the new endpoint takes over the role, and generates the acknowledgment for all the messages in its `pending` set, so that no message remains blocked because an endpoint crashed before sending its acknowledgment. A process that is left alone is both endpoints at once, and it generates both acknowledgments itself.

## Commutative and non-commutative operations on a synchronous link

### Which link abstraction is needed when the operations of a client are multiplications of numbers, and which one when they are multiplications of matrices?

A client communicates with a server over a point-to-point link that does not lose messages and is synchronous: a message sent at time $t$ is received by time $t + \Delta$. The server stores a variable $X$ (initially $X = 1$). The client sends a burst of multiplication operations, waits for $3\Delta$ time units, and then sends a `get()` request to retrieve $X$. The question is which algorithm, if any, must be built on top of the link for the client to obtain the right result, with the smallest overhead.

- **Case 1: multiplication by a number ($X \leftarrow X \cdot y$)**
  - Property: the multiplication of numbers is commutative and associative ($X \cdot y_1 \cdot y_2 = X \cdot y_2 \cdot y_1$).
  - Abstraction needed: the link as it is.
  - Analysis: the only guarantee that the link does not give is the order of the messages. But since the multiplication is commutative, the order in which the server receives and applies the operations does not change the final value of $X$: even if $y_2$ arrives before $y_1$, the result $X \cdot y_1 \cdot y_2$ is the same. Moreover the link loses nothing and is synchronous, so all the operations of the burst arrive within $\Delta \le 3\Delta$, before the `get()`. No additional algorithm is needed.
- **Case 2: multiplication by a matrix ($X \leftarrow X \cdot Y$)**
  - Property: the multiplication of matrices is **not commutative** ($A \cdot B \neq B \cdot A$).
  - Abstraction needed: a FIFO point-to-point link.
  - Analysis: the result depends on the order of the operations, so delivering them out of order changes the matrix $X$. To make the server apply the operations in the order in which the client sent them, a FIFO link must be built on top of the given link.

## A failure detector that decreases its timeout

### Is an eventually perfect failure detector ($\diamond\mathcal{P}$) still correct if a false suspicion makes it halve its timeout instead of increasing it?

Consider an implementation of an eventually perfect failure detector ($\diamond\mathcal{P}$) in which the processes exchange heartbeats periodically. When a process $p_i$ finds out that it has wrongly suspected a correct process $p_j$, because a heartbeat of $p_j$ arrives after the timeout, it restores $p_j$ and it changes its timeout by halving it, `delay := delay / 2`, instead of increasing it, `delay := delay + Δ`. The exercise asks whether the algorithm still satisfies the two properties of $\diamond\mathcal{P}$.

- **Property 1: strong completeness**
  - Definition: eventually, every process that crashes is permanently suspected by every correct process.
  - Evaluation: **it holds.** If process $p_j$ crashes, it stops sending heartbeats forever. After the crash, at the next timeout $p_i$ does not find $p_j$ among the processes that are alive, adds it to its set of suspected processes, and triggers `Suspect(p_j)`. Since $p_j$ is dead, no heartbeat will ever arrive to trigger `Restore(p_j)`: $p_j$ remains suspected by $p_i$ forever.
- **Property 2: eventual strong accuracy**
  - Definition: eventually, no correct process is suspected by any correct process.
  - Evaluation: **it does not hold.** If $p_i$ suspects the correct process $p_j$ too early and later receives its heartbeat, $p_i$ restores $p_j$ and executes `delay := delay / 2`. Halving `delay` makes the timeout shorter than the time that a message needs to travel. So $p_i$ times out even sooner in the next interval, suspects $p_j$ again, restores it again, and halves `delay` again. When `delay` has become negligible (say one nanosecond) while a message takes much longer to arrive, $p_i$ keeps suspecting and restoring the correct processes forever, without ever stabilizing.

Both properties are liveness properties, as they must be in an eventually synchronous system. The fix is the one of the original algorithm: after a mistake, the timeout must be increased, never decreased.

## Classifying the executions of a broadcast, and an impossible property

### How are best-effort broadcast (BEB), regular reliable broadcast (RB) and uniform reliable broadcast (URB) told apart in an execution?

The three abstractions differ in what they guarantee about agreement:

- **Best-effort broadcast (BEB):** it guarantees validity only: if a correct process broadcasts $m$, all the correct processes deliver $m$. If the sender crashes while it is sending, some correct processes may deliver $m$ and others may not.
- **Regular reliable broadcast (RB):** it guarantees agreement among the correct processes: if a correct process delivers $m$, all the correct processes deliver $m$. A faulty process may deliver a message that no correct process ever delivers.
- **Uniform reliable broadcast (URB):** it guarantees uniform agreement: if **any** process (correct or faulty) delivers $m$, all the correct processes deliver $m$. The set of the messages delivered by a faulty process $p_f$ is a subset of the set of the messages delivered by the correct processes: $M(p_f) \subseteq M(p_{\text{correct}})$.

In the exam exercises an execution is given, and it must be completed with the smallest number of events so that it satisfies one specification and not the next one. Two rules help:

- To obtain an execution that is BEB but not RB, the message that makes the difference must have a **faulty** source: it is delivered by some correct process and not by another one. With a correct source this is impossible, because validity forces all the correct processes to deliver.
- To obtain an execution that is RB but not URB, a message must be delivered by a faulty process and by no correct process. Again the source must be faulty: a message broadcast by a correct process must be delivered by all the correct processes, already for best-effort broadcast.

### Why is it impossible to guarantee delivery to processes that are not correct?

Consider, in a fail-stop system with a perfect failure detector and perfect links, a broadcast with the property: "if any process sends a message $m$, then any other process delivers $m$".

1. The property cannot be implemented in a system in which processes can crash.
2. **The receiver has already crashed:** suppose that process $p_i$ broadcasts $m$ at time $t$, and that process $p_j$ crashed before $t$. When $p_j$ was alive the message did not exist, and now $p_j$ is dead: it can never deliver $m$.
3. **The same holds with a correct sender:** the property "if a correct process delivers a message $m$, then any other process delivers $m$" is impossible for the same reason, because the counterexample does not depend on the sender.
4. **Conclusion:** the specifications of broadcast must condition their guarantees on the correct processes ("if a correct process broadcasts $m$, then every correct process eventually delivers $m$", or "if a process delivers $m$, then every correct process eventually delivers $m$"). A correct process has all the time that is needed; a process that is not required to be correct may stop before the message even exists.

## Reads on a register: allowed values and violations of sequential consistency

### How are the values that the reads may return determined, under the regular and the atomic semantics?

Consider the operations on a $(1,N)$ register, with writes and reads that overlap in time:

- **Regular consistency:**
  - A read that is not concurrent with any write must return the value of the last write that precedes it.
  - A read that is concurrent with one or more writes may return either the value of the last write that precedes it or the value of any of the concurrent writes.
- **Atomic consistency (linearizability):**
  - All the operations must appear to be executed instantaneously at a linearization point $L(\mathit{op})$, placed between the invocation and the completion of each operation.
  - If a read $R_1$ returns the value $v_2$ of a write $W_2$, and a read $R_2$ starts after $R_1$ has completed ($R_1 \to R_2$), then $R_2$ **cannot** return the older value $v_1$ of a previous write $W_1$: it would violate the ordering property.

For the atomic case it is convenient to draw a tree. The reads are taken in the order in which they start; the root is the first read, and each branch corresponds to one of the values it may return. Below each branch come the values allowed to the next read, given the choices made above, and so on: a path from the root to a leaf is a possible atomic execution. The pattern that prunes the tree is a write that is concurrent with two reads which are not concurrent with each other: if the first read returns the value of that write, the second one cannot return an older value.

### How can a sequence of returned values that violates sequential consistency be built?

Sequential consistency requires a single global sequence $S$ of all the operations of all the processes, such that:

1. $S$ preserves the local order of the operations of each process.
2. Each read in $S$ returns the value written by the most recent write that precedes it in $S$.

An execution violates sequential consistency if no such sequence $S$ exists. Since $S$ is free to reorder the operations of different processes, the only way to make it impossible is to break a local order: only a process that executes two or more operations can be used.

- **Example:**
  - Process $p_1$ executes $W(x)=1 \to W(x)=2$.
  - Process $p_2$ executes $R(x)=2 \to R(x)=1$.
- **Analysis:**
  - To justify $R(x)=2$, the write $W(x)=2$ must precede $R(x)=2$ in $S$.
  - To justify $R(x)=1$, the write $W(x)=1$ must precede $R(x)=1$, and $W(x)=2$ must follow $R(x)=1$ in $S$ (otherwise $W(x)=2$ would overwrite $1$, and the read would return $2$).
  - This forces the order $W(x)=1 \to R(x)=1 \to W(x)=2 \to R(x)=2$.
  - But on process $p_2$ the local order is $R(x)=2 \to R(x)=1$, and the sequence inverts it.
  - So no valid sequence $S$ exists, and sequential consistency is violated.

Other ways to violate it are a read that returns the initial value $\bot$ on a process that has already completed a write, and a read that returns a value that nobody has written (a solution that an exam text usually rules out by asking for values that have been written).

## Atomic registers: optimizations and assumptions

### Can a $(1,1)$ atomic register be implemented in the fail-silent model more efficiently than with Read-Impose Write-Majority?

In the Read-Impose Write-Majority algorithm for the $(1,N)$ atomic register (fail-silent model, $f < N/2$), a read has two phases:

1. **Query phase:** the reader asks a majority of processes ($\lfloor N/2 \rfloor + 1$) for their pairs, and finds the pair $(\mathit{ts}, v)$ with the highest timestamp.
2. **Impose phase:** the reader writes $(\mathit{ts}, v)$ back to a majority before returning to its upper layer. This phase is needed in a $(1,N)$ register to prevent a new value from being read before an old one by two different readers $p_{r1}$ and $p_{r2}$.

In a $(1,1)$ atomic register (one writer and one reader $p_r$):

- **Optimization:** the second phase (the impose phase) of the read can be **removed** entirely.
- **Justification:** $p_r$ is the **only** reader of the system, and the impose phase exists for the other readers. The inversion between a new and an old value occurs when a reader $p_{r1}$ obtains a new value $v_2$ from a process of a minority, and a later reader $p_{r2}$ asks a majority that has not received $v_2$ yet and reads the old value $v_1$. With a single reader, it is enough that $p_r$ keeps the pair with the highest timestamp $\mathit{ts}_{\max}$ that it has ever seen: at each read it asks a majority, compares the timestamps it receives with its own, and returns the value with the highest one. Since $p_r$ never forgets what it has seen, it never returns an older value in a later read.
- **Gain:** the messages of a read go from $4N$ ($2N$ for the query and $2N$ for the imposition) to $2N$ (the query only), and its duration from $4$ message delays to $2$.

Two even simpler ideas do not work. If the reader asked only the writer, a read would never terminate after a crash of the writer, because without a failure detector the reader would wait forever. Symmetrically, if the writer sent the value only to the reader and waited for its acknowledgment, a write would never terminate after a crash of the reader. Waiting for a majority is what guarantees termination.

### Why can the request identifiers be omitted in the fail-stop model with $\mathcal{P}$, while they are necessary in the fail-silent model with quorums?

- **Fail-stop model with a perfect failure detector ($\mathcal{P}$), Read-One Write-All:**
  - The reads are purely local, without messages: there are no `READ` and `VALUE` messages that could carry an identifier.
  - A write broadcasts $v$ to all the processes and waits for the acknowledgments of **all** the processes that have not been detected as crashed.
  - Since a write completes only after all the correct processes have acknowledged it, when it ends nothing of that write is left in the network: no `WRITE` message still to be delivered, no acknowledgment still to arrive (except those of processes that have crashed, which do not matter).
  - Therefore an operation never meets the late answers to a previous one, and the identifiers are not needed.
- **Fail-silent model with quorums ($f < N/2$), Majority Voting:**
  - Writes and reads wait for the answers of a majority ($\lfloor N/2 \rfloor + 1$ processes).
  - The messages to and from the processes outside that majority can be delayed arbitrarily in an asynchronous network.
  - When a new operation starts, the late answers to the previous reads or writes can still arrive.
  - The request identifiers are necessary to discard those late answers, which otherwise would be counted for the new operation.

### How are the fail-stop model and the synchronous model related?

- **Fail-stop model:** processes crash, and a perfect failure detector $\mathcal{P}$ is available.
- **Synchronous model:** there is a known bound on the delay of the messages on the links.
- **Relation:** the synchronous model is the stronger one. In a synchronous system a perfect failure detector can be implemented, with timeouts. With a perfect failure detector alone, instead, nothing can be said about the delay of the messages: a process that sends a message knows that it will be told if the destination crashes, but it does not know by when the message will arrive.

### Why does the atomic register built on regular registers need neither a failure detector nor a majority of correct processes?

With message passing, the $(1,N)$ atomic register needs a perfect failure detector (Read-Impose Write-All) or, in the fail-silent model, a majority of correct processes (Read-Impose Write-Majority). The construction that uses the matrix of registers built on $(1,N)$ regular registers, instead, mentions neither of them.

The assumptions have not disappeared: they are hidden inside the regular registers. To implement a regular register with message passing, either a perfect failure detector or a majority of correct processes is needed, and the construction inherits whatever the registers below it require. It can avoid naming those assumptions only because the registers already give it enough guarantees.
