## FIFO point-to-point communication links

### What is the formal definition of a FIFO point-to-point link?

A FIFO (First-In, First-Out) point-to-point link is a reliable communication abstraction built directly on top of a perfect point-to-point link (PL). It guarantees that the messages sent by a process $p$ to a process $q$ are delivered at $q$ in the exact order in which they were sent by $p$.

The FIFO link abstraction exposes the two usual events:

- **Request event:** $\langle \text{fifo}, \text{Send} \mid q, m \rangle$ - requests the transmission of message $m$ to the destination process $q$.
- **Indication event:** $\langle \text{fifo}, \text{Deliver} \mid p, m \rangle$ - indicates the delivery of message $m$ sent by the source process $p$.

The specification of a FIFO point-to-point link consists of the three properties of the perfect link plus an ordering property:

- **Reliable delivery (PL1):** if a correct process $p$ sends a message $m$ to a correct process $q$, then $q$ eventually delivers $m$.
- **No duplication (PL2):** no message $m$ is delivered to process $q$ more than once.
- **No creation (PL3):** if a process $q$ delivers a message $m$ with sender $p$, then $m$ was previously sent to $q$ by process $p$.
- **FIFO delivery order (FIFO):** if a process $p$ sends a message $m$ to process $q$ before sending a message $m'$ to $q$, then $q$ delivers $m$ before it delivers $m'$. Formally: $$\forall p, q \in \Pi, \forall m, m': \left( \text{Send}_p(q, m) \to \text{Send}_p(q, m') \right) \implies \left( \text{Deliver}_q(p, m) \to \text{Deliver}_q(p, m') \right)$$

### What is the relationship between pairwise FIFO ordering and the ordering of a sequence of messages?

Although the FIFO property is stated for any two messages $m$ and $m'$, it extends by induction to any sequence of messages. If the sender $p$ sends the sequence $\langle m_1, m_2, m_3, \dots, m_k \rangle$ to the receiver $q$, then $q$ can only deliver the messages in the exact order $\langle m_1, m_2, m_3, \dots, m_k \rangle$. If $q$ delivered $\langle m_1, m_3, m_2, \dots \rangle$, the pair $(m_2, m_3)$ would directly violate the FIFO property. Note that a FIFO link works between one sender and one receiver: it does not impose any order across different senders.

### What is the pseudocode of a FIFO link over a perfect link?

``` FIFO link over a perfect link
Module:
    Name: FifoPointToPointLink, instance fifo

Events:
    Request: < fifo, Send | q, m >
    Indication: < fifo, Deliver | p, m >

Uses:
    PerfectPointToPointLink, instance pl

Upon Event < fifo, Init > do:
    pending := ∅
    seq := 0
    next_deliv_seq := 0

Upon Event < fifo, Send | q, m > do:
    trigger < pl, Send | q, (m, seq) >
    seq := seq + 1

Upon Event < pl, Deliver | p, (m, sn) > do:
    pending := pending ∪ {(m, sn, p)}

Upon Event ∃ (m, sn, p) ∈ pending : sn = next_deliv_seq do:
    trigger < fifo, Deliver | p, m >
    pending := pending \ {(m, sn, p)}
    next_deliv_seq := next_deliv_seq + 1
```

The two counters belong to one link, that is, to one pair of sender and receiver: `seq` numbers the messages sent to $q$, and `next_deliv_seq` counts the messages delivered from $p$. A process that talks to several peers keeps one pair of counters per peer.

### How does the FIFO algorithm operate on a line-by-line basis?

- `Upon Event < fifo, Init > do`: initializes the local state.
  - `pending := ∅`: a set that buffers the messages received out of order from the underlying perfect link. Each element of `pending` is a tuple $(m, \mathit{sn}, p)$ made of the payload $m$, the sequence number $\mathit{sn}$, and the identifier of the source $p$.
  - `seq := 0`: a local integer counter kept by the sender to assign strictly increasing sequence numbers to outgoing messages.
  - `next_deliv_seq := 0`: a local integer counter kept by the receiver: the sequence number of the next message to be delivered to the upper layer.
- `Upon Event < fifo, Send | q, m > do`: invoked when the upper layer asks to send the payload $m$ to the destination $q$.
  - `trigger < pl, Send | q, (m, seq) >`: packs the payload $m$ together with the current sequence number `seq` into a tuple $(m, \mathit{seq})$ and hands it to the underlying perfect link `pl`.
  - `seq := seq + 1`: increments the local sequence counter for the next outgoing message.
- `Upon Event < pl, Deliver | p, (m, sn) > do`: invoked when the underlying perfect link delivers a tuple $(m, \mathit{sn})$ sent by process $p$.
  - `pending := pending ∪ {(m, sn, p)}`: inserts the received tuple $(m, \mathit{sn}, p)$ into the set `pending`, without delivering it to the upper layer yet.
- `Upon Event ∃ (m, sn, p) ∈ pending : sn = next_deliv_seq do`: a handler guarded by a condition, which fires whenever a message in `pending` has the expected sequence number `next_deliv_seq`.
  - `trigger < fifo, Deliver | p, m >`: delivers the payload $m$ to the upper layer, in FIFO order.
  - `pending := pending \ {(m, sn, p)}`: removes the delivered tuple from the set `pending`.
  - `next_deliv_seq := next_deliv_seq + 1`: increments the expected sequence number by 1.

### Why is handler atomicity strictly required in the FIFO algorithm?

Atomicity guarantees that an event handler runs to completion without interleaving with other local handlers. If the send handler `upon event < fifo, Send | q, m >` were not atomic, two concurrent requests to send messages $m_A$ and $m_B$ could both read the same value of `seq` (e.g., $\mathit{seq} = 0$) before either of them incremented it. As a result, $m_A$ and $m_B$ would both be sent with the same sequence number, as $(m_A, 0)$ and $(m_B, 0)$, causing a collision at the receiver and breaking the delivery order.

### How long can a message wait in the pending set?

A message $(m, \mathit{sn}, p)$ can remain in the set `pending` for an unbounded (but finite) amount of time. If the message $m_1$ with sequence number $\mathit{sn} = 1$ arrives at process $q$ before the message $m_0$ with sequence number $\mathit{sn} = 0$ (the perfect link does not preserve the order), $m_1$ is buffered in `pending`. The condition $\mathit{sn} = \mathit{next\_deliv\_seq}$ remains false for $m_1$ until $m_0$ arrives. Once $m_0$ is delivered and `next_deliv_seq` goes from 0 to 1, the condition immediately unlocks the delivery of $m_1$.

### What is the formal proof of correctness for the FIFO delivery order property?

The three properties of the perfect link hold directly, because the algorithm uses a perfect link. The FIFO property is proved by contradiction. Suppose the algorithm violates it: then there exists an execution in which a destination process $q$ delivers a message $m'$ with sequence number $\mathit{sn}'$ before delivering a message $m$ with sequence number $\mathit{sn}$, even though the sender $p$ sent $m$ before $m'$.

1. Because the sender $p$ sent $m$ before $m'$, and sequence numbers are incremented by $\mathit{seq} := \mathit{seq} + 1$ inside an atomic handler, it follows that: $$\mathit{sn} < \mathit{sn}'$$
2. Let $t$ be the time at which process $q$ delivers $m'$, and $t'$ the time at which $q$ delivers $m$. By the assumption of the contradiction: $$t < t'$$
3. According to the condition of the delivery handler, a message with sequence number $\mathit{sn}'$ can only be delivered when: $$\mathit{next\_deliv\_seq} = \mathit{sn}'$$
4. Furthermore, `next_deliv_seq` is initialized to $0$ and is modified only by the statement `next_deliv_seq := next_deliv_seq + 1`, inside an atomic handler. Thus, `next_deliv_seq` is a counter that grows by exactly one unit at each delivery.
5. For `next_deliv_seq` to reach $\mathit{sn}'$ at time $t$, it must have taken before every integer value from $0$ up to $\mathit{sn}' - 1$.
6. Since $\mathit{sn} < \mathit{sn}'$, there was some earlier time $t_{\mathit{prev}} < t$ at which: $$\mathit{next\_deliv\_seq} = \mathit{sn}$$
7. The counter moved past the value $\mathit{sn}$ only by executing the delivery handler, and the only message of $p$ with sequence number $\mathit{sn}$ is $m$. Hence process $q$ delivered $m$ at time $t_{\mathit{prev}}$ and then incremented `next_deliv_seq`.
8. This means that $q$ delivered $m$ at time $t_{\mathit{prev}} < t$, contradicting the initial assumption that $m$ was delivered at time $t' > t$, after $m'$. Therefore, the FIFO delivery order property holds. $\blacksquare$

## Causality and Lamport's happened-before relation

### Why are physical clocks not enough to order events?

Physical clock synchronization algorithms try to make distributed clocks agree on a common value, but they rest on an estimate of the transmission delay, which in many systems is hard to obtain with good precision, and which is not available at all in an asynchronous system. For many applications, moreover, it is not important *when* things happened but *in which order* they happened. The goal is therefore a way of timestamping events that follows the intuitive notion of causality, without using physical time.

### Why is FIFO ordering insufficient to prevent causal misinterpretation in distributed applications?

FIFO ordering only preserves the order along a single point-to-point link between one sender and one receiver. It gives no guarantee across several senders, or along a conversation that involves more than two processes.

Consider the example of a distributed chat used in a mission-critical workplace by four processes: Alice ($p_A$), Mike ($p_M$), Bob's supervisor ($p_S$), and Bob ($p_B$). The chat is distributed in order to have no central point of failure, and the model is asynchronous because the chat has to work even when the network loses synchrony.

1. Alice ($p_A$) asks the group: **"What should we do if the price of Apple drops?"** (message $m_1$).
2. Mike ($p_M$) receives $m_1$ and replies: **"If Apple drops, sell Apple stock and buy Amazon stock."** (message $m_2$).
3. Alice ($p_A$) then asks a follow-up question: **"Who will do it?"** (message $m_3$).
4. Bob's supervisor ($p_S$) receives $m_3$ and posts: **"Bob will do it."** (message $m_4$).

Because the system is asynchronous and messages travel over independent links, network delays reorder the deliveries at Bob's node ($p_B$). Suppose Bob receives $m_2$ ("sell Apple, buy Amazon") immediately followed by $m_4$ ("Bob will do it"), while Alice's messages, starting with the question $m_1$ ("What should we do if..."), are delayed in transit.

From Bob's local view, the conversation looks like an unconditional order of his supervisor to make the trade immediately. Bob makes the trade, suffering a financial loss, before Alice's message $m_1$, which gives the context, finally arrives. This happens even if all the channels are FIFO links: FIFO order is fully preserved on each of the links $p_A \to p_B$, $p_M \to p_B$, and $p_S \to p_B$. FIFO links cannot prevent this anomaly, because $m_2$ and $m_4$ come from different senders. When Bob receives the message of Mike, he should know that there is something that causally generated it. To prevent such disasters, we need an ordering abstraction based on causal precedence.

### How is Lamport's happened-before relation formally defined?

Leslie Lamport (1978) formalized causal precedence in distributed systems through the happened-before relation, denoted by $\to$. Given the set $E$ of the events of the system, the relation $\to \subseteq E \times E$ is the smallest relation satisfying three rules:

- **Local ordering (rule 1):** if the events $e_i$ and $e_j$ occur in the same process $p_k$, and $e_i$ occurs before $e_j$ in the sequential execution of $p_k$, then: $$e_i \to e_j \quad \left(\text{or } e_i \to_k e_j\right)$$
- **Send-receive ordering (rule 2):** if the event $e_i$ is the sending ($\text{Send}$) of a message $m$ by process $p_a$, and the event $e_j$ is the receipt ($\text{Deliver}$) of the same message $m$ by process $p_b$, then: $$e_i \to e_j$$
- **Transitivity (rule 3):** if $e_i \to e_j$ and $e_j \to e_k$, then: $$e_i \to e_k$$

The relation obtained in this way is a strict partial order on the events (the set of events is a poset).

### What is concurrency in the context of the happened-before relation?

Two distinct events $e_i$ and $e_j$ are concurrent, written $e_i \parallel e_j$, if neither of them causally precedes the other: $$e_i \parallel e_j \iff \neg(e_i \to e_j) \land \neg(e_j \to e_i)$$ Hence, for any two distinct events of an execution, exactly one of the following holds: $e_i \to e_j$, $e_j \to e_i$, or $e_i \parallel e_j$. Concurrent events are independent actions: no information available at $e_i$ has reached $e_j$, and vice versa. In an asynchronous execution, concurrent events can occur in any relative order in physical time without changing the outcome of the computation.

## Lamport scalar logical clocks

### What are Lamport scalar logical clocks and what are their rules?

A Lamport scalar logical clock is a function $L: E \to \mathbb{N}$ that assigns an integer timestamp to every event of the system. It is a monotonically increasing software counter, unrelated to the physical clock, and it satisfies the clock consistency condition: $$\forall e, e' \in E : e \to e' \implies L(e) < L(e')$$

Each process $p_i$ maintains a local integer counter $L_i$, initially $0$. The algorithm has two simple rules:

- **Local / send event rule:** before executing a local event or sending a message, process $p_i$ increments its local clock: $$L_i := L_i + 1$$ When sending a message $m$, process $p_i$ attaches its updated timestamp $L_i$ to it: $(m, L_i)$.
- **Receive event rule:** upon receiving a message $m$ with attached timestamp $L_m$, process $p_i$ sets its local clock to the maximum of its current value and $L_m$, and then increments the result by $1$ before timestamping the receive event: $$L_i := \max(L_i, L_m) + 1$$

The first rule makes the timestamp grow by one with respect to the previous event of the same process; the second makes the timestamp of a receive event grow by at least one with respect to the corresponding send event. Together they guarantee the clock consistency condition along every causal path.

### Does $L(e) < L(e')$ imply that $e \to e'$?

No. Lamport scalar clocks only provide an implication in one direction: $$e \to e' \implies L(e) < L(e')$$ The converse, $L(e) < L(e') \implies e \to e'$, does **not** hold. If $L(e) < L(e')$, the events $e$ and $e'$ may be causally related ($e \to e'$) or concurrent ($e \parallel e'$); two concurrent events may even have the same timestamp. Scalar clocks squeeze the whole execution into a single numeric scale, losing the information about concurrency: by looking at scalar timestamps alone it is not possible to tell whether two events are concurrent or related by happened-before. To obtain the double implication that characterizes causality completely, vector clocks are required.

## Mattern-Fidge vector clocks

### What are Mattern-Fidge vector clocks and how do they capture full causality?

Vector clocks, independently proposed by Friedemann Mattern and Colin Fidge at the end of the 1980s, extend scalar clocks to an array of $n$ logical counters, where $n = |\Pi|$ is the fixed number of processes of the system.

Each process $p_i$ maintains a local vector clock $V_i[1 \dots n]$, where the entry $V_i[j]$ is what $p_i$ knows about the number of events that have occurred at process $p_j$.

### How is a vector clock conceptualized as a full event-history structure?

To understand why vector clocks work, consider an intermediate, abstract data structure in which each process $p_i$ maintains an array of event histories $\text{Hist}_i[1 \dots n]$. The idea is that the timestamp of an event is no longer a single number, but the history of the events that happened before it, the event itself included.

- $\text{Hist}_i[i]$ contains the sequence of all the local events generated by $p_i$.
- $\text{Hist}_i[j]$ (for $j \ne i$) contains the events generated by process $p_j$ that have causally flowed to $p_i$ through message exchanges.

When $p_i$ generates a local event $e$, it appends $e$ to $\text{Hist}_i[i]$. When $p_i$ sends a message, it attaches its entire array of histories $\text{Hist}_i$. Upon receiving $\text{Hist}_m$, process $p_i$ updates its knowledge by taking, for each entry, the newer of the two histories, that is, their union: $$\text{Hist}_i[j] := \text{Hist}_i[j] \cup \text{Hist}_m[j] \quad \forall j \in \{1 \dots n\}$$

With these timestamps an event $e'$ causally follows an event $e$ exactly when the histories of $e'$ contain the histories of $e$: if the timestamp of $e'$ contains $e$, there is a causal path from $e$ to $e'$.

### Why can full event histories be collapsed into a simple array of integers $V_i[1 \dots n]$?

In any execution, process $p_j$ generates its local events in a strict, sequential chain: $\langle e_j^1, e_j^2, e_j^3, \dots \rangle$. Process $p_j$ is the only process of the system that can append new events to its own history. Consequently, the history of $p_j$ known by any process $p_i$ is always a prefix of the local chain of events of $p_j$: $\{e_j^1, e_j^2, \dots, e_j^k\}$. Because a prefix of a sequential chain is uniquely identified by its length $k$, storing the whole set of events $\{e_j^1, \dots, e_j^k\}$ is redundant. Storing the single integer $V_i[j] = k$ preserves all the causal information: one history is a proper prefix of another exactly when it is shorter.

### What are the rules of Mattern-Fidge vector clocks?

1. **Initialization:** at system startup, every process $p_i$ sets all the entries of its vector clock to zero: $$V_i[j] := 0 \quad \forall j \in \{1 \dots n\}$$
2. **Local / send event rule:** before process $p_i$ executes a local event or sends a message, it increments its own component of its local vector: $$V_i[i] := V_i[i] + 1$$ When sending a message $m$, $p_i$ attaches a copy of its updated vector $V_i$ to it: $(m, V_i)$.
3. **Receive event rule:** upon receiving a message $m$ carrying the vector timestamp $V_m$, process $p_i$ updates its local vector clock by taking the component-wise maximum, and then increments its own component: $$V_i[j] := \max(V_i[j], V_m[j]) \quad \forall j \in \{1 \dots n\}$$ $$V_i[i] := V_i[i] + 1$$

Thus $V_i[i]$ is the number of events produced by $p_i$, and $V_i[j]$, with $j \ne i$, is the number of events generated by $p_j$ that $p_i$ knows about.

### How are vector timestamps formally compared to establish causality or concurrency?

Given two vector timestamps $V$ and $V'$ of size $n$:

- **Vector equality** ($V = V'$): $$V = V' \iff \forall j \in \{1 \dots n\} : V[j] = V'[j]$$
- **Vector less than or equal to** ($V \le V'$): $$V \le V' \iff \forall j \in \{1 \dots n\} : V[j] \le V'[j]$$
- **Strict vector precedence** ($V < V'$): $$V < V' \iff (V \le V') \land (V \ne V')$$
- **Concurrency** ($V \parallel V'$): $$V \parallel V' \iff \neg(V \le V') \land \neg(V' \le V)$$

With these comparison operators, vector clocks achieve the double implication that characterizes causal precedence exactly: $$e \to e' \iff V(e) < V(e')$$ $$e \parallel e' \iff V(e) \parallel V(e')$$

The two mechanisms of logical time are used to solve different problems: scalar timestamps are the tool of Lamport's mutual exclusion algorithm, vector timestamps that of causal broadcast.

## Exercises and concurrency analysis

### How do we analyze vector clocks and identify concurrent events in an execution?

Consider an asynchronous execution with four processes $\Pi = \{p_1, p_2, p_3, p_4\}$. Let us evaluate some pairs of events using their vector timestamps $V(e) = [V[1], V[2], V[3], V[4]]$:

- **Example 1:** compare the event $e_A$ on $p_1$, with timestamp $V(e_A) = [1, 2, 0, 0]$, and the event $e_B$ on $p_3$, with timestamp $V(e_B) = [3, 4, 4, 1]$.
  - Check $V(e_A) \le V(e_B)$ component by component: $1 \le 3$, $2 \le 4$, $0 \le 4$ and $0 \le 1$ are all true.
  - Since $V(e_A) \le V(e_B)$ and $V(e_A) \ne V(e_B)$, we conclude $V(e_A) < V(e_B)$, which proves $e_A \to e_B$.
- **Example 2:** compare the event $e_C$ on $p_2$, with timestamp $V(e_C) = [2, 1, 0, 0]$, and the event $e_D$ on $p_3$, with timestamp $V(e_D) = [0, 0, 2, 0]$.
  - Component 1: $2 > 0$ ($V(e_C)$ is greater).
  - Component 3: $0 < 2$ ($V(e_D)$ is greater).
  - Because neither vector dominates the other on all components ($\neg(V(e_C) \le V(e_D))$ and $\neg(V(e_D) \le V(e_C))$), we have $V(e_C) \parallel V(e_D)$, which proves that the events $e_C$ and $e_D$ are concurrent.

### What is the detailed breakdown of the exam exercise on sniffing vector clocks?

**Problem statement:** consider an asynchronous message-passing system of four processes $\Pi = \{p_1, p_2, p_3, p_4\}$ that communicate over point-to-point links and use vector clocks $V[1 \dots 4]$, incremented before each send. You attach a network sniffer to the network card of process $p_1$ and observe the following messages leaving and entering it:

1. At time $t_0$, a packet **leaves** the network card of $p_1$ carrying the vector timestamp $V_{\mathit{out}} = [1, 0, 0, 0]$.
2. At time $t_5$, a packet **enters** the network card of $p_1$ carrying the vector timestamp $V_{\mathit{in}} = [1, 2, 3, 1]$.

**Question 1:** draw an execution that justifies the observed vector clocks. Is such an execution unique?

**Analysis and step-by-step construction:**

- **Outgoing packet** ($V_{\mathit{out}} = [1, 0, 0, 0]$): process $p_1$ starts from $[0,0,0,0]$. Before sending its first message, $p_1$ increments its own component, $V_1[1] := 1$. It attaches $[1,0,0,0]$ to the outgoing packet and sends it.
- **Incoming packet** ($V_{\mathit{in}} = [1, 2, 3, 1]$): the timestamp $[1,2,3,1]$ read on the wire is the vector clock of the sending process at the moment the message was sent. Its components say that:
  - $V[1] = 1$: the sender knows about the first event of $p_1$ (the outgoing message with $V_{\mathit{out}} = [1,0,0,0]$).
  - $V[2] = 2$: process $p_2$ executed 2 events in the causal past of this message.
  - $V[3] = 3$: process $p_3$ executed 3 events in the causal past of this message.
  - $V[4] = 1$: process $p_4$ executed 1 event in the causal past of this message.

**Constructing a valid causal flow:**

- $p_1$ sends $m_1$, with timestamp $[1,0,0,0]$, to $p_2$.
- $p_2$ receives $m_1$, updating its clock to $[1,1,0,0]$, then sends a message to $p_3$, incrementing $V_2[2]$: the message carries $[1,2,0,0]$.
- $p_4$ sends a message $m_2$ to $p_3$: this is its only event, so the message carries $[0,0,0,1]$.
- $p_3$ receives the message of $p_2$, updating its clock to $[1,2,1,0]$, and then the message of $p_4$, reaching $[1,2,2,1]$. Finally $p_3$ sends the message $m_3$ to $p_1$, incrementing $V_3[3]$ to $3$: the timestamp on the wire is $V_{\mathit{in}} = [1, 2, 3, 1]$.

### Is such an execution unique?

No, the execution is **not** unique. Different interleavings of the messages can produce identical vector timestamps. For example, exchanging the order in which $p_3$ receives the two concurrent messages $p_2 \to p_3$ and $p_4 \to p_3$ gives a different execution diagram that produces exactly the same vector timestamp $[1, 2, 3, 1]$ on the wire.

**Question 2:** is there a valid execution that justifies $V_{\mathit{in}} = [1, 2, 3, 1]$ and in which at least one process sends **no** message?

No, such an execution **cannot** exist.

**Proof:** assume for contradiction that there is a valid execution yielding $V_{\mathit{in}} = [1, 2, 3, 1]$ at $p_1$ in which some process $p_k$ sends no message.

1. Look at the entries of $V_{\mathit{in}} = [1, 2, 3, 1]$. All four components are strictly positive ($V_{\mathit{in}}[j] > 0$ for all $j \in \{1, 2, 3, 4\}$).
2. Process $p_1$ did send a message, the one observed with $V_{\mathit{out}}$, so $k \ne 1$. For $p_1$ to receive a vector timestamp with $V_{\mathit{in}}[k] > 0$, the information about the local events of $p_k$ must have causally flowed to $p_1$ through messages ($p_k \to \dots \to p_1$).
3. If $p_k$ sends no message, no information can leave $p_k$: no process $p_j \ne p_k$ can ever raise its component $V_j[k]$ above 0.
4. Thus, any message arriving at $p_1$ would carry $V[k] = 0$, contradicting the observed timestamp, in which $V_{\mathit{in}}[k] > 0$. Therefore, every process whose component is non-zero **must** have sent at least one message. $\blacksquare$
