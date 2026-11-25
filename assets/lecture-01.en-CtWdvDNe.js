const e=`## Course overview and learning objectives

### What will you learn in this course?

The primary objective of this course is to provide a rigorous, formal foundation for designing, modeling, and analyzing distributed protocols. Distributed computing requires a paradigm shift from traditional sequential or parallel computing due to the presence of independent failure modes and unpredictable communication delays.

The core competencies developed throughout this course include:

- **System modeling:** formally defining the underlying assumptions of a distributed environment, including process computational capabilities, communication topology, timing assumptions, and failure modes.
- **Problem dissection:** breaking complex distributed objectives into foundational building blocks and abstractions (e.g., distinguishing atomic broadcast from consensus or distributed registers).
- **Specification of abstractions:** defining formal, unambiguous properties (safety and liveness) that an abstract distributed component must satisfy.
- **Fault-tolerant protocol design:** constructing algorithms that fulfill the specified abstractions despite process crashes, arbitrary failures, and network delays.
- **Coordinating computational entities:** managing sets of autonomous entities that must cooperate to accomplish a common task without relying on a centralized coordinator or a global memory.

## Definitions and core concepts of distributed systems

### What is a distributed system?

To establish a comprehensive understanding, three complementary definitions of a distributed system are examined:

1. **Classical functional definition:** a distributed system is a set of spatially separated entities, each with its own computational power, that can communicate and coordinate with one another to achieve a common goal.
2. **Lamport's fault-centric definition:** Leslie Lamport famously defined a distributed system as "one in which the failure of a computer you didn't even know existed can render your own computer unusable". This highlights the inescapable dependency on remote components and the fundamental necessity of fault tolerance.
3. **Definition by archetypal examples:** systems such as the World Wide Web, clusters of workstations, networks of embedded systems (e.g., the redundant computers of an airplane), peer-to-peer (P2P) file-sharing networks, and blockchains and distributed ledgers exemplify distributed systems through their spatial separation, lack of central control, and shared operational objectives.

### What are the common points across all definitions of a distributed system?

Across all formal and empirical definitions, three foundational pillars emerge:

- **Set of entities:** the system consists of distinct computational units, which may be physical machines, virtual machines, or isolated software threads.
- **Spatial separation:** the entities are distributed, that is, spatially separated and independent, each in its own failure domain. Local computation is assumed to be free, whereas all interaction occurs strictly through communication channels.
- **Common goal and lack of central coordination:** the entities communicate, coordinate and share resources to solve a common problem (e.g., state replication, consensus, or resource allocation) through peer-to-peer interaction only, without any omniscient supervisor or global clock.

In this course, the primary focus is on **static networks of processes**, where the set of participating entities is fixed and known *a priori*, communicating via message passing over static communication links.

## Examples of distributed systems

### What are practical and emerging examples of distributed systems?

Beyond traditional client-server and cloud infrastructures, distributed systems encompass advanced hardware and physical abstractions:

- **P2P overlay networks:** systems like BitTorrent or Gnutella, where autonomous nodes share data without a dedicated infrastructure, handling continuous churn and unannounced node departures.
- **Programmable matter (MIT M-Blocks):** physical modular systems consisting of autonomous robotic cubes (M-Blocks). Each block has its own processing capability, can physically move, and communicates exclusively with its immediate spatial neighbors to dynamically change the collective geometric shape.
- **Particle swarms on a grid:** autonomous particles placed on a discrete grid that communicate only with neighboring nodes to organize into complex global formations (e.g., a regular hexagon) without global guidance.

## Local view and information staleness

### What do you know about the network at the beginning?

At initialization, an individual process $p_i$ has no global knowledge of the topology, of the state or of the progress of the other processes in the network. It only knows its own unique process identifier $i$ and its local interface (e.g., its local network buffers).

### What is the local view?

The **local view** of a process $p_i$ is the sum total of all the information $p_i$ has directly observed or received via incoming messages up to the current instant. Because information can only propagate through message exchange, a process's perception of the global state is inherently local and incomplete.

### What is the problem of waiting for communication?

Message transmission over physical networks is subject to non-zero propagation, queuing, and processing delays. Consequently:

- The local view is inherently **stale**: a message received at time $t$ reflects the state of the sender at some past time $t_{\\mathit{send}} < t$.
- A process cannot distinguish between a remote process that is executing extremely slowly and one that has crashed.
- The slower or more unpredictable the network communication is, the more outdated the local view becomes, imposing fundamental limits on which distributed problems can be solved.

## Fault tolerance and fundamental problems

### What is the consensus problem?

The **consensus problem** is a fundamental primitive in distributed computing. Given a set of processes where each process $p_i$ proposes an initial value $v_i \\in \\{0, 1\\}$ (e.g., $0 \\equiv \\text{abort}$, $1 \\equiv \\text{commit}$ for an atomic database transaction), all correct processes must irrevocably decide on a single common value $v \\in \\{0, 1\\}$ such that:

1. **Agreement:** no two correct processes decide on different values.
2. **Validity:** the decided value $v$ must have been proposed by at least one process.
3. **Termination:** every correct process eventually decides a value.

### Why does a single-message protocol fail in the Two Generals Problem?

Consider two generals, Alice ($p_0$) and Bob ($p_1$), located on separate hills overlooking an enemy fort. They must agree to simultaneously attack ($1$) or retreat ($0$). Communication is carried out via a foot messenger over an unreliable channel where messages can be intercepted or lost.

If $p_0$ sends a single message $m = \\text{"Attack at 10:00"}$ to $p_1$:

- $p_0$ cannot decide to attack immediately upon sending $m$, because $m$ might be intercepted, leaving $p_1$ uninformed.
- If $p_1$ receives $m$, $p_1$ cannot attack safely because $p_1$ knows that $p_0$ is unsure whether $m$ arrived. If $p_1$ attacks alone, $p_1$ faces defeat.

### Does adding an acknowledgment (ACK) solve the problem?

To mitigate the uncertainty of the first message, $p_1$ sends an acknowledgment $m_{\\mathit{ack}} = \\text{"ACK"}$ back to $p_0$.

- When $p_1$ sends $m_{\\mathit{ack}}$, $p_1$ does not know if $m_{\\mathit{ack}}$ will reach $p_0$.
- If $m_{\\mathit{ack}}$ is lost in transit, $p_0$ will not attack. Thus, if $p_1$ attacks upon sending $m_{\\mathit{ack}}$, $p_1$ risks attacking alone.
- Therefore, $p_1$ remains undecided until it receives an acknowledgment of the ACK ($m_{\\mathit{ack2}}$) from $p_0$.

### Does an ACK-of-ACK solve the problem?

If $p_0$ sends $m_{\\mathit{ack2}} = \\text{"ACK of ACK"}$, $p_0$ is now in the exact same state of uncertainty regarding $m_{\\mathit{ack2}}$ that $p_1$ was in regarding $m_{\\mathit{ack}}$: $p_0$ cannot attack until it receives $m_{\\mathit{ack3}}$ from $p_1$.

This leads to an infinite regression of required acknowledgments ($\\text{ACK} \\to \\text{ACK}^2 \\to \\text{ACK}^3 \\to \\dots$). By induction on the number of messages, **the Two Generals Problem cannot be solved deterministically over an unreliable channel**, even in an execution where no message is actually lost, because neither process can ever eliminate its uncertainty about the local view of the other.

### Can time help solve the Two Generals Problem?

Physical time cannot resolve this impossibility over an asynchronous network, because physical clocks are inherently imprecise and prone to drift. Without a global clock and without an upper bound on message transmission delays, a timeout cannot distinguish between a lost message and a message that is only very slow.

## Historical evolution and dependability milestones

### What is the history of dependability in distributed computing?

Dependability is the ability of a distributed system to deliver a service that can justifiably be trusted despite internal faults:

- **1978 (NASA SIFT project):** Software Implemented Fault Tolerance (SIFT) explored aircraft control architectures using redundant computers communicating over a shared bus, identifying fault-tolerant agreement as the key requirement to avoid a single point of failure.
- **1982 (Byzantine Generals Problem):** Leslie Lamport, Robert Shostak, and Marshall Pease formally defined the Byzantine Generals Problem, establishing bounds on fault tolerance ($n \\ge 3f + 1$ processes for unauthenticated messages).
- **1985 (FLP impossibility theorem):** Fischer, Lynch, and Paterson published the landmark FLP theorem, proving that **no deterministic algorithm can guarantee consensus in an asynchronous system in the presence of even a single crash failure** ($f \\ge 1$).
- **1996 (failure detectors):** Tushar Deepak Chandra and Sam Toueg introduced the abstraction of **unreliable failure detectors** ($\\mathcal{P}$, $\\diamond\\mathcal{P}$), decoupling timing and synchrony assumptions from algorithm design.
- **1999 (PBFT):** Miguel Castro and Barbara Liskov presented Practical Byzantine Fault Tolerance (PBFT), showing that replication tolerating Byzantine failures can be practical: a quadratic number of messages ($O(n^2)$) per request, with progress guaranteed under partial synchrony.

## Methodology: models, abstractions, and specifications

### What is distributed computing?

Distributed computing is fundamentally a fight against uncertainty, which has two sources:

1. **Asynchrony:** unpredictable message transmission delays and process execution speeds.
2. **Failures:** unpredictable process crashes, message losses, or malicious process behavior.

The sole instrument available to a process to combat these forces is its **local view**, constructed incrementally through message exchange.

### Why do we need formal models, abstractions, and specifications?

Developing distributed algorithms intuitively, without a formal framework, leads to subtle, unhandled edge cases and invalid correctness claims. The rigorous four-step methodology required is:

1. **Define a system model:** specify exact rules for processes, channels, and failure types.
2. **Formalize an abstraction:** define an abstract object or problem interface with unambiguous properties (safety and liveness).
3. **Design a distributed protocol:** construct the precise state transition logic that implements the specification.
4. **Provide a formal proof:** prove that the protocol satisfies all the properties of the specification in every valid execution.

## Real-world applications and the Tangaroa case study

### Why can we not trust blockchains or protocols not founded on formal algorithms?

In industry practice, ad-hoc implementations frequently fail due to a lack of formal verification:

- **The Tangaroa case study:** J.P. Morgan set out to build a corporate blockchain using **Tangaroa**, an open-source protocol advertised as a Byzantine fault-tolerant variant of Raft.
- **Snake oil warning:** the cryptographer Christian Cachin published an analysis ("Blockchains and Consensus Protocols: Snake Oil Warning") showing that Tangaroa failed to maintain safety in simple Byzantine scenarios: it originated as a student project and had never been proven correct.
- **Takeaway:** industrial-grade distributed systems (e.g., Google Chubby, Apache ZooKeeper, Kafka, and enterprise blockchains) must rely strictly on formally proven consensus and replication primitives.

## Module M1: system model and process formalism

### What is a system model?

A **system** consists of a static set $\\Pi$ of $n$ processes with unique, distinct identities: $$\\Pi = \\{p_0, p_1, p_2, \\dots, p_{n-1}\\}$$ The size $n = |\\Pi|$ is fixed and known to all processes from initialization.

### What is a communication graph?

Processes communicate by exchanging messages over a directed communication graph $G = (\\Pi, E)$, where $\\Pi$ is the set of processes (vertices) and $E \\subseteq \\Pi \\times \\Pi$ is the set of directed point-to-point communication links (edges). Unless stated otherwise, the communication graph $G$ is assumed to be **complete** (a clique), meaning every process $p_i$ can send messages directly to any process $p_j$.

### What is a process model?

Formally, a process $p_j \\in \\Pi$ is modeled as a (possibly infinite) **input/output automaton (state machine)** characterized by:

- A set $Q_j$ of internal states (the local memory and variables).
- A non-empty set $Q_j^{\\mathit{init}} \\subseteq Q_j$ of initial states.
- An input buffer $\\mathit{InBuf}_j$, modeled as a multiset containing the messages delivered to $p_j$ by the network but not yet processed.
- An output buffer $\\mathit{OutBuf}_j$, modeled as a multiset containing the in-flight messages generated by $p_j$, that is, sent but not yet delivered.

The state of a process is its internal memory together with the content of its two buffers.

### What is a message?

A **message** $m \\in \\mathcal{M}$ is represented as a tuple: $$m = \\langle \\text{sender}, \\text{receiver}, \\text{payload} \\rangle \\in \\Pi \\times \\Pi \\times \\mathcal{D}$$ where $\\mathcal{D}$ denotes the universe of valid data payloads.

### What happens when a process executes a local computational step?

A local computation step executed by process $p_j$ is defined by a deterministic state transition function $\\delta_j$. The process reads its current internal state $q_j \\in Q_j$ and a subset of the delivered messages in $\\mathit{InBuf}_j$, updates its internal state to $q_j'$ and appends new outgoing messages to $\\mathit{OutBuf}_j$: $$\\delta_j: Q_j \\times \\mathcal{P}(\\mathit{InBuf}_j) \\to Q_j \\times \\mathcal{P}(\\mathcal{M})$$

## Asynchronous execution model

### What is an asynchronous execution?

An **asynchronous execution** is characterized by the complete absence of timing bounds: message transmission delays and relative process execution rates are finite but completely arbitrary and unpredictable.

### What is a system configuration?

A **configuration** $C_t$ captures the instantaneous global state of the entire system at step $t$. It is a vector of $n$ components, one per process: $$C_t = \\langle C_t[0], C_t[1], \\dots, C_t[n-1] \\rangle$$ where each component $C_t[j]$ is the complete state of process $p_j$, its internal state along with its buffers: $$C_t[j] = (q_j, \\mathit{InBuf}_j, \\mathit{OutBuf}_j)$$

### When is an event enabled in a configuration?

Two fundamental types of events drive system transitions in an asynchronous model:

1. **Local execution step** $\\mathit{Exec}(i)$: process $p_i$ performs one step of its state machine. $\\mathit{Exec}(i)$ is **always enabled** in any configuration $C_t$.
2. **Message delivery** $\\mathit{Del}(m, i, j)$: moves message $m = \\langle i, j, \\text{payload} \\rangle$ from $\\mathit{OutBuf}_i$ to $\\mathit{InBuf}_j$. $\\mathit{Del}(m, i, j)$ is **enabled** in configuration $C_t$ if and only if $m \\in \\mathit{OutBuf}_i$ in $C_t[i]$.

### What is an execution sequence?

An **execution** $E$ is an infinite sequence that alternates configurations and events: $$E = (C_0, e_0, C_1, e_1, C_2, e_2, \\dots, C_t, e_t, C_{t+1}, \\dots)$$ such that for every $t \\ge 0$, event $e_t$ is enabled in configuration $C_t$, and $C_{t+1}$ is exactly the configuration obtained by applying $e_t$ to $C_t$.

### Who decides the events in an execution?

The event sequence $(e_0, e_1, e_2, \\dots)$ is chosen by an omniscient, worst-case **adversary (the scheduler)**. The adversary has full knowledge of the internal states of all processes and of the algorithm, and it schedules the enabled events trying to force the algorithm to violate its specification.

### What is a fair execution?

An execution $E$ is **fair** if every process $p_i$ executes an infinite number of local steps (the events $\\mathit{Exec}(i)$ never stop) and every message is eventually delivered: no message can be held back forever, so for each message $m$ sent from $p_x$ to $p_y$ the execution contains the event $\\mathit{Del}(m, x, y)$.

Only fair executions are considered in this course. In an unfair execution the adversary could simply never schedule a process, or never deliver its messages: this would break any non-trivial algorithm.

### What is the local view in an asynchronous execution?

The **local view** (or local execution) of process $p_i$ in an execution $E$, denoted $E|_{p_i}$, is the projection of $E$ on $p_i$: the sequence of the events of $E$ that directly involve $p_i$ (i.e., its local steps $\\mathit{Exec}(i)$, the messages sent by $p_i$, and the messages delivered to $p_i$).

### Why are two executions indistinguishable to a process?

If two distinct global executions $E_A$ and $E_B$ have the same projection on process $p_i$: $$E_A|_{p_i} = E_B|_{p_i}$$ then process $p_i$ **cannot distinguish** between $E_A$ and $E_B$. Consequently, $p_i$ performs exactly the same local state transitions and produces identical outputs in both executions.

A first consequence is a theorem: in the asynchronous model, no distributed algorithm is capable of reconstructing the execution of the system, that is, of establishing in which order, in real time, the events of different processes took place. More generally, indistinguishability arguments are the fundamental proof technique for lower bounds and impossibility results in distributed systems.

## Failure models: crash-stop vs. Byzantine

### What are the two main failure models?

Distributed protocols are evaluated under two main classes of process failures:

- **Crash-stop failure model:**
  - Formal event $\\mathit{Crash}(j)$: when $\\mathit{Crash}(j)$ occurs, process $p_j$ permanently ceases all local computations.
  - In all subsequent configurations $C_t$, $\\mathit{Exec}(j)$ is **disabled**.
  - Crash-stop is non-malicious: $p_j$ never deviates from its state machine before $\\mathit{Crash}(j)$.
- **Byzantine failure model:**
  - Formal event $\\mathit{Byz}(j)$: after it, process $p_j$ can deviate arbitrarily from its assigned algorithm, since its steps $\\mathit{Exec}(j)$ no longer follow its automaton.
  - It may send forged or conflicting messages, corrupt its local state, send different values to different peers, or collude with other Byzantine processes.
  - Byzantine algorithms assume an active adversary controlling up to $f$ processes, and need $n \\ge 3f + 1$ processes to achieve consensus.

A process that does not experience a failure in an execution is called **correct**; otherwise, it is **faulty**. No process knows in advance who is correct. The maximum number of processes that can fail in an execution is denoted by $f$ and is usually bounded (for instance, $f \\le n - 1$), whereas no assumption is ever made on *when* a failure happens.

## Formalization of message loss as an event

### How do we model the loss of a message as a formal event?

In a lossy asynchronous network, the loss of a message is formalized as a distinct system event $\\mathit{LossMsg}(m, i)$.

\`\`\` Event LossMsg(m, i)
Event: LossMsg(m, i)
Precondition:
  m ∈ OutBuf_i

Action:
  OutBuf_i := OutBuf_i \\ {m}
  InBuf_j remains unchanged (message is NOT added to recipient's buffer)
\`\`\`

Line-by-line explanation of \`LossMsg(m, i)\`:

- \`Event: LossMsg(m, i)\`: defines the event that represents the destruction of message $m$ sent by process $p_i$.
- \`Precondition: m ∈ OutBuf_i\`: the event is enabled in configuration $C_t$ if and only if message $m$ is currently present in the sender's output buffer $\\mathit{OutBuf}_i$.
- \`Action: OutBuf_i := OutBuf_i \\ {m}\`: when the event is executed, message $m$ is permanently removed from $\\mathit{OutBuf}_i$.
- \`InBuf_j remains unchanged\`: unlike $\\mathit{Del}(m, i, j)$, $\\mathit{LossMsg}(m, i)$ does not place $m$ into $\\mathit{InBuf}_j$, which captures the loss without making the state of the buffers inconsistent.

### Does losing a message repeatedly make an execution unfair?

If the adversary applies $\\mathit{LossMsg}$ to every message that $p_i$ sends to $p_j$, forever, then $p_i$ is permanently prevented from communicating with $p_j$. This is equivalent to partitioning the network, or to delaying a message forever as in an unfair execution, and it makes any non-trivial agreement problem unsolvable.

To keep problems solvable over lossy channels, the system model constrains the adversary with the **fair-loss** property of links (formalized in the next lecture): if a correct process $p_i$ sends a message $m$ to $p_j$ infinitely often, then $p_j$ delivers $m$ an infinite number of times.
`;export{e as default};
