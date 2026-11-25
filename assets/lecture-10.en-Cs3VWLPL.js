const e=`## Space complexity of vector clocks

### Is the size of the messages of the Waiting Causal Broadcast constant with respect to the number $m$ of messages sent in the system?

The Waiting Causal Broadcast of the previous lecture trades the size of the messages for waiting: instead of its whole causal history, a message carries a vector. The size of this vector, however, is not constant with respect to the history of the execution. The number of components is fixed, $N$ (the number of processes of the system, $|\\Pi| = N$), but the integer stored in each component $V[i]$ grows as process $p_i$ broadcasts messages.

To write an integer $k \\ge 1$ in binary, $\\lceil \\log_2(k + 1) \\rceil$ bits are needed. If process $p_i$ has broadcast $m_i$ messages, encoding the counter $m_i$ takes about $\\log_2 m_i$ bits. Consequently, for a vector $V$ of $N$ components, the total size of the vector attached to each message is:

$$S_{\\text{vector}} = \\sum_{i=1}^{N} \\lceil \\log_2(V[i] + 1) \\rceil = O\\left(N \\log m_{\\max}\\right)$$

where $m_{\\max} = \\max_{i} V[i]$ is the maximum number of messages broadcast by a single process up to that point of the execution.

The size of the vector does not depend at all on the content of the messages (in the No-Waiting algorithm, instead, the messages themselves travel inside the history), but it does depend, logarithmically, on the number $m$ of messages of the execution. Thus the vectors cannot take $O(1)$ bits per message: some dependence on the execution cannot be avoided. A logarithmic growth, $O(\\log m)$, is nevertheless a very good bound, compared with the unbounded growth of the algorithms that send the history (such as the No-Waiting Causal Broadcast, where the whole history of messages is attached to every message).

## Total order broadcast (atomic broadcast)

### Why is causal order broadcast not enough to keep replicas consistent, and why do we need total order broadcast?

Causal order broadcast ensures that causally related messages are delivered in the same relative order by all processes. However, it places no constraint on the delivery order of concurrent messages ($m_1 \\parallel m_2$). If two concurrent operations do not commute, delivering them in different orders at different replicas makes the states diverge for good.

Consider the blackboard example of a bank application in which the balance of an account is replicated on two servers, $p_1$ and $p_2$. The initial balance at both replicas is $v_0 = 100$. Two clients issue two concurrent operations, with no causal relation between them:

- **Operation A** (issued by client 1): deposit 20 euros ($m_A = \\text{Deposit}(20)$).
- **Operation B** (issued by client 2): add 10% of interest ($m_B = \\text{Interest}(10\\%)$).

Because $m_A$ and $m_B$ are concurrent ($m_A \\parallel m_B$), a causal order broadcast allows $p_1$ to deliver $m_A$ followed by $m_B$, while $p_2$ delivers $m_B$ followed by $m_A$.

- On replica $p_1$:
  1. $v \\leftarrow 100 + 20 = 120$
  2. $v \\leftarrow 120 + (120 \\times 0.10) = 132$
- On replica $p_2$:
  1. $v \\leftarrow 100 + (100 \\times 0.10) = 110$
  2. $v \\leftarrow 110 + 20 = 130$

At the end of the execution, replica $p_1$ holds a balance of 132, whereas replica $p_2$ holds a balance of 130. Because adding a sum and adding a percentage do not commute ($\\text{Interest}(10\\%) \\circ \\text{Deposit}(20) \\neq \\text{Deposit}(20) \\circ \\text{Interest}(10\\%)$), the state of the system is inconsistent, even though causal order broadcast has been respected. With commutative operations (two deposits, for instance) the replicas would reach the same state whatever the order of delivery; unfortunately, most real operations do not commute.

To keep consistent the replicas of a state machine that executes non-commutative operations, the system must use a total order broadcast, which shows to every replica exactly the same sequence of messages. It is also known as atomic broadcast: some books use one name and some the other, for the same thing.

### What are the definition and the specification of total order broadcast?

Total order broadcast (or atomic broadcast) is a communication abstraction with the events $\\text{to-Broadcast}(m)$ and $\\text{to-Deliver}(p_i, m)$. It adds a property of total order to the properties of reliable broadcast: the processes agree not only on the set of messages they deliver, but also on the order in which they deliver them.

The properties that define (regular) total order broadcast are:

- **TOB1 (validity):** if a correct process $p_i$ broadcasts a message $m$, then $p_i$ eventually delivers $m$.
- **TOB2 (no duplication):** no message $m$ is delivered more than once.
- **TOB3 (no creation):** if a process delivers a message $m$ with sender $p_j$, then $m$ was previously broadcast by $p_j$.
- **TOB4 (agreement):** if a message $m$ is delivered by a correct process, then $m$ is eventually delivered by every correct process.
- **TOB5 (total order):** let $m_1$ and $m_2$ be any two messages, and let $p_i$ and $p_j$ be any two correct processes that deliver both of them. If $p_i$ delivers $m_1$ before $m_2$, then $p_j$ delivers $m_1$ before $m_2$.

Implementing this abstraction requires solving consensus, so the algorithm is postponed until consensus has been studied.

### How does total order relate to FIFO order and to causal order?

Total order is orthogonal to FIFO order and to causal order:

- Reliable broadcast + total order = atomic broadcast.
- FIFO broadcast + total order = FIFO atomic broadcast.
- Causal broadcast + total order = causal atomic broadcast.

Total order guarantees that all processes agree on one sequence of deliveries for all messages, but this sequence can be any sequence: by itself, total order enforces neither the FIFO order nor the causal order, unless it is explicitly combined with those properties. For instance, an atomic broadcast could deliver two messages $m_1$ and $m_2$, broadcast in this order by the same process, in the reverse order ($m_2$ before $m_1$) at every process of the system: such an execution satisfies total order (because every process sees $m_2$ before $m_1$), but it violates FIFO order.

### Which messages are ordered by total order broadcast and not by causal broadcast?

The **concurrent messages** ($m_1 \\parallel m_2$). For two messages that are causally related ($m_1 \\to m_2$), causal order broadcast already forces $m_1$ to be delivered before $m_2$. Concurrent messages have no causal dependency, so causal broadcast lets different processes deliver them in different orders. In a causal atomic broadcast, the total order property removes this freedom, by imposing one sequence on the concurrent messages too. In the same way, with respect to FIFO broadcast, what total order adds is the relative order of the messages broadcast by different senders: the order of the messages of the same sender is already fixed by FIFO.

### Why is it called atomic, and what is a logical cut?

The broadcast is called atomic because, from a logical point of view, each message is delivered as if by an indivisible action that takes place at the same instant at every process. The deliveries of the same message can happen at different physical times at different processes, but in logical time, the only time that exists in a distributed system, they coincide: there is the instant of the first message at every process, then the instant of the second message at every process, and so on. Each of these instants can be drawn as a **logical cut** of the execution, a line that crosses the timelines of all the processes at the delivery of the same message: before each cut, all the processes have delivered exactly the same messages, in the same order.

In principle an atomic broadcast could be built on mutual exclusion (take the lock, broadcast, wait until everybody has received the message, release the lock), at the price of many messages and of serious difficulties when the process that holds the lock crashes. The course uses consensus instead.

## Causal delivery: two exercises from the book

### How does the causal delivery property compare with a weaker formulation?

Exercise 3.11 of the book asks to compare the causal delivery property CRB5 of Module 3.9 with an alternative property, called $P_1$ here:

- **Causal delivery (CRB5):** for any message $m_1$ that potentially caused a message $m_2$, that is, $m_1 \\to m_2$, no process delivers $m_2$ unless it has already delivered $m_1$.
- **Alternative property ($P_1$):** if a process delivers both messages $m_1$ and $m_2$, and $m_1 \\to m_2$, then the process must deliver $m_1$ before $m_2$.

### Are CRB5 and $P_1$ equivalent, or does one imply the other?

The two properties are **not** equivalent. CRB5 implies $P_1$, but $P_1$ does not imply CRB5.

The reason is in the structure of $P_1$, which must be read carefully: it is an implication whose premise has two parts, "the process delivers both $m_1$ and $m_2$" and "$m_1 \\to m_2$". If a process does not deliver both messages, the premise is false and the property asks nothing.

To see the difference, consider an execution with three messages such that $m_0 \\to m_1 \\to m_2$. Process $p_0$ delivers $m_0$, $m_1$ and $m_2$, in this order. Process $p_1$ delivers $m_0$ and $m_2$, but never delivers $m_1$.

- **Under $P_1$:** the premise requires $p_1$ to deliver **both** $m_1$ and $m_2$. Since $p_1$ never delivers $m_1$, the premise is false for this pair of messages, and $P_1$ is satisfied vacuously. The two messages that $p_1$ does deliver are in the right order.
- **Under CRB5:** process $p_1$ delivered $m_2$ without having delivered $m_1$, although $m_1 \\to m_2$. This violates CRB5.

Because $P_1$ lets a process skip the message $m_1$ and still deliver $m_2$, it allows a strictly larger set of executions: it is strictly weaker than CRB5.

### Can a best-effort broadcast satisfy causal delivery without satisfying the agreement of reliable broadcast?

This is Exercise 3.12 of the book. The question is whether there can be an algorithm that has the three properties of best-effort broadcast (validity, no duplication, no creation) and causal delivery, but not the agreement property of reliable broadcast. Put the other way round: do the three properties of best-effort broadcast, together with causal delivery, imply agreement?

The intuition behind the solution of the book is that they do. Suppose that a correct process delivers a message $m_1$ whose sender is faulty, and then broadcasts a message $m_2$. By the validity of best-effort broadcast, every correct process delivers $m_2$; since $m_1 \\to m_2$, by causal delivery every correct process must deliver $m_1$ first. So every correct process delivers $m_1$, and agreement holds.

In class this conclusion was shown to be **incorrect**, because nothing forces the correct process to broadcast $m_2$: a broadcast algorithm does not send messages spontaneously, it is the upper layer that decides whether to broadcast. The counterexample is an execution with four processes $p_0, p_1, p_2, p_3$:

1. Process $p_3$ broadcasts $m_1$ and crashes while it is sending it: only $p_2$ receives the message.
2. Process $p_2$, which is correct, delivers $m_1$.
3. Process $p_2$ never broadcasts any message, and no other message is broadcast in the system.
4. Processes $p_0$ and $p_1$, which are correct, never deliver $m_1$.

Evaluation of the properties:

- **Validity of best-effort broadcast:** satisfied. The sender $p_3$ is faulty, and validity only constrains the messages broadcast by correct processes.
- **No duplication and no creation:** satisfied (no message is delivered twice, and no message is invented).
- **Causal delivery:** satisfied. There is only one message, so no causal order can be violated.
- **Agreement of reliable broadcast:** **violated**. The correct process $p_2$ delivered $m_1$, whereas the correct processes $p_0$ and $p_1$ never deliver it.

So an algorithm can satisfy the validity, no duplication and no creation of best-effort broadcast together with causal delivery, and still not satisfy agreement: best-effort broadcast plus causal delivery does not imply reliable broadcast. The argument of the book only works for the executions in which the process that delivered $m_1$ later broadcasts something.

## Distributed register abstraction

### What is a distributed register, and how does it simulate a shared memory over a message-passing network?

A distributed register is a shared memory abstraction built on top of a message-passing network. It gives the processes the illusion of one shared variable, like the memory shared by the processes of a single machine, that can be accessed with read and write operations: every process runs a piece of code that keeps a local copy of the variable and exchanges messages to keep the copies synchronized.

Processes interact with a distributed register through two operations:

- **Write operation $\\text{Write}(v)$:** invoked by a process to store a value $v$ in the register.
- **Read operation $\\text{Read}()$:** invoked by a process to retrieve the value currently stored in the register. A read does not modify the content of the register.

### What is the structure of read and write operations?

Every operation on a register takes time: it is not instantaneous. An operation $O$ is delimited by two events, each of which occurs at a single indivisible point of time:

1. **Invocation event $\\text{inv}(O)$:** the point in time at which a process starts the operation ($\\text{write}(v)$ or $\\text{read}()$).
2. **Return (confirmation) event $\\text{ret}(O)$:** the point in time at which the operation completes and gives its result to the invoking process (a plain confirmation for a write, the value read for a read).

An operation is **pending** during the interval between its invocation and its return, and it is **complete** when both events have occurred. If a process crashes while one of its operations is pending, the operation never returns: it is a **failed** operation, and its return event is modeled as occurring at $t = \\infty$.

### What are the assumptions on distributed registers?

- **Sequential access of each process:** the operations invoked by the same process $p_i$ are sequential. A process $p_i$ never invokes a new operation $O_2$ while its previous operation $O_1$ is still pending. Different processes, instead, can invoke operations at the same time.
- **Integer values:** for simplicity a register stores positive integers, and it is initialized to a default value $v_0 = 0$ (or $\\bot$). This is not a restriction, because anything can be encoded with numbers.
- **Unique written values:** every write writes a different value (in practice this is obtained by attaching a local sequence number or a timestamp to the value written).

### How are precedence ($O_1 \\to O_2$) and concurrency ($O_1 \\parallel O_2$) defined for the operations on a register?

The relation between two operations $O_1$ and $O_2$ depends only on their intervals in physical time:

- **Precedence ($O_1 \\to O_2$):** $O_1$ precedes $O_2$ if and only if the return of $O_1$ occurs before the invocation of $O_2$: $$\\text{ret}(O_1) < \\text{inv}(O_2)$$
- **Concurrency ($O_1 \\parallel O_2$):** $O_1$ and $O_2$ are concurrent if neither precedes the other, that is, if their intervals overlap in time: $$\\text{inv}(O_1) \\le \\text{ret}(O_2) \\quad \\text{and} \\quad \\text{inv}(O_2) \\le \\text{ret}(O_1)$$

### What is the relation between a failed operation and the operations that follow it?

If a process crashes while executing an operation $O_1$, the operation never produces its return event ($\\text{ret}(O_1) = \\infty$). Therefore any operation $O_2$ invoked after the invocation of $O_1$ satisfies $\\text{inv}(O_2) < \\text{ret}(O_1)$: a failed operation $O_1$ is **concurrent** with all the operations invoked after it, forever.

### Why does a register need a semantics, and which semantics does the course consider?

Before implementing a register, one has to say what a read must return. If the accesses are **strictly serialized**, as with a lock (no process invokes an operation while the operation of another process is still pending), and there are no failures, the answer is easy: every operation eventually terminates (liveness), and every read returns the last value written (safety).

The difficulty comes with concurrency and with failures. If a read overlaps a write, should it return the old value or the new one? And if the writer crashes in the middle of a write, the write stays concurrent with every later read: what can those reads return? A **semantics** (a consistency condition) answers these questions, by restricting the set of the allowed executions. The course considers three of them: regular consistency, sequential consistency, and linearizability (also called atomic consistency). This lecture starts with the regular one.

### How are registers classified?

Registers are classified by the number of processes that are allowed to write ($X$) and to read ($Y$), and they are denoted as $(X,Y)$ registers:

- **$(1,1)$ register:** one writer and one reader. Exactly one process $p_w$, known in advance, can write, and exactly one process $p_r$ can read.
- **$(1,N)$ register:** one writer and many readers. Exactly one process $p_w$, known in advance, can write, and all the $N$ processes can read.
- **$(N,N)$ register:** many writers and many readers. All the $N$ processes of the system can both read and write.

It is important to note that the pair $(X,Y)$ only says who may invoke the operations, not how many processes the system has: a $(1,1)$ register can live in a system of 100 processes. All the processes take part in the protocol (they store a copy of the value, and they relay and acknowledge messages), and this is what lets the register tolerate failures: a correct reader can complete its reads even if the writer has crashed. Who the writer is, is decided before the algorithm starts, like the ranks of the processes; if the writer crashes, nobody takes its place.

## Regular register semantics

### What are the specification and the semantics of a $(1,N)$ regular register?

A $(1,N)$ regular register is defined by two properties:

1. **Termination (liveness):** if a correct process invokes an operation, then the operation eventually completes.
2. **Validity (safety):** a read that is not concurrent with a write returns the last value written; a read that is concurrent with a write returns the last value written or the value concurrently written. In other words, a read operation $R$ returns:
  - the value written by the last write $W$ that precedes $R$ ($W \\to R$), or
  - the value written by a write $W_{\\text{conc}}$ that is concurrent with $R$ ($W_{\\text{conc}} \\parallel R$).

In a $(1,N)$ regular register, if no write is concurrent with a read $R$, then $R$ **must** return the value of the most recent write completed before the beginning of $R$ (or the initial value, if nothing has been written yet). If one or more writes overlap $R$, then $R$ may return either the value of the most recent completed write or any of the values being written concurrently.

**Executions evaluated under the regular semantics:**

**Trace 1:**

- $W(5)$ completes.
- Subsequently, $R()$ is invoked and returns $5$.
- **Evaluation:** valid. The read returns $5$, which is the value of the last preceding write ($W(5) \\to R()$). If the read returned the initial value $0$, the execution would not be regular.

**Trace 2:**

- $W(5)$ completes.
- Subsequently, $W(8)$ is invoked and is still pending.
- Concurrently with $W(8)$, a read $R()$ is invoked and returns $5$.
- **Evaluation:** valid, because $R() \\parallel W(8)$. Under regular validity, $R()$ can return either the last value written before it ($5$) or the concurrent value ($8$).

**Trace 3:**

- $W(5)$ completes.
- $W(8)$ is invoked, and it is concurrent with two sequential reads: $R_1()$ followed by $R_2()$.
- $R_1()$ returns $8$.
- $R_2()$ returns $5$.
- **Evaluation:** valid under the regular semantics. Both $R_1()$ and $R_2()$ overlap $W(8)$, so each of them, independently of the other, may return either $5$ or $8$. (This trace is valid for a regular register, but not for an atomic one, which does not allow a read to return an older value than the one returned by a read that precedes it.)

**Trace 4:**

- $W(5)$ completes.
- The writer invokes $W(8)$ and crashes before the write returns.
- From then on, every read is concurrent with $W(8)$.
- **Evaluation:** every read may return $5$ or $8$, forever. One process may always read $5$ while another one always reads $8$, or the same process may see the two values alternate. Since there is only one writer, no later write will ever settle the value.

## Read-One Write-All: a regular register in the fail-stop model

### How does the Read-One Write-All (ROWA) algorithm implement a $(1,N)$ regular register in the fail-stop model?

The ROWA algorithm works in the fail-stop model: $N$ processes that can crash, perfect point-to-point links, best-effort broadcast, and a perfect failure detector ($\\mathcal{P}$).

The idea is that each process keeps a local copy of the register, and that the single writer has to keep the copies consistent:

- **Write operation (write all):** the writer $p_w$ broadcasts the new value to **all** the processes; each process that receives it updates its local copy and sends back an acknowledgment. The write returns only when the writer has received an acknowledgment from every process that it does not consider crashed (that is, that $\\mathcal{P}$ has not detected).
- **Read operation (read one):** any reader $p_i$ just reads its local variable \`val\` and returns it at once, without sending any message.

The delicate point is when the write may return. If it returned right after the broadcast, or as soon as the writer delivers its own message, a process that has not received the value yet could read the old value **after** the end of the write, and this is not regular. Waiting for the acknowledgments of all the processes that have not crashed pushes the end of the write after the moment in which all those copies have been updated. The perfect failure detector is what prevents the writer from waiting forever for a process that has crashed.

\`\`\` Read-One Write-All: (1, N) regular register
Module:
  Name: ReadOneWriteAllRegularRegister (rowa)

Events:
  Request: < rowa, Write | v >
  Indication: < rowa, WriteReturn >
  Request: < rowa, Read >
  Indication: < rowa, ReadReturn | v >

upon event < rowa, Init > do
  val := ⊥;
  correct := Π;
  writeset := ∅;

upon event < P, Crash | p_j > do
  correct := correct \\ {p_j};

upon event < rowa, Write | v > do
  trigger < beb, Broadcast | [WRITE, v] >;

upon event < beb, Deliver | p_w, [WRITE, v] > do
  val := v;
  trigger < pl, Send | p_w, [ACK] >;

upon event < pl, Deliver | p_j, [ACK] > do
  writeset := writeset ∪ {p_j};

upon correct ⊆ writeset do
  writeset := ∅;
  trigger < rowa, WriteReturn >;

upon event < rowa, Read > do
  trigger < rowa, ReadReturn | val >;
\`\`\`

**Line-by-line explanation of the pseudocode:**

- \`Init\`: initializes the local copy \`val\` of the register to the initial value $\\bot$. The set \`correct\` contains all the processes $\\Pi$. The set \`writeset\`, which collects the acknowledgments, is empty; only the writer uses it.
- \`upon event < P, Crash | p_j >\`: triggered when the perfect failure detector $\\mathcal{P}$ detects that process $p_j$ has crashed. Process $p_j$ is removed for good from the set \`correct\`.
- \`upon event < rowa, Write | v >\`: executed only by the writer $p_w$, when it starts a write of the value $v$. The writer sends the message \`[WRITE, v]\` to all the processes, itself included, with best-effort broadcast.
- \`upon event < beb, Deliver | p_w, [WRITE, v] >\`: executed by every process when it receives the write request of $p_w$. The process updates its local copy, \`val := v\`, and immediately sends an \`ACK\` back to $p_w$ on the perfect link.
- \`upon event < pl, Deliver | p_j, [ACK] >\`: executed by the writer $p_w$ when it receives the acknowledgment of $p_j$. The writer adds $p_j$ to \`writeset\`.
- \`upon correct ⊆ writeset\`: when every process in \`correct\` has acknowledged, the write is complete: the writer empties \`writeset\` and triggers \`< rowa, WriteReturn >\`. The condition is evaluated again whenever one of the two sets changes, so the write also completes when the last missing process is detected as crashed.
- \`upon event < rowa, Read >\`: executed by any process that starts a read. The process immediately returns its local value \`val\` with \`< rowa, ReadReturn | val >\`, without exchanging messages.

### What is the complexity of the ROWA regular register algorithm?

- **Write operation:**
  - **Message complexity:** at most $2N$ messages per write: $N$ \`WRITE\` messages for the broadcast and at most $N$ \`ACK\` messages.
  - **Time complexity:** 2 message delays (one for the value to reach everybody, one for the acknowledgments to come back).
- **Read operation:**
  - **Message complexity:** $0$ messages (the read is purely local).
  - **Time complexity:** $0$ message delays.
- **Resilience:** the algorithm tolerates the crash of any number of processes. As long as one process is alive, it behaves correctly: if it is the writer, it does not wait for the acknowledgments of the processes detected as crashed; if it is a reader, it reads its local copy.

### What happens if the writer does not empty the set of acknowledgments at the end of a write?

If the line \`writeset := ∅\` is removed, then when a new write $W_2(v_2)$ starts, the set \`writeset\` still contains the processes that acknowledged the previous write $W_1(v_1)$. The condition \`correct ⊆ writeset\` is therefore already true, and the writer returns from $W_2(v_2)$ immediately, before any other process has received $v_2$. A read $R()$ invoked by a reader $p_i$ after the return of $W_2(v_2)$ ($W_2 \\to R$) can then find the old value $v_1$ in its local \`val\`, and return $v_1$ instead of $v_2$: this violates the validity of the regular register. Emptying the set at every write is necessary for the correctness of the algorithm, whose whole trick is to push the end of a write after the moment in which everybody has seen the value.
`;export{e as default};
