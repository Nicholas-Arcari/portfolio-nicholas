## Fault-tolerant mutual exclusion (adapting Lamport's algorithm)

### What is the main limitation of the classical Lamport mutual exclusion algorithm?

The classical Lamport mutual exclusion algorithm assumes a completely crash-free system model ($\Pi = \text{Correct}$). If even a single process $p_i \in \Pi$ crashes during the execution, the algorithm blocks and makes no further progress. To adapt mutual exclusion to a real distributed infrastructure, we must reformulate both the properties of the abstraction and the internal logic of the protocol so that they tolerate crash failures, using a failure detector.

### How do the properties of the mutual exclusion abstraction change when we consider failures?

In a system model with crash-stop failures, the interface of the mutual exclusion abstraction remains the same: request events (`Request`), indication events (`Grant`), and release events (`Release`). The properties, however, must be redefined to take crashes into account:

- **Safety (mutual exclusion under crashes):** at any time $t$, at most one **non-crashed** process is inside the critical section ($\mathrm{CS}$). $$|\{p_i \in \Pi \setminus \text{Crashed}(t) \mid p_i \text{ is in } \mathrm{CS}\}| \le 1$$ Example from the blackboard: consider a process $p_1$ that enters the critical section at 1:00 PM. If $p_1$ crashes at 2:00 PM while inside the critical section, it stops executing and can no longer perform any operation on the critical resource (e.g., writing to a shared disk or sending commands to a physical device). Because $p_1$ is dead, it will never issue a `Release`. To avoid blocking the system forever, the specification allows a surviving process $p_2$ to enter the critical section. At 2:01 PM two processes ($p_1$ and $p_2$) are conceptually inside $\mathrm{CS}$, but since $p_1$ is dead, exactly one **non-crashed** process ($p_2$) is active in $\mathrm{CS}$. If $p_2$ crashes in turn, a process $p_3$ may enter: three processes are then conceptually inside $\mathrm{CS}$, but the invariant of at most one non-crashed process still holds.
- **Liveness (no starvation under crashes):** if a **correct** process $p_i$ requests the access to the critical section, then $p_i$ eventually enters the critical section. The restriction to **correct** processes ($p_i \in \text{Correct}$) is necessary: if a faulty process $p_j$ issues a `Request` and crashes immediately, before its request message leaves its output buffer ($\mathit{OutBuf}_j$), no protocol can make $p_j$ enter $\mathrm{CS}$.
- **Fairness (under crashes):** if the request of a **correct** process $p_i$ causally precedes the request of a process $p_j$ ($\mathit{Request}_i \to \mathit{Request}_j$), then $p_j$ cannot access the critical section before $p_i$.

### What are the dangerous points of the classical Lamport algorithm when processes crash?

Looking at the event handlers of the classical algorithm, a crash is dangerous in two points: a crashed process cannot acknowledge, and a crashed process cannot release.

1. **Blocking while collecting ACKs:** when process $p_i$ wants to enter $\mathrm{CS}$, it sends a request message $\text{REQUEST}(\mathit{ts}_i, i)$ to all processes and must collect an acknowledgment ($\text{ACK}$) from every process $p_j \in \Pi$. If a process $p_k$ crashes, it will never send its $\text{ACK}$: process $p_i$ waits forever for the $\text{ACK}$ of $p_k$, violating liveness.
2. **Permanent blocking by a crashed holder of the CS:** when $p_i$ issues a request, all processes insert $(\mathit{ts}_i, i)$ into their local `requestSet`. Without failures, when $p_i$ leaves $\mathrm{CS}$ it sends a $\text{RELEASE}$, and the receivers remove the request of $p_i$ from their `requestSet`. If $p_i$ crashes inside $\mathrm{CS}$ (or while its request is the smallest one in the sets), it will never send the $\text{RELEASE}$: the request $(\mathit{ts}_i, i)$ remains forever the smallest one in the `requestSet` of every surviving process, blocking all the later requests.

### How can we patch the classical Lamport algorithm using a perfect failure detector ($\mathcal{P}$)?

Using a perfect failure detector ($\mathcal{P}$), which satisfies strong completeness (eventually every crashed process is permanently detected) and strong accuracy (no process is detected before it crashes), we build three patches:

- **Patch 1 (waiting for fewer ACKs):** instead of waiting for the ACKs of all the processes of $\Pi$, a requesting process $p_i$ only waits for the ACKs of the processes that have not been detected as crashed ($\Pi \setminus \mathit{crashes}$).
- **Patch 2 (purging the requests of crashed processes):** upon receiving the indication $\text{Crash}(p_k)$ from $\mathcal{P}$, process $p_i$ adds $p_k$ to its local set `crashes` and removes from its local `requestSet` any request issued by $p_k$.
- **Patch 3 (discarding late requests):** the first two patches are not enough. Because of message delays, a request $\text{REQUEST}(\mathit{ts}_k, k)$ of a crashed process $p_k$ may arrive at $p_i$ **after** $\mathcal{P}$ has already issued $\text{Crash}(p_k)$. If $p_i$ inserted this late request into its `requestSet`, it would stay there forever, because no further $\text{Crash}(p_k)$ event will come to purge it, and it would block the requests of $p_i$ forever. Thus, upon receiving any message $m$ from a source $p_k$, $p_i$ checks whether $p_k \in \mathit{crashes}$: if so, $p_i$ silently discards $m$.

``` Lamport's mutual exclusion with the fault-tolerant patches
Module: FaultTolerantLamportMutex (instance ft_mutex)
Uses: FIFOPerfectPointToPointLinks (instance pl), PerfectFailureDetector (instance p)

Upon event < ft_mutex, Init > do:
    requestSet := ∅;
    ackSet := ∅;
    crashes := ∅;
    scalar_clock := 0;
    my_request := ⊥;

Upon event < ft_mutex, Request > do:
    scalar_clock := scalar_clock + 1;
    my_request := (scalar_clock, self);
    requestSet := requestSet ∪ {my_request};
    ackSet := ∅;
    for all p_j ∈ Π do:
        trigger < pl, Send | p_j, [REQUEST, my_request] >;

Upon event < p, Crash | p_k > do:
    crashes := crashes ∪ {p_k};
    requestSet := { (ts, p_j) ∈ requestSet | p_j ≠ p_k };

Upon event < pl, Deliver | p_k, [REQUEST, (ts_k, p_k)] > do:
    if p_k ∉ crashes then:
        scalar_clock := max(scalar_clock, ts_k) + 1;
        requestSet := requestSet ∪ {(ts_k, p_k)};
        scalar_clock := scalar_clock + 1;
        trigger < pl, Send | p_k, [ACK, scalar_clock] >;

Upon event < pl, Deliver | p_k, [ACK, ts_ack] > do:
    if p_k ∉ crashes then:
        scalar_clock := max(scalar_clock, ts_ack) + 1;
        ackSet := ackSet ∪ {p_k};

Upon event < pl, Deliver | p_k, [RELEASE] > do:
    if p_k ∉ crashes then:
        requestSet := { (ts, p_j) ∈ requestSet | p_j ≠ p_k };

Upon event (my_request ≠ ⊥) ∧ (∀ (ts_r, p_r) ∈ requestSet : my_request ≤ (ts_r, p_r)) ∧ ( (Π \ crashes) ⊆ ackSet ) do:
    my_request := ⊥;
    trigger < ft_mutex, Grant >;

Upon event < ft_mutex, Release > do:
    requestSet := { (ts, p_j) ∈ requestSet | p_j ≠ self };
    scalar_clock := scalar_clock + 1;
    for all p_j ∈ Π do:
        trigger < pl, Send | p_j, [RELEASE] >;
```

**Line-by-line explanation of the pseudocode:**

1. **Init:** initializes the internal data structures: `requestSet` holds the active requests, `ackSet` records the identifiers of the processes from which an ACK has arrived, `crashes` records the processes detected as failed by $\mathcal{P}$, `scalar_clock` is the Lamport logical clock, and `my_request` is the outstanding request of the process.
2. **Request handler:** increments `scalar_clock`, builds the request tuple `(scalar_clock, self)`, stores it locally, empties `ackSet`, and sends `REQUEST` to all processes over the links. As in the classical algorithm, the links must be FIFO and perfect.
3. **Crash handler:** triggered by $\mathcal{P}$ when process $p_k$ crashes. $p_k$ is added to `crashes`, and any pending request $(\mathit{ts}, p_k)$ in `requestSet` is purged (patch 2).
4. **Deliver REQUEST:** checks that the sender $p_k \notin \mathit{crashes}$. If so, it updates the logical clock, stores the request in `requestSet`, increments the clock, and sends an ACK back to $p_k$. Late requests of processes already detected as crashed are ignored (patch 3).
5. **Deliver ACK:** checks that the sender $p_k \notin \mathit{crashes}$, updates the logical clock, and records $p_k$ in `ackSet`.
6. **Deliver RELEASE:** checks that the sender $p_k \notin \mathit{crashes}$ and removes the request of $p_k$ from `requestSet`.
7. **Grant rule (guarded event):** evaluated when `my_request` is not null. The process enters $\mathrm{CS}$ (`Grant`) if and only if two conditions hold: (a) `my_request` is the smallest element of `requestSet` in the lexicographic total order $(\mathit{ts}_i, i) < (\mathit{ts}_j, j) \iff (\mathit{ts}_i < \mathit{ts}_j) \lor (\mathit{ts}_i = \mathit{ts}_j \land i < j)$, and (b) the ACKs of all the processes that are not detected as crashed have been received ($(\Pi \setminus \mathit{crashes}) \subseteq \mathit{ackSet}$, patch 1).
8. **Release handler:** removes its own request from `requestSet`, increments the logical clock, and sends `RELEASE` to all processes.

With the three patches the algorithm is fault tolerant: a correct process that requests the critical section never waits forever for an ACK, and the request of a crashed process is eventually purged from the whole system, so that dead processes cannot influence the others.

## Leader-based fault-tolerant mutual exclusion

### Can we build a simpler fault-tolerant mutual exclusion algorithm using leader election and a failure detector?

Yes. Instead of having all the processes maintain distributed sets of requests and exchange $O(N)$ messages per request, we can use the leader election abstraction ($\mathrm{LE}$) together with a perfect failure detector ($\mathcal{P}$) to centralize the control of the access. In this model, the elected leader acts as the coordinator that serializes the requests.

### How does the leader-based mutual exclusion algorithm operate with and without failures?

The algorithm works as follows in the three main scenarios:

1. **Normal operation (no failures):**
  - All processes use leader election $\mathrm{LE}$, which designates a unique leader $L \in \Pi$.
  - When a process $p_i$ wishes to enter $\mathrm{CS}$, it sends a request message $\text{REQUEST}$ to $L$.
  - The leader $L$ keeps a local FIFO queue of pending requests. If $\mathrm{CS}$ is free, $L$ immediately sends $\text{GRANT}$ to $p_i$. If $\mathrm{CS}$ is occupied, $L$ puts the request of $p_i$ in the queue.
  - Upon leaving $\mathrm{CS}$, $p_i$ sends $\text{RELEASE}$ to $L$. $L$ then grants the access to the next process in its queue.
2. **Scenario 1, a client (non-leader) crashes:** if a client $p_c$ crashes while it holds $\mathrm{CS}$ or while it waits in the queue of $L$, $\mathcal{P}$ triggers $\text{Crash}(p_c)$ at the leader $L$. If $p_c$ was not in $\mathrm{CS}$, $L$ removes its pending request from the queue, if any. If $p_c$ was holding $\mathrm{CS}$, $L$ acts as if $p_c$ had released it, and immediately grants $\mathrm{CS}$ to the next waiting client.
3. **Scenario 2, the leader crashes:** if the leader $L$ crashes, $\mathrm{LE}$ eventually elects a new leader $L_{\mathit{new}}$. The problem is that the old leader was the only one that knew who was in $\mathrm{CS}$: $L_{\mathit{new}}$ cannot immediately grant $\mathrm{CS}$ to new requesters, because a client $p_k$ might have been granted $\mathrm{CS}$ by the old leader $L$ just before $L$ died, and may still be inside $\mathrm{CS}$. To avoid a safety violation (two processes in $\mathrm{CS}$ at the same time), $L_{\mathit{new}}$ runs a state inquiry phase as soon as it is elected:
  - $L_{\mathit{new}}$ sends an inquiry message `INQUIRE_STATE` to all the processes in $\Pi \setminus \mathit{crashes}$, that is, to every process not detected as faulty.
  - $L_{\mathit{new}}$ does not grant $\mathrm{CS}$ until it has received the answers of all the non-crashed processes. A process that was in $\mathrm{CS}$ and crashed is not a problem; one that is alive will answer.
  - If a process $p_k$ answers that it is inside $\mathrm{CS}$, $L_{\mathit{new}}$ records $p_k$ as the current holder of $\mathrm{CS}$ and waits for the `Release` of $p_k$ (or for its crash).
  - When a new leader is elected, the processes send to it again their old requests that have not been satisfied yet. Once the phase is over, $L_{\mathit{new}}$ resumes serving the queued requests as before.

### What is the message complexity of the leader-based algorithm compared to Lamport's?

Without failures, leader-based mutual exclusion needs only $3$ messages per access to the critical section (1 $\text{REQUEST}$ from the client to the leader, 1 $\text{GRANT}$ from the leader to the client, and 1 $\text{RELEASE}$ from the client to the leader), that is, a message complexity of $O(1)$. In contrast, Lamport's algorithm needs $3(N-1)$ messages ($N-1$ requests, $N-1$ ACKs, $N-1$ releases), that is, $O(N)$. With $F$ crashes of the leader, there are at most $F$ new elections, each followed by one state inquiry phase.

## Best-effort broadcast (BEB)

### Why do we need fault-tolerant broadcast abstractions?

So far the focus has been on the interaction between two processes, as in a client-server setting: point-to-point links (`PL.Send`, `PL.Deliver`) only connect pairs of processes. Higher-level algorithms (such as consensus, group membership, and replicated state machines) need primitives to communicate from one process to many. A naive implementation of broadcast as a simple loop over point-to-point links does not behave well when processes crash.

Two conventions hold for all the broadcast abstractions: a broadcast message is implicitly addressed to all processes, and messages are unique, that is, no process ever broadcasts the same message twice and no two processes ever broadcast the same message.

### What is the problem with a naive loop when the sender crashes?

Consider a process $p_1$ that broadcasts to the processes $\{p_1, p_2, p_3, p_4, p_5, p_6\}$ with a loop:

``` A naive broadcast
for all p_j in Π do:
    PL.Send(p_j, message);
```

If $p_1$ crashes after sending the message to $p_2$ and $p_3$, but before sending it to $p_4, p_5, p_6$, then $p_2$ and $p_3$ receive and deliver the message, whereas $p_4$, $p_5$, and $p_6$ never receive it. The correct processes are left in an inconsistent state: part of the system sees the broadcast, and part does not.

### What is the specification of best-effort broadcast (BEB)?

Best-effort broadcast is the basic one-to-many communication primitive: its delivery guarantee holds only if the sender remains correct.

- **Events:**
  - Request: `< beb, Broadcast | m >` - broadcasts a message $m$ to all processes.
  - Indication: `< beb, Deliver | p, m >` - delivers a message $m$ broadcast by process $p$.
- **Properties:**
  - **BEB1 (validity):** if a **correct** process $p$ broadcasts a message $m$, then every **correct** process $q$ eventually delivers $m$.
  - **BEB2 (no duplication):** no message is delivered more than once.
  - **BEB3 (no creation):** if a process delivers a message $m$ with sender $p$, then $m$ was previously broadcast by $p$.

### How is best-effort broadcast implemented using perfect point-to-point links?

The algorithm, called Basic Broadcast, works in an asynchronous system with perfect links and crash failures (the fail-silent model):

``` Basic Broadcast: best-effort broadcast over perfect links
Module: BasicBroadcast (instance beb)
Uses: PerfectPointToPointLinks (instance pl)

Upon event < beb, Broadcast | m > do:
    for all p_j ∈ Π do:
        trigger < pl, Send | p_j, [DATA, self, m] >;

Upon event < pl, Deliver | p_j, [DATA, s, m] > do:
    trigger < beb, Deliver | s, m >;
```

**Line-by-line explanation of the pseudocode:**

1. **Module and Uses:** define the `BasicBroadcast` module (instance `beb`), which uses the underlying `PerfectPointToPointLinks` (`pl`).
2. **Broadcast handler:** triggered when the upper layer asks to broadcast $m$. The process goes through all $p_j \in \Pi$ and sends the tuple `[DATA, self, m]` with `PL.Send`. Note that a process also sends the message to itself (`self`), so that all processes behave in the same way.
3. **Deliver handler:** triggered when `pl` delivers `[DATA, s, m]` from $p_j$. The module extracts the original sender $s$ and the message $m$, and triggers `< beb, Deliver | s, m >` to the upper layer.

**Proof of correctness of Basic Broadcast:**

- **Validity:** if the sender $p$ is correct, it completes the loop over all $p_j \in \Pi$. By the reliable delivery property of `pl`, every correct process $q$ eventually receives `[DATA, p, m]` and triggers `BEB.Deliver`.
- **No duplication:** follows directly from the no duplication property of `pl`.
- **No creation:** follows directly from the no creation property of `pl`.
- **Limit under failures:** BEB ensures the delivery of a message only as long as the sender does not fail. If the sender $p$ crashes in the middle of the loop, the processes may disagree on whether or not to deliver the message.

This is bad because processes do not have a common view of the messages sent by faulty processes. In a distributed chat, for instance, a message of a client that crashes could reach only a subset of the processes. We would like an agreement on the set of delivered messages, at least among the correct processes: all correct processes or none.

## Regular reliable broadcast (RB)

### How do we obtain all-or-nothing delivery among correct processes?

Best-effort broadcast allows an execution in which some correct processes deliver a message while other correct processes do not (when the sender crashes in the middle of the broadcast). To eliminate this inconsistency we define **reliable broadcast (RB)**, which guarantees an "all-or-nothing" delivery: either **all** correct processes deliver the message, or **no** correct process delivers it.

### What is the specification of regular reliable broadcast (RB)?

Reliable broadcast has the same events as BEB (`< rb, Broadcast | m >` and `< rb, Deliver | p, m >`) and four properties:

- **RB1 (validity):** if a **correct** process $p$ broadcasts a message $m$, then $p$ eventually delivers $m$.
- **RB2 (no duplication):** no message is delivered more than once.
- **RB3 (no creation):** if a process delivers a message $m$ with sender $p$, then $m$ was previously broadcast by $p$.
- **RB4 (agreement, non-uniform):** if a message $m$ is delivered by **some correct** process $p$, then $m$ is eventually delivered by **every correct** process $q$.

RB2 and RB3 are the same as in BEB. RB1 only speaks of the sender, but together with RB4 it gives back the validity of BEB: if a correct process broadcasts $m$, it delivers $m$, and then every correct process delivers $m$. Agreement is the new property, and it is a liveness property.

### How is Lazy Reliable Broadcast implemented in a fail-stop system (with $\mathcal{P}$)?

The **Lazy Reliable Broadcast** algorithm works in the fail-stop model, using best-effort broadcast (`beb`) and a perfect failure detector (`p`). It is called "lazy" because it retransmits only when necessary: a process relays a message only if it detects that the original sender has crashed.

``` Lazy Reliable Broadcast (fail-stop)
Module: LazyReliableBroadcast (instance rb)
Uses: BestEffortBroadcast (instance beb), PerfectFailureDetector (instance p)

Upon event < rb, Init > do:
    correct := Π;
    from[s] := ∅ for all s ∈ Π;

Upon event < rb, Broadcast | m > do:
    trigger < beb, Broadcast | [DATA, self, m] >;

Upon event < beb, Deliver | p_j, [DATA, s, m] > do:
    if m ∉ from[s] then:
        from[s] := from[s] ∪ {m};
        trigger < rb, Deliver | s, m >;
        if s ∉ correct then:
            trigger < beb, Broadcast | [DATA, s, m] >;

Upon event < p, Crash | p_k > do:
    correct := correct \ {p_k};
    for all m ∈ from[p_k] do:
        trigger < beb, Broadcast | [DATA, p_k, m] >;
```

**Line-by-line explanation of the pseudocode:**

1. **Init:** sets `correct` to all the processes $\Pi$, and initializes the array `from[s]`, which records the messages delivered with original sender $s$.
2. **Broadcast handler:** wraps the message $m$ with its origin $s = \mathit{self}$ and triggers `BEB.Broadcast`.
3. **BEB deliver handler:** when `beb` delivers `[DATA, s, m]` from the relayer $p_j$, it checks whether $m \in \mathit{from}[s]$. If $m$ is new, it adds $m$ to $\mathit{from}[s]$, triggers `< rb, Deliver | s, m >`, and checks whether the origin $s \notin \mathit{correct}$. If $s$ has already been detected as crashed, the receiving process acts as a relay and broadcasts `[DATA, s, m]` again with `beb`.
4. **Crash handler:** when $\mathcal{P}$ signals $\text{Crash}(p_k)$, $p_k$ is removed from `correct`. For every message $m$ already delivered from $p_k$ ($m \in \mathit{from}[p_k]$), the process relays it with `BEB.Broadcast`, to make sure that all the other processes receive $m$.

**Correctness of Lazy Reliable Broadcast:**

- **Validity and no creation** are ensured by the properties of BEB; **no duplication** by the test on `from[s]` in the deliver handler.
- **Agreement (by contradiction):** suppose a correct process $p$ delivers $m$ with origin $s$, while another correct process $q$ never delivers $m$.
  - Case 1, $s$ does not crash: $s$ is correct. By the validity of BEB, the initial broadcast of $s$ reaches the correct process $q$, so $q$ delivers $m$, a contradiction.
  - Case 2, $s$ crashes and $p$ detects the crash before delivering $m$: when $p$ delivers $m$, $s \notin \mathit{correct}$, so $p$ relays $m$ in its deliver handler. Since $p$ is correct, by the validity of BEB the relayed message reaches $q$, which delivers $m$, a contradiction.
  - Case 3, $s$ crashes and $p$ detects the crash after delivering $m$: by strong completeness, $\mathcal{P}$ eventually signals $\text{Crash}(s)$ at $p$. At that moment $m \in \mathit{from}[s]$, so the crash handler of $p$ relays $m$ with `BEB.Broadcast`. By the validity of BEB the relayed message reaches $q$, which delivers $m$, a contradiction. Thus, agreement holds.

**What reliable broadcast guarantees and what it does not.** Let $\mathit{DELMSG}(p)$ be the set of messages delivered by $p$. With reliable broadcast, any two correct processes $p$ and $p'$ have $\mathit{DELMSG}(p) = \mathit{DELMSG}(p')$. There is no relationship, instead, between the sets of two faulty processes, nor between the set of a correct process and that of a faulty one. And there is no guarantee on the order in which messages are delivered.

**Complexity of Lazy Reliable Broadcast.** Time is measured in message delays (communication steps): we pretend that every message takes one time unit to be delivered. This assumption is used only to evaluate performance, never for correctness.

- **Message complexity:**
  - **Best case (no crashes):** $O(N)$ messages. The origin $s$ performs 1 BEB ($N$ point-to-point messages), and no relay takes place.
  - **Worst case (the origin crashes):** $O(N^2)$ messages. The origin $s$ crashes: up to $N-1$ correct processes detect the crash and each of them relays with a BEB ($N \times N = N^2$ messages).
- **Latency (message delays):**
  - **Best case:** 1 message delay.
  - **Worst case:** $O(N)$ message delays. It happens with a chain of crashes: $s = p_1$ sends $m$ only to $p_2$ and crashes; $p_2$ delivers $m$, sends $m$ only to $p_3$ and crashes; $p_3$ delivers $m$, sends $m$ only to $p_4$ and crashes, and so on, creating a chain of $N-1$ hops.

### How is Eager Reliable Broadcast implemented in a fail-silent system (without $\mathcal{P}$)?

In an asynchronous system without a failure detector, crashes cannot be detected, so relays cannot be triggered lazily. Instead, we use **Eager Reliable Broadcast**, in which every process unconditionally relays a message the very first time it delivers it.

``` Eager Reliable Broadcast (fail-silent)
Module: EagerReliableBroadcast (instance erb)
Uses: BestEffortBroadcast (instance beb)

Upon event < erb, Init > do:
    delivered := ∅;

Upon event < erb, Broadcast | m > do:
    trigger < beb, Broadcast | [DATA, self, m] >;

Upon event < beb, Deliver | p_j, [DATA, s, m] > do:
    if m ∉ delivered then:
        delivered := delivered ∪ {m};
        trigger < erb, Deliver | s, m >;
        trigger < beb, Broadcast | [DATA, s, m] >;
```

**Line-by-line explanation of the pseudocode:**

1. **Init:** initializes the set `delivered`.
2. **Broadcast handler:** triggers `BEB.Broadcast` for `[DATA, self, m]`.
3. **BEB deliver handler:** upon receiving `[DATA, s, m]`, if $m \notin \mathit{delivered}$, it adds $m$ to `delivered`, delivers $m$ to the upper layer, and **immediately** triggers the `BEB.Broadcast` of `[DATA, s, m]`.

**Trade-off:** Eager Reliable Broadcast works in a purely asynchronous, fail-silent system, without needing $\mathcal{P}$. However, its message complexity is **always** $O(N^2)$, even in executions without failures, because all $N$ processes relay every message they receive. The latency is the same as in the lazy algorithm: 1 message delay in the best case, $O(N)$ with a chain of failures.

## Uniform reliable broadcast (URB)

### What happens if a faulty process delivers a message before crashing?

With non-uniform agreement (RB4), a **faulty** process $p_f$ may deliver a message $m$ (e.g., a state update or a bank transaction) and perform an irreversible action with an effect on the outside world before crashing. If no **correct** process ever delivers $m$, the state of the system is permanently inconsistent with the action performed by $p_f$.

### What is the specification of uniform reliable broadcast (URB)?

Uniform reliable broadcast replaces non-uniform agreement with **uniform agreement**:

- **URB1 (validity):** same as RB1.
- **URB2 (no duplication):** same as RB2.
- **URB3 (no creation):** same as RB3.
- **URB4 (uniform agreement):** if a message $m$ is delivered by **some** process $p$ (whether correct or faulty), then $m$ is eventually delivered by **every correct** process $q$.

In other words, the set of messages delivered by a correct process is a superset of the set delivered by a faulty one.

**On the word "uniform":** in distributed systems, adding the prefix "uniform" to a property extends its requirement to **all** processes (including the faulty ones, which crash later), preventing a process from taking an action that is not shared by the others just before it fails.

## Exercises and advanced problems

### Why is taking the average of the clocks of the neighbors a flawed way of synchronizing clocks?

**Problem statement:** you have to review a clock synchronization algorithm for arbitrary graphs, in which each node $p_i$ asks the software clocks of all its neighbors $\text{Nbr}(i)$, computes their arithmetic mean $C_{\text{avg}} = \frac{1}{|\text{Nbr}(i)|} \sum_{j \in \text{Nbr}(i)} C_j$, and sets its local clock $C_i := C_{\text{avg}}$.

**The flaw:** this algorithm violates the mandatory **monotonicity** property ($t_1 < t_2 \implies C(t_1) < C(t_2)$): a clock can always jump into the future, never into the past. Suppose the local clock of process $p_1$ is at 1:00 PM ($C_1 = 13{:}00$), and its five neighbors have clocks that are behind, at 10:00 AM ($C_j = 10{:}00$). The computed average is: $$C_{\text{avg}} = \frac{10 + 10 + 10 + 10 + 10}{5} = 10{:}00 \text{ AM}$$ Setting $C_1 := 10{:}00 \text{ AM}$ makes the local clock of $p_1$ jump backward in time by 3 hours. In the same way, a node whose clock is at 3 and whose neighbors are at 2, 2, 1 and 3 would be moved from 3 back to 2. Moving the local time backward breaks the ordering of messages, creates duplicate timestamps, and invalidates security tokens. The correct way of bringing a fast clock back is the one seen in Lecture 3: slow it down, hiding some ticks until real time catches up, and never set it to an earlier value.

### How can we implement vector clocks when the size of the system and the process identifiers are unknown at the beginning?

**Problem statement:** standard vector clocks need a fixed array of size $N$, indexed by the process identifiers $1 \dots N$. If $N$ and the identifiers of the other processes are unknown at startup (identifiers are unique), how can vector clocks be represented and updated?

**Solution:** replace the fixed-size array with a dynamic **map (dictionary)** ($\text{VC}: \text{ProcessID} \to \mathbb{N}$).

- **Initialization:** each process starts with an empty map $\text{VC} = \emptyset$. A missing entry $\text{VC}[p_k]$ implicitly has the value $0$: not knowing that a process exists is the same as having seen none of its events.
- **Local event:** increment the own entry: $\text{VC}[\text{self}] := \text{VC}[\text{self}] + 1$.
- **Sending a message:** attach the local map $\text{VC}$ to the outgoing message.
- **Receiving a message:** upon receiving the map $\text{VC}_m$ from a sender $p_j$:
  - For every key $p_k \in \text{Keys}(\text{VC}_m)$: $$\text{VC}[p_k] := \max(\text{VC}[p_k], \text{VC}_m[p_k])$$ In particular, an entry for a process that was unknown so far is simply copied.
  - Increment the own entry: $\text{VC}[\text{self}] := \text{VC}[\text{self}] + 1$.

**Comparing two maps:** two maps $\text{VC}_A$ and $\text{VC}_B$ are compared on all the keys in $\text{Keys}(\text{VC}_A) \cup \text{Keys}(\text{VC}_B)$, treating missing keys as $0$. If there exist $k_1, k_2$ such that $\text{VC}_A[k_1] > \text{VC}_B[k_1]$ and $\text{VC}_A[k_2] < \text{VC}_B[k_2]$, the events are concurrent. The peculiarity of two concurrent events is that the incomparable component may be one that exists in one map and is missing in the other.

### Does incrementing the vector clock after sending a message preserve causality?

**Problem statement:** in standard vector clocks, a process increments its own component **before** timestamping and sending a message. What happens if a process timestamps the message with its **current** vector clock, sends the message, and increments its own component only **after** sending? The receive rule is unchanged.

**Analysis given in class:** the case one may fear is that of two processes that send their first message concurrently. With the new rule both messages carry the same vector, $[0, 0, 0, 0]$, whereas with the standard rule they would carry two different, incomparable vectors. This is not a problem: two equal vectors are not ordered either, so the two events are still seen as concurrent. In general, the only effect of the new rule is that the sequence of vector clocks sent by a process is the original one with its own component decreased by one, and every process applies the same shift: the modification does not break the mechanism.

**A caveat:** with this rule the timestamp of a send event does not count the event itself, so the other processes learn about a send only from the next message of the same sender. The characterization $V(e) < V(f) \iff e \to f$ is therefore the one of the standard algorithm, and it does not hold literally for the modified one: the first send of $p_1$ is stamped $[0, 0, 0, 0]$, which is smaller than the timestamp $[0, 1, 0, 0]$ of the second send of a process $p_2$ that has never heard from $p_1$, although the two events are concurrent.

### Can a failure detector be built over a channel that loses at most $K$ messages?

**Problem statement:** suppose a point-to-point channel is synchronous (delay bounded by $\Delta$) but lossy, with the guarantee that it loses at most $K$ messages: if $K+1$ messages are sent, at least one arrives. Can a perfect failure detector ($\mathcal{P}$) be built? And if the number of lost messages is unbounded?

**Analysis:**

1. **Bounded loss ($\le K$ messages): yes.** To make sure that a heartbeat arrives within a bounded time, a process sends $K+1$ copies of each ping. Since at most $K$ of them can be lost, at least one copy arrives. If sending one message takes a time $\epsilon$, the copy that arrives is received within $\Delta + (K+1)\epsilon$: this is still a known bound, so it is enough to choose the timeout of the failure detector accordingly. With such a timeout no process is detected by mistake (strong accuracy), and real crashes are detected (strong completeness).
2. **Unbounded loss: no.** If the channel can lose an arbitrary, unbounded number of messages, every retransmission costs a time $\epsilon$ and may be lost again: whatever the timeout, the channel can lose enough messages to exceed it. The delay of a successful delivery becomes unbounded, the link is in fact asynchronous, and in an asynchronous system a perfect failure detector cannot be built.

### Can we implement a FIFO link with "immediate delivery", without a pending set?

**Problem statement:** an algorithm has the immediate delivery property if every message delivered by the lower layer is immediately delivered to the upper layer. The FIFO link seen so far does not have it: the receiver stores out-of-order messages in the set `pending`, where a message may wait for an unpredictable amount of time, until all the messages with smaller sequence numbers arrive. Can we design, on top of a perfect link, a FIFO link with immediate delivery?

**Solution and trade-off: yes**, by piggybacking the **full history**. The key observation is that when the sender sends the third message it knows the first two, because it is their source.

1. **Sender:** process $p_i$ keeps a log `history` of all the messages sent so far. When it sends a new message $m$, $p_i$ appends $m$ to `history` and sends the entire sequence `history` on the link.
2. **Receiver:** upon receiving a sequence $S = \langle m_1, m_2, \dots, m_k \rangle$, the receiver goes through $S$ in order, immediately delivers every message $m_j \in S$ that it has not delivered yet, and updates its local set of delivered messages.
3. **Trade-off:** no message ever waits at the receiver (immediate delivery). The price is a severe overhead in **bandwidth and memory**, since the size of what is sent grows without bound over time (each transmission carries all the messages sent so far).
