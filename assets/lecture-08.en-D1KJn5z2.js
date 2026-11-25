const e=`## Uniform reliable broadcast (URB) abstraction

### What is the fundamental difference between regular agreement and uniform agreement in broadcast primitives?

The distinction between regular reliable broadcast (RB) and uniform reliable broadcast (URB) lies entirely in the scope of their agreement properties:

- **Regular agreement:** guarantees that if a **correct** process delivers a message $m$, then every **correct** process eventually delivers $m$. It places no restriction at all on what faulty processes do before they crash. Consequently, a faulty process $p_f$ may deliver a message $m$ and crash immediately after, while no correct process ever delivers $m$.
- **Uniform agreement:** guarantees that if **any** process $p$ (whether correct or faulty) delivers a message $m$, then every **correct** process eventually delivers $m$. This prevents faulty processes from acting on a state that the surviving correct processes never observe.

### Why is uniform agreement essential in real applications such as replicated state machines?

Consider a scenario from the blackboard in which a client updates a set of replicas of a distributed database. If the broadcast primitive only provides regular agreement, a message $m$ of the client (e.g., a financial transaction or a write on the database) might be delivered by a replica $p_1$ that crashes right after. If no correct replica ever delivers $m$, $p_1$ has executed a state transition that the rest of the system knows nothing about. If $p_1$ communicated this state to an external actor before crashing, the system is in an inconsistent state from which it cannot recover. Uniform reliable broadcast prevents this failure mode: before any process (even one about to crash) delivers $m$, the system must make sure that all correct processes will deliver $m$.

### What set relationship holds between the messages delivered by faulty and by correct processes in uniform reliable broadcast?

Uniform agreement directly implies that the set of messages delivered by any faulty process $p_f$ (denoted $M_{p_f}$) is a subset of the set of messages delivered by any correct process $p_c$ (denoted $M_{p_c}$): $$M_{p_f} \\subseteq M_{p_c}$$ In contrast, with regular reliable broadcast $M_{p_f}$ and $M_{p_c}$ can be incomparable: $M_{p_f}$ can contain messages that are completely absent from $M_{p_c}$.

### What are the properties that specify the uniform reliable broadcast (URB) abstraction?

The uniform reliable broadcast abstraction has two events, the request \`urbBroadcast(m)\` and the indication \`urbDeliver(src, m)\`, and four properties:

- **URB1 (validity):** if a correct process $p$ broadcasts a message $m$, then $p$ eventually delivers $m$.
- **URB2 (no duplication):** no message $m$ is delivered more than once by any process.
- **URB3 (no creation):** if a process delivers a message $m$ with sender $s$, then $m$ was previously broadcast by process $s$.
- **URB4 (uniform agreement):** if a message $m$ is delivered by **any** process $p$ (correct or faulty), then $m$ is eventually delivered by every correct process.

### How can executions be classified into best-effort broadcast (BEB), regular reliable broadcast (RB), and uniform reliable broadcast (URB)?

Consider a system of three processes $\\Pi = \\{p_1, p_2, p_3\\}$ in which $p_1$ is faulty (it crashes) and $p_2, p_3$ are correct:

- **Execution 1:** $p_1$ delivers the messages $\\{m_{\\text{orange}}, m_{\\text{blue}}, m_{\\text{purple}}\\}$ and crashes. The correct processes $p_2$ and $p_3$ both deliver $\\{m_{\\text{orange}}, m_{\\text{blue}}, m_{\\text{purple}}\\}$.
  - **Classification: uniform reliable broadcast (URB).** Here $M_{p_1} \\subseteq M_{p_2} = M_{p_3}$. Since the set of messages delivered by the faulty process is a subset of those delivered by the correct processes, uniform agreement holds.
- **Execution 2:** $p_1$ (faulty) delivers $\\{m_{\\text{purple}}, m_{\\text{orange}}, m_{\\text{blue}}, m_{\\text{yellow}}\\}$ and crashes. The correct process $p_2$ delivers $\\{m_{\\text{purple}}, m_{\\text{orange}}, m_{\\text{blue}}\\}$. The correct process $p_3$ delivers $\\{m_{\\text{purple}}, m_{\\text{blue}}, m_{\\text{orange}}, m_{\\text{yellow}}\\}$.
  - **Classification: best-effort broadcast (BEB) only**, and only if $m_{\\text{yellow}}$ was broadcast by the faulty process $p_1$. The execution violates regular agreement, because the correct process $p_3$ delivers $m_{\\text{yellow}}$ but the correct process $p_2$ never delivers it. If $m_{\\text{yellow}}$ had been broadcast by a correct process, even the validity of BEB would be violated, and the execution would not be correct for any of the three abstractions.
- **Execution 3:** $p_1$ (faulty) delivers $\\{m_{\\text{purple}}, m_{\\text{orange}}, m_{\\text{blue}}\\}$ and crashes. The correct process $p_2$ delivers $\\{m_{\\text{purple}}, m_{\\text{yellow}}, m_{\\text{orange}}, m_{\\text{blue}}\\}$. The correct process $p_3$ delivers $\\{m_{\\text{purple}}, m_{\\text{blue}}, m_{\\text{orange}}, m_{\\text{yellow}}\\}$.
  - **Classification: uniform reliable broadcast (URB).** The faulty process $p_1$ delivered a subset of the messages delivered by the correct processes ($M_{p_1} \\subseteq M_{p_2}$ and $M_{p_1} \\subseteq M_{p_3}$), and both correct processes delivered exactly the same set of messages $\\{m_{\\text{purple}}, m_{\\text{orange}}, m_{\\text{blue}}, m_{\\text{yellow}}\\}$.
- **Execution 4:** $p_1$ (faulty) delivers $\\{m_{\\text{orange}}, m_{\\text{blue}}, m_{\\text{purple}}, m_{\\text{yellow}}\\}$ and crashes. The correct processes $p_2$ and $p_3$ both deliver $\\{m_{\\text{purple}}, m_{\\text{orange}}, m_{\\text{blue}}\\}$.
  - **Classification: regular reliable broadcast (RB), but not URB**, and only if $m_{\\text{yellow}}$ was broadcast by the faulty process $p_1$. The two correct processes deliver the same set, so regular agreement holds, but the faulty process delivered a message that no correct process delivers, so uniform agreement is violated. Again, if $m_{\\text{yellow}}$ had been broadcast by a correct process, validity would be violated.

## All-Ack uniform reliable broadcast (fail-stop model, with a perfect failure detector)

### Why can a process not deliver a message as soon as it receives it in uniform reliable broadcast?

In best-effort broadcast or in regular reliable broadcast, a process can deliver a message $m$ to the application as soon as it receives it from the network. In uniform reliable broadcast this is not allowed. If a process $p$ delivers $m$ immediately and crashes a moment later, $p$ has delivered $m$ while no other process may have received it: this directly violates uniform agreement. Therefore, URB separates the moment in which a message is received and relayed from the moment in which it is delivered to the application. A process must keep $m$ in a set \`pending\` and wait until it has the confirmations (acknowledgments) proving that all the correct processes have also received and relayed $m$.

### How is the All-Ack uniform reliable broadcast algorithm structured in the fail-stop model?

The All-Ack URB algorithm works in the fail-stop model, using a best-effort broadcast module (\`beb\`) and a perfect failure detector (\`P\`). It maintains four local variables:

1. \`delivered\`: the set of messages already delivered to the upper layer.
2. \`pending\`: the set of pairs $(s, m)$ of the messages received or broadcast that are waiting for enough acknowledgments to be delivered safely.
3. \`correct\`: the set of processes not detected as crashed, initialized to $\\Pi$.
4. \`ack\`: an array that associates each message $m$ with the set of the identifiers of the processes that have acknowledged (relayed) $m$.

\`\`\` All-Ack Uniform Reliable Broadcast (fail-stop)
Module: AllAckURB (All-Ack Uniform Reliable Broadcast)
Uses:
  BestEffortBroadcast (beb)
  PerfectFailureDetector (P)

upon event < urb, Init > do
  delivered := ∅
  pending := ∅
  correct := Π
  forall m do
    ack[m] := ∅

upon event < urb, Broadcast | m > do
  pending := pending ∪ {(self, m)}
  trigger < beb, Broadcast | [DATA, self, m] >

upon event < beb, Deliver | p, [DATA, s, m] > do
  ack[m] := ack[m] ∪ {p}
  if (s, m) ∉ pending then
    pending := pending ∪ {(s, m)}
    trigger < beb, Broadcast | [DATA, s, m] >

upon event < P, Crash | p > do
  correct := correct \\ {p}

upon event exists (s, m) ∈ pending do
  if correct ⊆ ack[m] and m ∉ delivered then
    delivered := delivered ∪ {m}
    trigger < urb, Deliver | s, m >
\`\`\`

**Line-by-line explanation of the algorithm:**

- \`upon event < urb, Init > do\`: initializes the state. \`delivered\` and \`pending\` are empty. \`correct\` is initialized to the whole set of processes $\\Pi$. For every possible message $m$, its set of acknowledgments \`ack[m]\` is initialized to $\\emptyset$.
- \`upon event < urb, Broadcast | m > do\`: triggered when the upper layer asks to broadcast the message $m$. The pair \`(self, m)\` is added to \`pending\`, and a best-effort broadcast of \`[DATA, self, m]\` is triggered.
- \`upon event < beb, Deliver | p, [DATA, s, m] > do\`: triggered when best-effort broadcast delivers a message sent by process $p$ with original source $s$ and payload $m$.
  - \`ack[m] := ack[m] ∪ {p}\`: adds process $p$ to \`ack[m]\`. In this protocol, relaying a message works as an implicit acknowledgment (ACK) that process $p$ has seen $m$.
  - \`if (s, m) ∉ pending then\`: checks whether this is the first time the process sees the message $m$.
  - \`pending := pending ∪ {(s, m)}\`: adds the pair \`(s, m)\` to \`pending\`.
  - \`trigger < beb, Broadcast | [DATA, s, m] >\`: relays the message to all processes with a best-effort broadcast. Relaying ensures that even if the original sender $s$ has crashed, all the surviving processes receive $m$.
- \`upon event < P, Crash | p > do\`: triggered by the perfect failure detector $\\mathcal{P}$ when process $p$ crashes.
  - \`correct := correct \\ {p}\`: removes the crashed process $p$ from \`correct\`. This prevents the delivery condition from waiting forever for the ACK of a dead process.
- \`upon event exists (s, m) ∈ pending do\`: a guard evaluated continuously on all the messages in \`pending\`.
  - \`if correct ⊆ ack[m] and m ∉ delivered then\`: checks that all the processes not detected as crashed (\`correct\`) have acknowledged $m$ (\`correct ⊆ ack[m]\`), and that $m$ has not been delivered yet.
  - \`delivered := delivered ∪ {m}\`: marks $m$ as delivered.
  - \`trigger < urb, Deliver | s, m >\`: delivers $m$, with original source $s$, to the upper layer.

### How is the correctness of the All-Ack URB algorithm proved?

- **Validity (URB1):** if a correct process $p$ broadcasts $m$, it triggers \`< beb, Broadcast | [DATA, p, m] >\`. By the validity of BEB, all correct processes deliver the BEB message, add $p$ to \`ack[m]\`, and trigger their own BEB relay of $m$. By the validity of BEB, $p$ receives the relays of all correct processes. By the strong completeness of $\\mathcal{P}$, $p$ eventually detects all the crashed processes, so it does not wait forever for the ACK of a crashed process. Thus, \`correct ⊆ ack[m]\` eventually holds at $p$, and $p$ delivers $m$. The same argument shows, more generally, that a correct process that sees a message eventually delivers it.
- **No duplication (URB2):** a message $m$ is delivered only if $m \\notin \\mathit{delivered}$. Upon delivery, $m$ is immediately added to \`delivered\`, preventing any second execution of \`urbDeliver\`.
- **No creation (URB3):** a message $m$ is placed in \`pending\` and delivered only if it was received via \`bebDeliver\` as \`[DATA, s, m]\`. By the no creation property of BEB, $m$ must have been broadcast by $s$.
- **Uniform agreement (URB4):** by contradiction. Suppose a process $p$ (correct or faulty) delivers $m$, but a correct process $p_c$ never delivers $m$. Since $p$ delivers $m$, the guard \`correct ⊆ ack[m]\` was true at process $p$ at the moment of the delivery. Since $p_c$ is a correct process, $p_c \\in \\mathit{correct}$ at all times (by strong accuracy, a perfect failure detector never detects a correct process). Therefore, $p_c \\in \\mathit{ack}[m]$ at process $p$. This implies that $p_c$ previously executed \`< beb, Broadcast | [DATA, s, m] >\`, that is, $p_c$ has seen $m$. But a correct process that sees a message eventually delivers it, as shown for validity: $p_c$ delivers $m$, contradicting the assumption.

### What is the complexity of the All-Ack URB algorithm in messages and in delays?

- **Message complexity:**
  - **Best case (no crashes):** $O(n^2)$ messages. The sender broadcasts $m$ ($n$ messages), and each receiving process relays $m$ ($n \\cdot n = n^2$ messages).
  - **Worst case (crashes occur):** $O(n^2)$ messages.
- **Time (delay) complexity:**
  - **Best case (no crashes):** $2$ message delays. One delay for the initial BEB broadcast from the sender to all processes, and one for all processes to relay $m$ back to everyone.
  - **Worst case (a chain of crashes):** $O(n)$ message delays. It is the chain of $n-1$ crashes in which each process receives $m$, relays $m$ to a single successor, and crashes before completing the broadcast.

## Majority-Ack uniform reliable broadcast (fail-silent model, with $f < n/2$)

### How can uniform reliable broadcast be achieved in an asynchronous system without a failure detector?

In an asynchronous, fail-silent model a perfect failure detector $\\mathcal{P}$ cannot be built. If the All-Ack algorithm were executed without $\\mathcal{P}$, after a single crash \`correct\` would remain equal to $\\Pi$: the surviving processes would wait forever for the ACK of the dead process, \`correct ⊆ ack[m]\` would never become true, and validity would be violated. To overcome this without a failure detector, we work under two assumptions:

1. **Asynchronous, fail-silent model:** communication delays are unbounded, and crashes cannot be detected.
2. **A majority of correct processes ($f < n/2$):** the number $f$ of processes that crash is strictly less than half of the size $n$ of the system: $$f < \\frac{n}{2}$$ This is a reasonable assumption: it is a rare event to have more than half of the system crashing.

### What is a quorum, and what is the quorum intersection property?

A **quorum** $Q$ in a system of $n$ processes is any subset of processes that contains a strict majority: $$|Q| \\ge \\left\\lfloor \\frac{n}{2} \\right\\rfloor + 1$$

- **Quorum intersection property:** any two quorums $Q_1, Q_2 \\subseteq \\Pi$ intersect in at least one process: $$Q_1 \\cap Q_2 \\neq \\emptyset$$
- **Proof:** let $n$ be the total number of processes. Each quorum contains at least $\\lfloor n/2 \\rfloor + 1$ processes. The sum of the sizes of two quorums is $|Q_1| + |Q_2| \\ge 2(\\lfloor n/2 \\rfloor + 1) > n$. If the two quorums did not intersect, they would contain more than $n$ distinct processes: by the pigeonhole principle, $Q_1$ and $Q_2$ must share at least one process.
- **Consequence for fault tolerance:** under the assumption $f < n/2$, the set of correct processes of any execution is itself a quorum $Q_{\\text{correct}}$. Therefore, any quorum $Q_{\\text{ack}}$ of acknowledgments gathered by a process intersects $Q_{\\text{correct}}$ in at least one process $p_{\\text{intersect}} \\in Q_{\\text{ack}} \\cap Q_{\\text{correct}}$. This guarantees that any majority of ACKs contains at least one correct process, even though nobody knows which processes are correct.

The two ideas of the algorithm follow. First: if I know that one correct process has seen a message, I can deliver it safely. Second: if a quorum of processes has seen a message, at least one of them is correct, so the message is safe to deliver.

### How is the Majority-Ack URB algorithm implemented?

\`\`\` Majority-Ack Uniform Reliable Broadcast (fail-silent, f < n/2)
Module: MajorityAckURB (Majority-Ack Uniform Reliable Broadcast)
Uses:
  BestEffortBroadcast (beb)

upon event < urb, Init > do
  delivered := ∅
  pending := ∅
  forall m do
    ack[m] := ∅

upon event < urb, Broadcast | m > do
  pending := pending ∪ {(self, m)}
  trigger < beb, Broadcast | [DATA, self, m] >

upon event < beb, Deliver | p, [DATA, s, m] > do
  ack[m] := ack[m] ∪ {p}
  if (s, m) ∉ pending then
    pending := pending ∪ {(s, m)}
    trigger < beb, Broadcast | [DATA, s, m] >

upon event exists (s, m) ∈ pending do
  if |ack[m]| > n / 2 and m ∉ delivered then
    delivered := delivered ∪ {m}
    trigger < urb, Deliver | s, m >
\`\`\`

**Line-by-line explanation of the algorithm:**

- \`upon event < urb, Init > do\`: initializes the state. \`delivered\` and \`pending\` are set to $\\emptyset$. \`ack[m]\` is initialized to $\\emptyset$ for all $m$. Note that there is no variable \`correct\` and no failure detector module: apart from this and from the delivery condition, the algorithm is the same as All-Ack.
- \`upon event < urb, Broadcast | m > do\`: adds \`(self, m)\` to \`pending\` and broadcasts \`[DATA, self, m]\` with best-effort broadcast.
- \`upon event < beb, Deliver | p, [DATA, s, m] > do\`: adds the sender $p$ to \`ack[m]\`. If \`(s, m)\` is not in \`pending\`, it stores \`(s, m)\` in \`pending\` and relays \`[DATA, s, m]\` to all processes with BEB.
- \`upon event exists (s, m) ∈ pending do\`:
  - \`if |ack[m]| > n / 2 and m ∉ delivered then\`: the crucial threshold. Instead of checking \`correct ⊆ ack[m]\`, it checks whether the number of processes in $\\mathit{ack}[m]$ exceeds half of the total ($|\\mathit{ack}[m]| > n/2$, i.e., $|\\mathit{ack}[m]| \\ge \\lfloor n/2 \\rfloor + 1$).
  - \`delivered := delivered ∪ {m}\`: marks $m$ as delivered.
  - \`trigger < urb, Deliver | s, m >\`: delivers $m$ to the upper layer.

### Why does waiting for $|\\mathit{ack}[m]| > n/2$ guarantee uniform agreement, and why would a larger threshold block the algorithm?

1. **Why $|\\mathit{ack}[m]| > n/2$ guarantees uniform agreement:** if any process $p$ (correct or faulty) delivers $m$, then $p$ has gathered a quorum $Q_{\\text{ack}} = \\mathit{ack}[m]$ of ACKs with $|Q_{\\text{ack}}| > n/2$. By the quorum intersection property, $Q_{\\text{ack}}$ intersects the set of correct processes $Q_{\\text{correct}}$ in at least one process $p_{\\text{intersect}} \\in Q_{\\text{ack}} \\cap Q_{\\text{correct}}$. Process $p_{\\text{intersect}}$ is correct and has relayed $m$ with BEB to all processes. By the validity of BEB, all correct processes receive $m$, record the senders in \`ack[m]\`, and relay $m$. Eventually, every correct process gathers the ACKs of all the correct processes ($|Q_{\\text{correct}}| > n/2$), so that $|\\mathit{ack}[m]| > n/2$ becomes true at all correct processes, which then deliver $m$.
2. **Why waiting for $|\\mathit{ack}[m]| \\ge n/2 + 2$ blocks the algorithm:** suppose $n = 10$ and $f = 4$ processes crash at time $t = 0$. The surviving processes are $n - f = 10 - 4 = 6$, and the threshold $n/2 + 1$ is $6$. If the algorithm used the threshold $n/2 + 2 = 7$, then even if all the 6 surviving correct processes receive, relay, and acknowledge the message $m$, the largest number of ACKs that a process can ever gather is $6$. Since $6 < 7$, the condition $|\\mathit{ack}[m]| \\ge 7$ is never satisfied: all correct processes keep $m$ in \`pending\` forever, violating validity.

The same reasoning answers the question of what happens without a majority of correct processes, for instance when the number of faulty processes is $n/2 + 1$: to be sure that an ACK comes from a correct process one would have to wait for more ACKs than there are faulty processes, but once all the faulty processes have crashed that many ACKs never arrive, and validity is violated.

### What is the impossibility result on uniform reliable broadcast in fail-silent asynchronous systems?

In an asynchronous, fail-silent system, if the number of crashes can be $f \\ge n/2$, **uniform reliable broadcast is impossible**. The intuition is a partition argument. Split the processes into two halves. Since a whole half may crash, the processes of the first half must be able to deliver a message without having received anything from the second half, whose messages may just be very slow. But once they have delivered, the processes of the first half may all crash, and the messages they sent are not guaranteed to arrive (a perfect link guarantees delivery only if the sender is correct): the second half never delivers the message, and uniform agreement is violated. The next lecture develops this argument.

Summing up: uniform reliable broadcast can be implemented in a synchronous system with a perfect failure detector, and in an asynchronous system assuming a majority of correct processes.

## Eager reliable broadcast and independence from failure detectors

### Is a failure detector necessary to achieve regular (non-uniform) reliable broadcast?

No. Regular reliable broadcast (RB) can be implemented in an asynchronous, fail-silent system without any failure detector and without any assumption on the number of failures ($f < n$). This is what the **Eager Reliable Broadcast** algorithm does.

### How does the Eager Reliable Broadcast algorithm operate?

\`\`\` Eager Reliable Broadcast (the sender delivers at once)
Module: EagerRB (Eager Regular Reliable Broadcast)
Uses:
  BestEffortBroadcast (beb)

upon event < rb, Init > do
  delivered := ∅

upon event < rb, Broadcast | m > do
  delivered := delivered ∪ {m}
  trigger < rb, Deliver | self, m >
  trigger < beb, Broadcast | [DATA, self, m] >

upon event < beb, Deliver | p, [DATA, s, m] > do
  if m ∉ delivered then
    delivered := delivered ∪ {m}
    trigger < rb, Deliver | s, m >
    trigger < beb, Broadcast | [DATA, s, m] >
\`\`\`

**Line-by-line explanation of the algorithm:**

- \`upon event < rb, Init > do\`: sets \`delivered\` to $\\emptyset$.
- \`upon event < rb, Broadcast | m > do\`: triggered when the sender broadcasts $m$.
  - \`delivered := delivered ∪ {m}\`: adds $m$ to \`delivered\` at once.
  - \`trigger < rb, Deliver | self, m >\`: delivers $m$ locally to the upper layer at once. This is a small variant of the algorithm of the previous lecture, in which the sender delivers $m$ when it receives its own copy from BEB: the copy that comes back later is simply filtered out by \`delivered\`.
  - \`trigger < beb, Broadcast | [DATA, self, m] >\`: broadcasts $m$ with BEB to all processes.
- \`upon event < beb, Deliver | p, [DATA, s, m] > do\`: triggered when BEB delivers \`[DATA, s, m]\` from process $p$.
  - \`if m ∉ delivered then\`: checks whether $m$ is seen for the first time.
  - \`delivered := delivered ∪ {m}\`: marks $m$ as delivered.
  - \`trigger < rb, Deliver | s, m >\`: delivers $m$, with original source $s$, to the upper layer.
  - \`trigger < beb, Broadcast | [DATA, s, m] >\`: eagerly relays $m$ to all processes. This flooding guarantees that if a correct process delivers $m$, all the other correct processes receive $m$ through BEB and deliver it.

### What is the trade-off between the reliable broadcast algorithms in messages and in delays?

| Protocol | Model and assumptions | Messages, best case | Messages, worst case | Delays, best case | Delays, worst case |
|---|---|---|---|---|---|
| Lazy RB | Fail-stop ($\\mathcal{P}$) | $O(n)$ | $O(n^2)$ | $1$ | $O(n)$ |
| Eager RB | Fail-silent ($f < n$) | $O(n^2)$ | $O(n^2)$ | $1$ | $O(n)$ |
| All-Ack URB | Fail-stop ($\\mathcal{P}$) | $O(n^2)$ | $O(n^2)$ | $2$ | $O(n)$ |
| Majority-Ack URB | Fail-silent ($f < n/2$) | $O(n^2)$ | $O(n^2)$ | $2$ | $O(n)$ |

## Spanning tree broadcast overview

### How do real systems reduce the $O(n^2)$ message complexity of flooding?

In a real network, relaying every message to all the $n$ processes generates $O(n^2)$ messages: a **broadcast storm** that saturates network interfaces and routers and that must be avoided in large systems. To prevent it, real systems build a **spanning tree** over the graph of the network, that is, a tree that covers the whole graph (any spanning tree has $n-1$ edges). Broadcast messages travel only along the edges of the spanning tree: a node that receives a message forwards it only to its parent and to its children in the tree. This reduces the message complexity from $O(n^2)$ to $O(n)$ ($n-1$ messages), and acknowledgments can be collected along the tree in the same way, layer by layer, with a linear number of messages. If a node of the tree crashes, repair mechanisms reconfigure the spanning tree dynamically.

## Exercises

The exercises on the average of the clocks of the neighbors, on vector clocks with an unknown number of processes, on the increment after the send, on the link that loses at most $k$ messages, and on the FIFO link with immediate delivery are in Lecture 7. Here are the remaining ones.

### How are statements on events verified with vector clocks?

Consider an execution with 4 processes $\\Pi = \\{p_1, p_2, p_3, p_4\\}$. After applying the vector clock rules to the execution, the events $e_1, e_2, e_3$ have the timestamps:

- $V(e_1) = [2, 0, 0, 0]$
- $V(e_2) = [1, 1, 0, 0]$
- $V(e_3) = [4, 4, 4, 3]$

Which of the following statements are true?

- **Statement A:** $e_1 \\to e_2$ ($e_1$ happened before $e_2$).
  - **False.** For $e_1 \\to e_2$ to hold we would need $V(e_1) \\le V(e_2)$ on every component. Comparing $V(e_1)[1] = 2$ and $V(e_2)[1] = 1$, we see $2 > 1$. Comparing $V(e_1)[2] = 0$ and $V(e_2)[2] = 1$, we see $0 < 1$. Because neither vector is less than or equal to the other on all components, $e_1$ and $e_2$ are **concurrent** ($e_1 \\parallel e_2$).
- **Statement B:** $e_1 \\to e_3$ ($e_1$ happened before $e_3$).
  - **True.** Comparing $V(e_1) = [2, 0, 0, 0]$ with $V(e_3) = [4, 4, 4, 3]$ component by component: $2 \\le 4$, $0 \\le 4$, $0 \\le 4$, $0 \\le 3$, and at least one component is strictly smaller ($2 < 4$). Thus $V(e_1) < V(e_3)$, which proves $e_1 \\to e_3$.
- **Statement C:** $e_2 \\to e_3$ ($e_2$ happened before $e_3$).
  - **True.** Comparing $V(e_2) = [1, 1, 0, 0]$ with $V(e_3) = [4, 4, 4, 3]$ component by component: $1 \\le 4$, $1 \\le 4$, $0 \\le 4$, $0 \\le 3$, with a strict inequality on all components. Thus $V(e_2) < V(e_3)$, which proves $e_2 \\to e_3$.

### What happens if Lazy Reliable Broadcast records a message only when its source has crashed? (exam exercise)

This is a typical exam exercise: the code of an algorithm seen in class is given together with a modified version, and for each property of the abstraction one must say whether it still holds, justifying the answer, or show an execution that violates it.

Consider the Lazy Reliable Broadcast algorithm of the previous lecture, modified by moving the statement \`from[s] := from[s] ∪ {m}\` inside the block \`if s ∉ correct then\`, so that \`from[s]\` is updated **only** if the source $s$ has already been detected as crashed:

\`\`\` Lazy Reliable Broadcast: the modified deliver handler
Upon event < beb, Deliver | p_j, [DATA, s, m] > do:
    if m ∉ from[s] then:
        trigger < rb, Deliver | s, m >;
        if s ∉ correct then:
            from[s] := from[s] ∪ {m};
            trigger < beb, Broadcast | [DATA, s, m] >;
\`\`\`

The system is asynchronous but equipped with a perfect failure detector, and has four processes, of which at most three can fail. The method is to look at what the modified line was doing in the original algorithm: \`from[s]\` served two purposes, filtering duplicates and remembering the messages of a source in order to relay them when it crashes.

- **Validity: holds.** If a correct process $p$ broadcasts $m$, it executes the BEB broadcast and receives its own copy. At that moment $m \\notin \\mathit{from}[p]$, so the test succeeds and $p$ delivers $m$.
- **Agreement: violated.** Counterexample:
  - Process $p_2$ broadcasts $m$ with BEB and crashes in the middle of the broadcast, after sending $m$ only to process $p_0$.
  - $p_0$ receives $m$ from BEB. Since $p_2$ has not been detected yet by the failure detector of $p_0$ ($p_2 \\in \\mathit{correct}$), $p_0$ delivers $m$, but because of the modification it does **not** add $m$ to $\\mathit{from}[p_2]$.
  - A moment later, the failure detector of $p_0$ detects the crash of $p_2$ (\`< P, Crash | p_2 >\`).
  - $p_0$ executes the crash handler: \`forall m ∈ from[p_2] do trigger < beb, Broadcast | [DATA, p_2, m] >\`.
  - Because $m$ was never added to $\\mathit{from}[p_2]$, the set is **empty**: $p_0$ triggers **no relay** of $m$.
  - The correct process $p_1$ never receives $m$, neither from $p_2$ nor from $p_0$, and never delivers it.
  - The correct process $p_0$ has delivered $m$, while the correct process $p_1$ never delivers it: agreement is violated.
- **No duplication: violated.** The counterexample starts from the same situation, in which a process delivers $m$ without recording it:
  - Process $p_1$ broadcasts $m$ and then crashes. The copy for $p_0$ arrives quickly, the copy for $p_2$ is slow.
  - $p_0$ receives $m$ while $p_1 \\in \\mathit{correct}$: it delivers $m$ and does not add it to $\\mathit{from}[p_1]$.
  - $p_2$ first detects the crash of $p_1$ and only then receives $m$. Now the source is not in \`correct\`: $p_2$ delivers $m$, records it and relays \`[DATA, p_1, m]\` with BEB.
  - The relay of $p_2$ reaches $p_0$. Since $m \\notin \\mathit{from}[p_1]$ at $p_0$, the test succeeds again and $p_0$ delivers $m$ **a second time**.

### What happens to All-Ack URB if the failure detector is not perfect?

Consider the All-Ack Uniform Reliable Broadcast algorithm, and suppose that one of the two properties of the perfect failure detector is violated.

- **Strong accuracy is violated** (a process may be detected although it is alive): uniform agreement is violated. In a system with two processes, $p_0$ broadcasts $m$ and receives its own copy. The failure detector wrongly reports that $p_1$ has crashed, so $p_1$ is removed from \`correct\`, and $p_0$ delivers $m$ without waiting for the ACK of $p_1$. Then $p_0$ crashes, and the messages it sent die with it. The correct process $p_1$ never sees $m$: a process has delivered a message that a correct process never delivers.
- **Strong completeness is violated** (a process may crash without ever being detected): validity is violated. In a system with two processes, $p_1$ crashes immediately and $p_0$ broadcasts $m$. Since the crash of $p_1$ is never reported, $p_1$ stays in \`correct\`, and $p_0$ waits forever for an ACK that will never arrive: the correct process $p_0$ never delivers its own message.
`;export{e as default};
