## Impossibility of uniform reliable broadcast without a majority of correct processes

### What separates regular reliable broadcast from uniform reliable broadcast in asynchronous and partially synchronous systems?

In an asynchronous or eventually synchronous system without a perfect failure detector $\mathcal{P}$, regular reliable broadcast can be implemented with the Eager Reliable Broadcast algorithm, without any assumption on the number $f$ of faulty processes. Uniform reliable broadcast, on the contrary, cannot be solved unless a strict majority of the processes is correct, that is, unless $f < n/2$. If $f \ge n/2$, no deterministic algorithm can guarantee uniform agreement in all executions.

### How is the impossibility of uniform reliable broadcast proved when $f \ge n/2$?

The impossibility is proved by contradiction for a system of $n = 2$ processes ($p_1, p_2$) in which $f = 1$ process can fail (so that $f = n/2$).

Assume by contradiction that there exists a deterministic algorithm $\mathcal{A}$ that solves uniform reliable broadcast in an asynchronous or eventually synchronous system of $n = 2$ processes with at most $f = 1$ crash, without a perfect failure detector.

- **Execution $E_1$ (a crash at $t = 0$):**
  - Process $p_2$ crashes at time $t = 0$, before sending or receiving any message.
  - Process $p_1$ is correct and broadcasts a message $m$ at time $t = 0$.
  - By the **validity** property of uniform reliable broadcast, a correct process that broadcasts a message eventually delivers it. Since $p_1$ is correct in $E_1$, $p_1$ must deliver $m$ at some finite time $t_{\mathit{del}} > 0$.
  - During the interval $[0, t_{\mathit{del}}]$, process $p_1$ receives no message from $p_2$ (which is dead). Thus, the decision of $p_1$ to deliver $m$ at $t_{\mathit{del}}$ is based only on its local execution and on the absence of messages from $p_2$ during $[0, t_{\mathit{del}}]$.
- **Execution $E_2$ (slow messages and a later crash):**
  - Consider a second execution $E_2$ in which both $p_1$ and $p_2$ are alive at $t = 0$, and $p_1$ broadcasts the message $m$ at $t = 0$.
  - The asynchronous network (or an eventually synchronous system before it stabilizes) delays all the messages between $p_1$ and $p_2$ beyond time $t_{\mathit{del}}$. An eventually perfect failure detector does not help: before stabilization it may suspect $p_2$ during the whole interval, exactly as it rightly does in $E_1$.
  - From the local point of view of process $p_1$, the execution $E_2$ is **indistinguishable** from $E_1$ during the interval $[0, t_{\mathit{del}}]$. In both cases, $p_1$ broadcasts $m$ at $t = 0$ and receives no message from $p_2$ during $[0, t_{\mathit{del}}]$.
  - Because $p_1$ is a deterministic state machine and observes the same local history in $E_1$ and in $E_2$ up to $t_{\mathit{del}}$, $p_1$ must perform **in $E_2$ exactly the same steps as in $E_1$**. Consequently, $p_1$ delivers the message $m$ at time $t_{\mathit{del}}$ in $E_2$.
  - Immediately after delivering $m$, $p_1$ crashes: in $E_2$ it is a **faulty process**.
  - Furthermore, all the messages that $p_1$ sent before crashing, still in transit, are lost: a perfect link guarantees the delivery of a message only if its sender is correct.
  - Process $p_2$, which is correct in the whole execution $E_2$, never receives any message about $m$, and knows nothing about the existence of $m$.
  - Consequently, $p_2$ never delivers $m$.
- **Contradiction with uniform agreement:**
  - In the execution $E_2$, process $p_1$ (which is faulty, because it crashed right after $t_{\mathit{del}}$) delivered the message $m$.
  - Process $p_2$ (which is correct in $E_2$) never delivers the message $m$.
  - This directly violates the **uniform agreement** property, which requires that if **any** process (correct or faulty) delivers a message $m$, then **every** correct process eventually delivers $m$.
  - Thus, the hypothetical algorithm $\mathcal{A}$ fails: no deterministic algorithm can solve uniform reliable broadcast for $n = 2, f = 1$ without a majority of correct processes or a perfect failure detector $\mathcal{P}$.

The same argument works for any $n$ with $f \ge n/2$: it is enough to split the processes into two groups of at most $f$ processes each, which play the roles of $p_1$ and $p_2$, and to slow down all the messages between the two groups.

### Why does the quorum requirement ($f < n/2$) circumvent this impossibility result?

When $f < n/2$, the set of correct processes is a strict majority $Q_C \subseteq \Pi$, with $|Q_C| \ge \lfloor n/2 \rfloor + 1$. In a quorum-based protocol, a process $p_i$ is allowed to deliver a message $m$ only after collecting the acknowledgments of a majority quorum $Q_1$.

By the properties of quorums over a finite set of $n$ processes: $$\forall Q_1, Q_2 \subseteq \Pi \text{ such that } |Q_1| \ge \left\lfloor \frac{n}{2} \right\rfloor + 1 \text{ and } |Q_2| \ge \left\lfloor \frac{n}{2} \right\rfloor + 1 \implies Q_1 \cap Q_2 \neq \emptyset$$

Because any two quorums overlap in at least one process, and the number of faulty processes is bounded by $f < n/2$, any quorum $Q_1$ that acknowledges $m$ to $p_1$ contains at least one correct process $p_{\mathit{survivor}} \in Q_1 \cap Q_C$. Even if $p_1$ crashes immediately after delivering $m$, the process $p_{\mathit{survivor}}$ stays alive and relays $m$ to all the other processes, guaranteeing that every correct process of $Q_C$ eventually delivers $m$.

## FIFO-order reliable broadcast

### What are ordered communications?

Reliable broadcast says nothing about the order in which messages are delivered, and this can cause anomalies in many applications: a server that delivers "cancel my reservation" before "reserve a seat" cancels a reservation that has never been made. Ordered communications define guarantees on the order of the deliveries inside a group of processes. There are three types of ordering: deliveries can respect the FIFO order of the corresponding broadcasts, their causal order, or a total order (the last one is treated after consensus). Ordering is orthogonal to reliability: a reliable ordered communication is obtained by adding one or more ordering properties to a reliable broadcast.

### What is the definition and the interface of FIFO-order reliable broadcast?

FIFO-order reliable broadcast (FRB) adds to the guarantees of reliable broadcast the ordering of the messages of a single source. It ensures that the messages broadcast by the same sender $p_i$ are delivered by all processes in the exact order in which $p_i$ broadcast them.

The FIFO broadcast abstraction exposes two events:

- **Request event:** $\text{frbBroadcast}(m)$ - invoked by a process to broadcast the message $m$ with FIFO ordering guarantees.
- **Indication event:** $\text{frbDeliver}(p_i, m)$ - triggered by the abstraction to deliver the message $m$ broadcast by the source process $p_i$.

### What are the properties that specify FIFO-order reliable broadcast?

A FIFO-order reliable broadcast primitive over a set of processes $\Pi = \{p_1, p_2, \dots, p_n\}$ satisfies five properties, the four of reliable broadcast plus one on the order:

- **FRB1 (validity):** if a correct process $p_i$ broadcasts a message $m$, then $p_i$ eventually delivers $m$.
- **FRB2 (no duplication):** no message $m$ is delivered more than once by any process.
- **FRB3 (no creation):** if a process delivers a message $m$ with sender $p_i$, then $m$ was previously broadcast by $p_i$.
- **FRB4 (agreement):** if a message $m$ is delivered by a correct process $p_i$, then $m$ is eventually delivered by every correct process $p_j$. (In uniform FIFO broadcast, this becomes uniform agreement.)
- **FRB5 (FIFO delivery):** if a process $p_i$ broadcasts a message $m_1$ before it broadcasts a message $m_2$, then no correct process $p_j$ delivers $m_2$ unless it has already delivered $m_1$.

The FIFO property is orthogonal to the reliability guarantees: the broadcast can be regular or uniform, and an execution can be FIFO without being regular or uniform.

### How is FIFO-order reliable broadcast implemented using sequence numbers?

FIFO-order reliable broadcast is built on top of a regular reliable broadcast (`rb`) or of a uniform reliable broadcast (`urb`), by attaching a monotonically increasing local sequence number $\mathit{lsn}$ to every broadcast message, and by keeping the messages delivered out of order in a set `pending` until all the messages of that sender with smaller sequence numbers have been delivered.

``` Broadcast with Sequence Number: FIFO-order reliable broadcast
# Algorithm: FIFO-Order Reliable Broadcast (FRB)
# Implemented on process p_i using an underlying Reliable Broadcast (rb) module

Upon Event: frbInit:
    lsn := 0
    pending := ∅
    for all p_j ∈ Π do:
        next[p_j] := 1

Upon Event: frbBroadcast(m):
    lsn := lsn + 1
    trigger rbBroadcast([DATA, p_i, m, lsn])

Upon Event: rbDeliver(p_j, [DATA, p_s, m, seq]):
    pending := pending ∪ {[p_s, m, seq]}
    while ∃ [p_s, m', seq'] ∈ pending such that seq' = next[p_s] do:
        pending := pending \ {[p_s, m', seq']}
        next[p_s] := next[p_s] + 1
        trigger frbDeliver(p_s, m')
```

**Line-by-line explanation of the pseudocode:**

- `Upon Event: frbInit`:
  - `lsn := 0`: initializes to zero the local sequence counter of the messages broadcast by process $p_i$.
  - `pending := ∅`: initializes an empty set, used to hold the incoming messages that are out of order.
  - `for all p_j ∈ Π do: next[p_j] := 1`: initializes an array $\mathit{next}[1 \dots n]$ of size $n$, where $\mathit{next}[p_j]$ is the next sequence number expected from the sender $p_j$.
- `Upon Event: frbBroadcast(m)`:
  - `lsn := lsn + 1`: increments the local sequence counter before sending the message.
  - `trigger rbBroadcast([DATA, p_i, m, lsn])`: packs the payload $m$, the identity of the original sender $p_i$, and the sequence number $\mathit{lsn}$ into a tuple, and hands it to the underlying reliable broadcast.
- `Upon Event: rbDeliver(p_j, [DATA, p_s, m, seq])`:
  - `pending := pending ∪ {[p_s, m, seq]}`: upon receiving a tuple from reliable broadcast, $p_i$ adds the payload $m$, the sender $p_s$, and the sequence number $\mathit{seq}$ to its set $\mathit{pending}$.
  - `while ∃ [p_s, m', seq'] ∈ pending such that seq' = next[p_s] do`: checks repeatedly whether the set $\mathit{pending}$ contains a message of the sender $p_s$ whose sequence number $\mathit{seq}'$ is exactly the expected one, $\mathit{next}[p_s]$.
  - `pending := pending \ {[p_s, m', seq']}`: removes that message from the set $\mathit{pending}$.
  - `next[p_s] := next[p_s] + 1`: increments the sequence number expected from the sender $p_s$.
  - `trigger frbDeliver(p_s, m')`: triggers the indication event for the upper layer, delivering the message $m'$ of the source $p_s$ in FIFO order.

### How does the FIFO algorithm handle messages that arrive out of order?

Suppose process $p_0$ broadcasts $m_1$ (with $\mathit{seq}=1$) immediately followed by $m_2$ (with $\mathit{seq}=2$). Because the network is asynchronous, process $p_2$ receives $m_2$ ($\mathit{seq}=2$) from `rbDeliver` before receiving $m_1$ ($\mathit{seq}=1$).

1. When $p_2$ receives $m_2$ ($\mathit{seq}=2$), it inserts $[p_0, m_2, 2]$ into $\mathit{pending}$.
2. The `while` condition checks whether $\mathit{seq}' = \mathit{next}[p_0]$. Since $\mathit{next}[p_0] = 1$ and the message in the set has $\mathit{seq}'=2$, the condition is false. The message $m_2$ stays in $\mathit{pending}$, which prevents a delivery out of order.
3. Eventually, $m_1$ ($\mathit{seq}=1$) arrives at $p_2$ from `rbDeliver` and is added to $\mathit{pending}$.
4. The `while` condition is true for $[p_0, m_1, 1]$, because $\mathit{seq}' = \mathit{next}[p_0] = 1$.
5. $p_2$ removes $m_1$ from $\mathit{pending}$, increments $\mathit{next}[p_0]$ to $2$, and triggers `frbDeliver(p_0, m_1)`.
6. In the next iteration of the `while` loop, the condition is true for $[p_0, m_2, 2]$, because $\mathit{seq}'=2$ is now equal to $\mathit{next}[p_0]=2$.
7. $p_2$ removes $m_2$ from $\mathit{pending}$, increments $\mathit{next}[p_0]$ to $3$, and triggers `frbDeliver(p_0, m_2)`.
8. Both messages are delivered in FIFO order ($m_1$ followed by $m_2$).

## Causal-order reliable broadcast

### Why is FIFO ordering insufficient to maintain consistency in applications with many participants?

FIFO ordering only constrains the messages of the **same** sender. It places no constraint on messages broadcast by **different** processes, even when those messages are causally dependent on one another.

Consider the blackboard example of a **distributed ledger of bank accounts**. A transaction $T(q, s, d)$ moves the quantity of money $q$ from the source account $s$ to the destination account $d$, and it is valid only if the balance of the source does not become negative. At the beginning everybody knows the balance of the others: process $p_0$ has $3$, process $p_1$ has $10$, processes $p_2$ and $p_3$ have $0$. Every transaction is broadcast, and each process updates its view of the balances according to the transactions it delivers.

1. **Transaction $T_1 = T(3, p_0, p_1)$:** $p_0$ broadcasts a transfer of $3$ from $p_0$ to $p_1$.
2. Process $p_1$ delivers $T_1$: its balance rises to $13$, while the balance of $p_0$ drops to $0$.
3. **Transaction $T_2 = T(5, p_1, p_2)$:** after delivering $T_1$, process $p_1$ broadcasts a transfer of $5$ from $p_1$ to $p_2$.
4. **Transaction $T_3 = T(6, p_1, p_0)$:** process $p_1$ then broadcasts a transfer of $6$ from $p_1$ to $p_0$.
5. Process $p_0$ delivers $T_3$: its balance rises to $6$.
6. **Transaction $T_4 = T(3, p_0, p_3)$:** after delivering $T_3$, process $p_0$ broadcasts a transfer of $3$ from $p_0$ to $p_3$.
7. Suppose the underlying communication primitive guarantees FIFO broadcast, but **not** causal broadcast.
8. Process $p_3$ delivers $T_1$ ($3$ from $p_0$ to $p_1$). In the local ledger of $p_3$, the balance of $p_0$ is now $0$.
9. Because of network delays, the transaction $T_3$ ($6$ from $p_1$ to $p_0$) is slow.
10. Process $p_3$ delivers the transaction $T_4$ ($3$ from $p_0$ to $p_3$) before $T_3$.
11. Process $p_3$ looks at its local ledger: $p_0$ currently has $0$. $p_3$ rejects the transaction $T_4$ **as invalid**, because the balance of $p_0$ would become negative.
12. The anomaly arises because $T_4$ was causally generated by $T_3$ ($T_3 \to T_4$), but $p_3$ delivered $T_4$ before $T_3$. FIFO broadcast cannot prevent it, because $T_3$ was broadcast by $p_1$ while $T_4$ was broadcast by $p_0$. A **causal order broadcast** primitive is needed, which preserves causality across different senders.

### What is the definition of causal delivery?

Causal order is an extension of Lamport's happened-before relation to broadcast messages. A message $m_1$ may have potentially caused a message $m_2$, written $m_1 \to m_2$, if any of the following holds:

1. Some process $p_i$ broadcast $m_1$ before it broadcast $m_2$.
2. Some process $p_j$ delivered $m_1$ and subsequently broadcast $m_2$.
3. There exists a message $m'$ such that $m_1 \to m'$ and $m' \to m_2$ (transitivity).

Causal-order reliable broadcast has the properties CRB1-CRB4, which are the four properties of reliable broadcast, plus:

- **CRB5 (causal delivery):** for any message $m_1$ that potentially caused a message $m_2$, that is, $m_1 \to m_2$, no process delivers $m_2$ unless it has already delivered $m_1$.

Like FIFO broadcast, causal broadcast can be regular or uniform. Causal delivery implies FIFO delivery, because of the first rule.

### How is No-Waiting Causal Reliable Broadcast implemented using the full history of messages?

The **No-Waiting Causal Reliable Broadcast** algorithm never delays a delivery at the receiver: it attaches to every outgoing message the entire causal history ($\mathit{past}$) of the sender. When a process receives a tuple with a payload $m$ and a history list $\mathit{past}$, it goes through $\mathit{past}$, delivers in causal order all the preceding messages that it has not delivered yet, and then immediately delivers $m$, without ever keeping it in a buffer.

``` No-Waiting Causal Reliable Broadcast
# Algorithm 1: No-Wait Causal Reliable Broadcast (Full History / Past Vector)
# Implemented on process p_i using an underlying Reliable Broadcast (rb) module

Upon Event: crbInit:
    delivered := ∅
    past := []

Upon Event: crbBroadcast(m):
    trigger rbBroadcast([DATA, past, m])
    past := past || [(p_i, m)]

Upon Event: rbDeliver(p_j, [DATA, m_past, m]):
    if m ∉ delivered then:
        for all (p_s, m') ∈ m_past do:
            if m' ∉ delivered then:
                delivered := delivered ∪ {m'}
                if (p_s, m') ∉ past then:
                    past := past || [(p_s, m')]
                trigger crbDeliver(p_s, m')
        delivered := delivered ∪ {m}
        if (p_j, m) ∉ past then:
            past := past || [(p_j, m)]
        trigger crbDeliver(p_j, m)
```

**Line-by-line explanation of the pseudocode:**

- `Upon Event: crbInit`:
  - `delivered := ∅`: the set of all the messages that $p_i$ has delivered to the upper layer.
  - `past := []`: an ordered list (a sequence) that records all the messages that causally precede the future broadcasts of $p_i$.
- `Upon Event: crbBroadcast(m)`:
  - `trigger rbBroadcast([DATA, past, m])`: broadcasts with reliable broadcast a tuple that contains the tag `DATA`, the entire causal history `past` of the sender, and the payload $m$.
  - `past := past || [(p_i, m)]`: appends the message just broadcast, $(p_i, m)$, to the local history list $\mathit{past}$ of $p_i$.
- `Upon Event: rbDeliver(p_j, [DATA, m_past, m])`:
  - `if m ∉ delivered then`: checks whether the payload $m$ has already been delivered, to avoid processing it twice.
  - `for all (p_s, m') ∈ m_past do`: goes through the causal history list `m_past` attached by the sender, in the order of the list, from the oldest to the newest.
  - `if m' ∉ delivered then`: if a causally preceding message $m'$ has not been delivered locally by $p_i$ yet:
    - `delivered := delivered ∪ {m'}`: marks $m'$ as delivered.
    - `if (p_s, m') ∉ past then: past := past || [(p_s, m')]`: appends $(p_s, m')$ to the local list $\mathit{past}$ of $p_i$, unless it is already there, so that causality is preserved for the processes that will receive the future broadcasts of $p_i$.
    - `trigger crbDeliver(p_s, m')`: immediately delivers $m'$ to the upper layer.
  - `delivered := delivered ∪ {m}`: marks the message $m$ itself as delivered.
  - `if (p_j, m) ∉ past then: past := past || [(p_j, m)]`: appends $(p_j, m)$ to the local list $\mathit{past}$ of $p_i$. The test matters for the sender, which has already appended its own message when it broadcast it.
  - `trigger crbDeliver(p_j, m)`: delivers the message $m$ to the upper layer.

### What are the space limits of No-Waiting Causal Broadcast, and how does garbage collection solve them?

In the No-Waiting Causal Broadcast algorithm, the list $\mathit{past}$ grows without bound over time (a space complexity of $O(|E|)$, where $|E|$ is the total number of broadcasts in the history of the system): every message travels together with its whole causal history, which requires infinite memory. In a system that runs for a long time, attaching $\mathit{past}$ to every message makes messages enormous.

There is no need, however, to keep old messages forever: a message can be discarded once it has been delivered by all correct processes. A **garbage collection (GC)** mechanism keeps track of "who delivered what", using a perfect failure detector $\mathcal{P}$ and the sets of acknowledgments $\mathit{ack}[m]$. When a message $m$ has been delivered by all the processes not detected as crashed ($\text{correct} \subseteq \mathit{ack}[m]$), the message $m$ is stable and can be safely removed from the list $\mathit{past}$. The mechanism only works with $\mathcal{P}$, that is, in the fail-stop model.

``` No-Waiting Causal Reliable Broadcast with garbage collection of the past
# Algorithm 2: Improved No-Wait Causal Reliable Broadcast with Garbage Collection
# Implemented on process p_i using Perfect Failure Detector P and Reliable Broadcast (rb)

Upon Event: ecrbInit:
    delivered := ∅
    past := []
    correct := Π
    for all m do: ack[m] := ∅

Upon Event: ecrbBroadcast(m):
    trigger rbBroadcast([DATA, past, m])
    past := past || [(p_i, m)]

Upon Event: rbDeliver(p_j, [DATA, m_past, m]):
    if m ∉ delivered then:
        for all (p_s, m') ∈ m_past do:
            if m' ∉ delivered then:
                delivered := delivered ∪ {m'}
                if (p_s, m') ∉ past then:
                    past := past || [(p_s, m')]
                trigger ecrbDeliver(p_s, m')
                trigger rbBroadcast([ACK, m'])
        delivered := delivered ∪ {m}
        if (p_j, m) ∉ past then:
            past := past || [(p_j, m)]
        trigger ecrbDeliver(p_j, m)
        trigger rbBroadcast([ACK, m])

Upon Event: rbDeliver(p_j, [ACK, m]):
    ack[m] := ack[m] ∪ {p_j}
    if correct ⊆ ack[m] then:
        past := past \ {(p_s, m)}

Upon Event: P_Crash(p_f):
    correct := correct \ {p_f}
    for all m ∈ delivered do:
        if correct ⊆ ack[m] then:
            past := past \ {(p_s, m)}
```

The first three handlers are those of the previous algorithm, with one addition: a process that delivers a message also broadcasts an `ACK` for it. The last two handlers do the garbage collection: when the `ACK`s of all the processes in `correct` have arrived for a message $m$, the pair $(p_s, m)$ is removed from `past`; the same check is repeated when a crash is detected, because the set `correct` has become smaller.

The garbage collection, however, does not put a bound on the size of $\mathit{past}$. A message is removed two message delays after its broadcast (one for the message to reach everybody, one for the acknowledgments to come back), but in an asynchronous system two message delays can be an arbitrarily long physical time, and in the meantime every new broadcast makes $\mathit{past}$ longer.

### How does Waiting Causal Reliable Broadcast use vector clocks to keep messages small?

Instead of sending the full history of messages ($\mathit{past}$), **Waiting Causal Reliable Broadcast** replaces the history lists with compact **vector clocks** $V[1 \dots N]$ of size $n$. Each process $p_i$ maintains a vector clock $V_i[1 \dots N]$, where $V_i[j]$ is the number of messages broadcast by process $p_j$ that $p_i$ has delivered. The algorithm needs no failure detector: it works in the fail-silent model.

``` Waiting Causal Reliable Broadcast
# Algorithm 3: Waiting Causal Reliable Broadcast (Vector Clock Approach)
# Implemented on process p_i using Reliable Broadcast (rb)

Upon Event: wcrbInit:
    V := [0, 0, ..., 0]  # Vector of size N
    lsn := 0
    pending := ∅

Upon Event: wcrbBroadcast(m):
    W := V
    W[p_i] := lsn
    lsn := lsn + 1
    trigger rbBroadcast([DATA, p_i, W, m])

Upon Event: rbDeliver(p_j, [DATA, p_s, W, m]):
    pending := pending ∪ {[p_s, W, m]}
    while ∃ [p_s, W', m'] ∈ pending such that W' ≤ V do:
        pending := pending \ {[p_s, W', m']}
        V[p_s] := V[p_s] + 1
        trigger wcrbDeliver(p_s, m')
```

**Line-by-line explanation of the pseudocode:**

1. `Upon Event: wcrbInit`:
  - `V := [0, 0, ..., 0]`: initializes to all zeros the local vector clock $V_i$ of process $p_i$, of length $n$.
  - `lsn := 0`: initializes to zero the local sequence counter of the broadcasts.
  - `pending := ∅`: initializes an empty set, used to hold the messages that cannot be delivered yet.
2. `Upon Event: wcrbBroadcast(m)`:
  - `W := V`: copies the current vector clock into the timestamp $W$.
  - `W[p_i] := lsn`: sets the own component $W[p_i]$ to the local sequence number $\mathit{lsn}$, that is, to the number of messages that $p_i$ has broadcast before this one.
  - `lsn := lsn + 1`: increments the local sequence counter $\mathit{lsn}$.
  - `trigger rbBroadcast([DATA, p_i, W, m])`: broadcasts with reliable broadcast the payload $m$, the identity of the original sender $p_i$, and the vector timestamp $W$.
3. `Upon Event: rbDeliver(p_j, [DATA, p_s, W, m])`:
  - `pending := pending ∪ {[p_s, W, m]}`: puts the incoming message $m$, with its sender $p_s$ and its timestamp $W$, into $\mathit{pending}$.
  - `while ∃ [p_s, W', m'] ∈ pending such that W' ≤ V do`: evaluates the **causal delivery condition** $W' \le V$, that is, $W'[k] \le V[k]$ for every component $k$:
    - $W'[p_s] \le V[p_s]$: all the messages that the sender $p_s$ broadcast before $m'$ have already been delivered here. Since $W'[p_s]$ is exactly the number of those messages, $m'$ is the **next** message expected from $p_s$.
    - $W'[k] \le V[k]$ for $k \neq p_s$: process $p_i$ has already delivered **all the messages** of every other process $p_k$ that $p_s$ had delivered when it broadcast $m'$, that is, the messages that causally precede $m'$.
  - `pending := pending \ {[p_s, W', m']}`: removes from $\mathit{pending}$ the message $m'$, which is now ready.
  - `V[p_s] := V[p_s] + 1`: updates the vector clock of $p_i$ to record the delivery of the message $m'$ of the sender $p_s$.
  - `trigger wcrbDeliver(p_s, m')`: delivers the message $m'$ to the upper layer.

When a message arrives whose timestamp is not yet covered by $V$, the process delays its delivery: the message waits in $\mathit{pending}$ until the messages that precede it have been delivered. The execution seen in class, with three processes that all start from $[0, 0, 0]$, shows it:

1. Process $p_1$ broadcasts $m_1$. Its $\mathit{lsn}$ is $0$, so $m_1$ travels with the timestamp $[0, 0, 0]$.
2. Process $p_3$ receives $m_1$: since $[0, 0, 0] \le [0, 0, 0]$, it delivers $m_1$ and increments the component of the sender, so its vector becomes $[1, 0, 0]$.
3. Process $p_3$ broadcasts $m_2$, which travels with the timestamp $[1, 0, 0]$: the timestamp says that the sender had already delivered one message of $p_1$.
4. The message $m_2$ is faster than $m_1$ and reaches process $p_2$ first. The vector of $p_2$ is still $[0, 0, 0]$, and $[1, 0, 0] \le [0, 0, 0]$ is false: $m_2$ waits in $\mathit{pending}$.
5. Eventually $m_1$ reaches $p_2$: $[0, 0, 0] \le [0, 0, 0]$, so $p_2$ delivers $m_1$ and its vector becomes $[1, 0, 0]$.
6. Now the condition holds for $m_2$ too: $p_2$ delivers $m_2$ and increments the component of $p_3$, so its vector becomes $[1, 0, 1]$.

The vectors of this algorithm are similar to the vector clocks of Lecture 4, but they are not updated in the same way: a process increments a component when it **delivers** a message, not when it broadcasts one, and it increments its own component only when it delivers its own message. This is why the separate counter $\mathit{lsn}$ is needed. A process can broadcast two messages one right after the other, before delivering the first one itself: with $\mathit{lsn}$ the first message carries $0$ and the second one carries $1$ in the component of the sender, while a plain copy of $V$ would give the same timestamp to both, and the order between them would be lost.

### What are the trade-offs between No-Waiting and Waiting Causal Broadcast?

| Dimension | No-Waiting Causal Broadcast (full history) | Waiting Causal Broadcast (vector clocks) |
|---|---|---|
| Size of what is attached to a message | Unbounded: $O(\lvert E \rvert)$, the whole causal history | $O(n)$: one vector of $n$ integers |
| Delivery delay | **No waiting** at the receiver: the missing preceding messages arrive inside the message itself | Messages wait in $\mathit{pending}$ until the condition $W' \le V$ becomes true |
| Failure detector | Needs $\mathcal{P}$ for the garbage collection of $\mathit{past}$ | **None**: it works in a purely asynchronous system |
| Network overhead | Heavy use of bandwidth | Minimal |
