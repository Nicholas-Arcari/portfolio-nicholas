## Synchrony models: asynchronous, synchronous, and eventually synchronous systems

### What is an asynchronous system?

An **asynchronous distributed system** is a system model characterized by the complete absence of global time and of upper bounds on communication delays or process execution speeds. Formally, an asynchronous system is defined by the following properties:

- **Unbounded message delays:** if a process $p_i$ sends a message $m$ to process $p_j$, the message will eventually be delivered, but there is no fixed upper bound $\Delta$ on the transmission delay. The delay can be arbitrarily large.
- **Unbounded execution speeds:** processes execute their local computational steps at unpredictable times, decided by an adversarial scheduler. There is no guarantee on the time elapsed between two consecutive steps of a process.
- **Absence of a global clock:** processes only have a local clock, which cannot be assumed to be synchronized with the clock of any other process in the network. A local clock can only be used to order the events that occur at that specific process.
- **Minimal fairness assumption:** the execution is assumed to be fair, meaning that every correct process executes steps infinitely often, and every message exchanged between correct processes is eventually delivered.

### What is a synchronous system?

A **synchronous distributed system** is the opposite end of the spectrum: it enforces known upper bounds on network delays and processing times. Formally, a synchronous system satisfies:

- **Bounded message delays:** there exists a known, fixed constant $\Delta > 0$ such that if a correct process $p_i$ sends a message $m$ to process $p_j$ at real time $t$, then $m$ is delivered by $p_j$ no later than time $t + \Delta$.
- **Synchronized clocks:** processes have access to local physical clocks that can be synchronized up to a known precision, that is, within a known maximum clock skew $\delta \ge 0$.
- **Bounded step execution and round structure:** local execution steps happen at predetermined intervals and take bounded time, so the execution can be organized in synchronized rounds. In each round $r$, every correct process receives all the messages sent to it in round $r-1$, executes a local state transition, and sends its messages for round $r$.

### What is an eventually synchronous system?

An **eventually synchronous system** (also called in the literature a **partially synchronous system**) is an intermediate model designed to capture the real behavior of networks like the Internet. In an eventually synchronous system, the network behaves asynchronously for arbitrary, unpredictable periods, during which message delays may exceed any predefined threshold, but it eventually stabilizes into a synchronous regime.

### What are the trade-offs between asynchronous and synchronous models?

The choice of the system model involves a fundamental trade-off between algorithmic power and real-world applicability:

- **Asynchronous model:**
  - **Negative aspect:** strong impossibility results apply. Most notably, the **Fischer-Lynch-Paterson (FLP) impossibility theorem** proves that deterministic consensus (and agreement problems in general) cannot be solved in an asynchronous system if even a single process may crash.
  - **Positive aspect:** maximum coverage and realism. An algorithm designed and proven correct under asynchronous assumptions works on virtually any real infrastructure, since it relies on no timing assumption.
- **Synchronous model:**
  - **Positive aspect:** maximum computational power. Almost all non-trivial distributed problems, including consensus, total order broadcast, and atomic commit, are solvable.
  - **Negative aspect:** restricted real-world coverage. Truly synchronous networks are rare and expensive to build: in practice they are custom-built local area networks (LANs) under direct engineering control. Public networks like the Internet are not synchronous, and even dedicated enterprise networks can experience unexpected asynchronous periods because of router crashes, congestion, or broadcast storms. To escape the asynchrony of the Internet, major cloud providers like Google deploy private, dedicated transoceanic fiber-optic cables between their data centers (e.g., between the US, the UK, and the Netherlands), to obtain predictable, bounded latency.

### How does the Internet illustrate partial synchrony in practice?

Under normal operating conditions, a network utility like `ping google.com` shows predictable round-trip times (RTT) well below a typical threshold (e.g., $50\text{ ms}$). However, because of transient congestion, link re-routing, or bufferbloat, the latency can abruptly jump to $700\text{ ms}$ or more, a 14-fold increase. An eventually synchronous model formalizes this "synchronous most of the time, but occasionally asynchronous" behavior.

### Why is it not reasonable to build a system where safety depends on synchrony?

Every distributed abstraction is specified by a set of **safety properties** ("bad things do not happen") and **liveness properties** ("good things eventually happen"). Suppose that an algorithm is designed so that a **safety property** depends on network delays remaining below a timing threshold $\Delta$ (e.g., assuming a maximum delay of $50\text{ ms}$):

- During an asynchronous period in which message delays exceed $\Delta$, the safety property is violated.
- For example, in a mutual exclusion abstraction, if process $p_0$ assumes that $p_1$ has released the critical section on the basis of a $50\text{ ms}$ timeout, but the message of $p_1$ is delayed by $700\text{ ms}$, both $p_0$ and $p_1$ are in the critical section at the same time.
- Because safety violations are irreversible (once a bad event occurs, no extension of the execution can undo it), the whole system enters an invalid, unrecoverable state. A design in which safety depends on synchrony assumptions is therefore fundamentally flawed in a partially synchronous network.

### Why can liveness depend on synchrony in an eventually synchronous model?

Unlike safety, **liveness properties** assert that a desirable outcome will occur **sooner or later**.

- During asynchronous periods in which delays exceed the threshold $\Delta$, an algorithm may temporarily stop making progress (e.g., processes wait).
- However, because the system eventually enters a synchronous phase in which delays fall below $\Delta$, the algorithm resumes and satisfies the liveness property.
- A temporary lack of progress during the asynchronous phases does not violate liveness, since liveness places no finite bound on when progress must occur. Algorithms like Paxos rely exactly on this separation: **safety holds unconditionally, even under asynchrony**, while **liveness is guaranteed whenever the network remains synchronous for a sufficiently long time**.

### What is the formal definition of the Global Stabilization Time ($T$)?

To model partial synchrony without exposing specific timing bounds in the proofs, the model introduces an unknown time $T$, called the **Global Stabilization Time (GST)**:

- The system is initially asynchronous: before time $T$ (during the interval $[0, T)$), message delays are unbounded and process execution speeds are arbitrary.
- There exist a time $T < \infty$, unknown to the processes, and a delay bound $\Delta > 0$ such that for all real times $t \ge T$, every message sent by a correct process at time $t$ is delivered by time $t + \Delta$: after $T$ the system is synchronous, and it stays synchronous forever.
- The time $T$ is purely a theoretical construct for the proofs: because $T$ is finite, any window of synchrony that an algorithm needs in order to make progress (e.g., $1\text{ hour}$ or $10\text{ hours}$ of stable bounded delays) is guaranteed to exist after $T$.

### What is the relationship between system executions across the three synchrony models?

Let $E_{\text{Sync}}$, $E_{\text{EvSync}}$, and $E_{\text{Async}}$ denote the sets of all valid executions of the synchronous, eventually synchronous, and asynchronous models, respectively. They are related by inclusion: $$E_{\text{Sync}} \subset E_{\text{EvSync}} \subset E_{\text{Async}}$$

- Every synchronous execution is a special case of an eventually synchronous execution in which $T = 0$.
- Every eventually synchronous execution is a valid asynchronous execution in which message delays happen to respect a bound after time $T$.
- An algorithm that is correct in all the executions of $E_{\text{Async}}$ is automatically correct in $E_{\text{EvSync}}$ and in $E_{\text{Sync}}$.

### What is the relationship between solvable problems across the three synchrony models?

Let $P_{\text{Async}}$, $P_{\text{EvSync}}$, and $P_{\text{Sync}}$ denote the sets of distributed problems solvable in each model. The relationship is inverted with respect to the sets of executions: $$P_{\text{Async}} \subset P_{\text{EvSync}} \subset P_{\text{Sync}}$$

- In the asynchronous model, the adversary has the largest set of executions to choose from in order to disrupt an algorithm, which restricts the solvable problems to a small set ($P_{\text{Async}}$).
- In the synchronous model, the constrained set of executions allows solving the largest class of problems ($P_{\text{Sync}}$), including deterministic consensus.
- In the eventually synchronous model ($P_{\text{EvSync}}$), virtually all the problems solvable in synchronous systems can be solved, with the sole restriction that no bound on the time needed to make progress can be guaranteed.

## Clock synchronization and physical hardware clocks

### Why do distributed systems need time and clock synchronization?

Distributed systems need synchronized clocks primarily to establish a consistent **ordering of events** across multiple spatially separated processes. Practical domains that require synchronized clocks include:

- **Air traffic control:** sequencing aircraft landings and takeoffs to prevent collisions.
- **Financial stock markets:** timestamping buy and sell orders to guarantee a fair execution order.
- **Network security and authentication:** preventing replay attacks in protocols (e.g., Kerberos) by checking the freshness of timestamps.
- **Data consistency and build systems:** avoiding double processing (e.g., the `make` utility inspects the modification timestamps of files to decide whether to recompile the source code).
- **Sensor networks and TDMA:** implementing Time Division Multiple Access (TDMA), which divides the access to the channel into non-overlapping time slots to avoid interference.

The naive way to order events is timestamping: each process attaches to each event a label read from its physical clock, so that the timestamps of all processes can be merged into a global history of the system. The rest of this lecture studies how well physical clocks can support this.

### How does time make system executions distinguishable?

In an asynchronous system without a global clock, two distinct executions can produce identical sequences of local events, which makes them indistinguishable to the processes. In a synchronous system with synchronized physical clocks, processes attach local timestamps $C_i(t)$ to outgoing messages. A receiving process that reads the timestamp $C_i(t) = 12{:}00$ instead of $C_i(t) = 14{:}00$ can immediately tell which of the two executions it is in, breaking the indistinguishability.

### How does a physical hardware clock work inside a computer?

At the hardware level, every computing device contains a physical clock based on a **quartz crystal oscillator**:

- Applying a voltage to a quartz crystal makes it oscillate at a stable, characteristic frequency, because of the piezoelectric effect.
- A hardware counter register, denoted $\mathrm{HT}_i(t)$ for process $p_i$, counts the ticks generated by the crystal oscillator since the system started.
- If a crystal oscillates at a nominal frequency of $f$ oscillations per second, counting $f$ ticks represents the passage of 1 second of real time: $$\text{Measured interval} = \frac{\Delta \mathrm{HT}_i}{f}$$

### How is a software clock defined relative to a hardware clock?

To align the raw hardware counter $\mathrm{HT}_i(t)$ with UTC (Coordinated Universal Time), that is, with real time $t$, the operating system implements a **software clock** $C_i(t)$ through a linear scaling: $$C_i(t) = \alpha \cdot \mathrm{HT}_i(t) + \beta$$ where:

- $\mathrm{HT}_i(t)$ is the reading of the hardware clock at real time $t$.
- $\alpha$ is a multiplicative scaling factor used to speed up ($\alpha > 1$) or slow down ($\alpha < 1$) the rate of the software clock.
- $\beta$ is an additive offset used to move the clock reading forward or backward. Synchronization algorithms (such as NTP) adjust $\alpha$ and $\beta$ over time, so both can be functions of time.

### What is clock skew?

The **clock skew** is the absolute difference between the readings of two software clocks $C_i$ and $C_j$ at the same real time $t$: $$\text{Skew}_{i,j}(t) = |C_i(t) - C_j(t)|$$ In a network of $n$ processes, the maximum global clock skew $\delta(t)$ at real time $t$ is defined as: $$\delta(t) = \max_{i,j \in \Pi} |C_i(t) - C_j(t)|$$

### What is clock drift rate?

**Clock drift** is the gradual misalignment of a clock from real time, caused by the fact that a physical quartz oscillator never ticks exactly at its nominal frequency. The rate at which a hardware clock $\mathrm{HT}_i(t)$ advances is its first derivative with respect to real time $t$, and its **drift rate** $\rho_i(t)$ is the deviation of this rate from 1: $$\rho_i(t) = \frac{d\,\mathrm{HT}_i(t)}{dt} - 1$$

- **Perfect clock:** $\frac{d\,\mathrm{HT}_i(t)}{dt} = 1$, that is, zero drift. One unit of hardware clock time corresponds to exactly one unit of real time (a $45^\circ$ line in a plot of clock time against real time).
- **Fast clock:** $\frac{d\,\mathrm{HT}_i(t)}{dt} > 1$. The clock ticks faster than real time (e.g., it measures $2\text{ hours}$ when only $1\text{ hour}$ of real time has elapsed).
- **Slow clock:** $\frac{d\,\mathrm{HT}_i(t)}{dt} < 1$. The clock ticks slower than real time (e.g., it measures $30\text{ minutes}$ when $1\text{ hour}$ of real time has elapsed).

For example, a drift rate of 2 microseconds per second means that the clock advances by 1 second plus 2 microseconds for every second of real time. Unlike the skew, which can be measured once and corrected, the drift makes the error accumulate over time: this is why clocks must be synchronized again and again.

### What causes physical clock drift to vary dynamically over time?

The drift rate is not constant: it changes continuously because of environmental and physical factors:

- **Temperature variations:** the oscillation frequency of a quartz crystal changes with the operating temperature. When a CPU is under a heavy computational load, its internal temperature rises above $40^\circ\text{C}$, shifting the frequency of the crystal. When the CPU cools down, the frequency shifts in the opposite direction.
- **Component aging:** quartz crystals degrade physically over years of operation, causing a progressive drift of the baseline frequency.

### What is the formal definition of a correct hardware clock?

Because no physical clock is perfectly accurate, the model defines a **correct hardware clock** by placing a symmetric bound $\rho > 0$ on its drift rate (the maximum drift rate declared by the manufacturer: about $10^{-5}$ for ordinary quartz clocks, which deviate by nearly one second in 11-12 days, and $10^{-7}$ to $10^{-8}$ for high-precision quartz clocks): $$1 - \rho \le \frac{d\,\mathrm{HT}_i(t)}{dt} \le 1 + \rho \quad \forall t$$ A hardware clock is correct if its rate never leaves the envelope $[1 - \rho, 1 + \rho]$. With a correct hardware clock, any real-time interval can be measured with a bounded error.

### How does clock skew accumulate over time between two correct clocks?

Even if two correct clocks $C_1$ and $C_2$ are perfectly synchronized at real time $t_0 = 0$, so that $|C_1(0) - C_2(0)| = 0$, their drift makes the skew accumulate over time. In the worst case:

- Clock $C_1$ is constantly fast at the maximum allowed rate: $\frac{dC_1}{dt} = 1 + \rho$.
- Clock $C_2$ is constantly slow at the minimum allowed rate: $\frac{dC_2}{dt} = 1 - \rho$.

After a real-time interval of length $\Delta t = t_1 - t_0$, the readings of the two clocks are: $$C_1(t_1) = (1 + \rho) \Delta t$$ $$C_2(t_1) = (1 - \rho) \Delta t$$ Subtracting $C_2(t_1)$ from $C_1(t_1)$ yields the maximum accumulated skew: $$\text{Skew}(t_1) = |C_1(t_1) - C_2(t_1)| = ((1 + \rho) - (1 - \rho)) \Delta t = 2 \rho \Delta t$$ To keep the clock skew below a target threshold $\delta_{\max}$, processes **must** run a clock re-synchronization protocol at intervals $\Delta t$ satisfying: $$\Delta t \le \frac{\delta_{\max}}{2\rho}$$

### What is the monotonicity property of software clocks?

A software clock $C_i(t)$ satisfies **monotonicity** if it is a strictly increasing function of real time $t$: $$t' > t \implies C_i(t') > C_i(t)$$ Equivalently, $\frac{dC_i(t)}{dt} > 0$ at all times. Monotonicity can be guaranteed by choosing suitable values of $\alpha$ and $\beta$.

### Why must software clocks never jump backward in time?

If a synchronization algorithm detects that the local clock $C_1$ reads $14{:}00$ while the reference clock $C_2$ reads $13{:}00$, setting $\beta = -1\text{ hour}$ forces $C_1$ back to $13{:}00$. This backward jump breaks the system:

- **Causality and event ordering collapse:** the events generated between $13{:}00$ and $14{:}00$ get the same timestamps as the new events generated after the reset, making it impossible to establish a causal or chronological order.
- **Security vulnerabilities:** the protections against replay attacks fail when timestamps overlap a time window that has already been recorded.
- **Build and log corruption:** software build systems (`make`) and database transaction logs fail when new operations appear with timestamps earlier than past operations.

### How can a fast clock be corrected without violating monotonicity?

To correct a fast clock without setting the time backward, the operating system slows the clock down instead of resetting it:

- The offset $\beta$ is kept constant, but the rate multiplier $\alpha$ is reduced below 1 ($\alpha < 1$).
- In practice, the kernel hides some of the interrupts of the hardware oscillator (e.g., discarding 1 tick out of every 2): while interrupts are hidden the local clock is not updated, so the number of interrupts to hide is the amount of time to lose divided by the interrupt period.
- This slows down the rate at which $C_i(t)$ advances, allowing real time $t$ (and the slower reference clocks) to "catch up" while $C_i(t)$ keeps advancing monotonically.

### Does daylight saving time affect computer clock synchronization?

No. Operating system kernels keep time internally as a continuous, monotonic count of seconds or milliseconds (e.g., Unix time: the seconds elapsed since January 1, 1970, 00:00:00 UTC). Daylight saving time (DST) only changes how time is displayed to humans: it is applied at the presentation layer and does not alter the underlying monotonic software clock $C_i(t)$.

## Clock synchronization algorithms

### What are UTC and internal and external synchronization?

**UTC** (Coordinated Universal Time) is the international standard at the base of every time measure. It is based on International Atomic Time, in which one second is the time a cesium atom needs for 9,192,631,770 state transitions: clocks based on atomic oscillators are the most accurate, with a drift rate of about $10^{-13}$. UTC signals are broadcast by shortwave radio stations (with an accuracy of about 1 ms) and by satellites (GPS, about 1 microsecond), and a computer equipped with a receiver can use them to synchronize its local clock with real time.

Let $D > 0$ be a synchronization bound. There are two notions of synchronization:

- **External synchronization:** the processes synchronize their clocks with an authoritative external source $S$ (a source of UTC). The clocks $C_i$ are externally synchronized in a time interval $I$ if $$|S(t) - C_i(t)| < D \quad \forall i \in \{1, 2, \dots, N\},\ \forall t \in I$$ and the clocks are said to be *accurate* within the bound $D$.
- **Internal synchronization:** the processes synchronize their clocks among themselves. The clocks are internally synchronized in a time interval $I$ if $$|C_i(t) - C_j(t)| < D \quad \forall i, j \in \{1, 2, \dots, N\},\ \forall t \in I$$ and the clocks are said to *agree* within the bound $D$.

Clocks that are internally synchronized are not necessarily externally synchronized: even though they agree with each other, they may drift collectively from the external source. Conversely, a set of processes externally synchronized within the bound $D$ is also internally synchronized within the bound $2D$, which follows directly from the two definitions.

### How does Cristian's algorithm work?

**Cristian's algorithm** is an external synchronization algorithm based on a time server $S$ that receives the signal of a UTC source. It relies on the measurement of the round-trip time (RTT) of the messages:

- A process $p$ asks the current time with a message $m_r$ and receives the time $t$ of the server in a message $m_t$.
- $p$ sets its clock to $t + T_{\mathit{round}}/2$, where $T_{\mathit{round}}$ is the round-trip time measured by $p$: the estimate assumes that the reply travelled for half of the round trip.

**Accuracy.** Let $\mathit{min}$ be the minimum transmission time of a message. The reply cannot have travelled for less than $\mathit{min}$, nor for more than $T_{\mathit{round}} - \mathit{min}$ (the request took at least $\mathit{min}$). In both extreme cases the error of the estimate $T_{\mathit{round}}/2$ has the same size, so the accuracy of the algorithm is $$\pm \left( \frac{T_{\mathit{round}}}{2} - \mathit{min} \right)$$

The algorithm also works, probabilistically, in an asynchronous system, but the synchronization is achieved only if the round-trip times are small with respect to the required accuracy. The time server is a single point of failure, so Cristian suggests using a group of synchronized time servers and asking several of them at the same time. Since servers may also be faulty or malicious, redundancy and authentication are needed.

### How does the Berkeley algorithm work?

The **Berkeley algorithm** (Gusella and Zatti, 1989) is an internal synchronization algorithm with a master-slave structure. It proceeds in steps:

1. **Measuring the differences:** the master $p_m$ sends a message with its timestamp $t_1$ to every process of the system, itself included. A process $p_i$ that receives it replies with its own timestamp $t_2$. When the master receives the reply it reads its local clock ($t_3$) and computes the difference $\Delta p_i$ between the clock of $p_i$ and its own.
2. **Computing the average:** the master computes the average $\mathit{avg}$ of all the $\Delta p_i$, without considering the faulty processes, that is, those whose clock differs from the clock of the master by more than a given threshold $\gamma$.
3. **Computing the corrections:** for each process, the faulty ones included, the master computes the correction $\mathit{adj}_{p_i} = \mathit{avg} - \Delta p_i$ and sends it.
4. **Applying the correction:** each process applies the correction it receives to its local clock. If the correction is negative, the process slows its clock down, since a clock cannot be set backward.

**Example.** The master reads 3:05, and the other clocks read 2:55 ($p_1$), 3:00 ($p_2$) and 3:25 ($p_3$). The differences are $\Delta p_m = 0$, $\Delta p_1 = -10$, $\Delta p_2 = -5$ and $\Delta p_3 = +20$ minutes: $p_3$ is too far from the master and is considered faulty. The average is $\mathit{avg} = (0 - 10 - 5)/3 = -5$, and the corrections are $-5$ for the master, $+5$ for $p_1$, $0$ for $p_2$ and $-25$ for $p_3$: all the clocks converge to 3:00.

The accuracy of the protocol depends on the maximum round-trip time: the master ignores the clock values whose round trip took longer than a maximum. If the master crashes, another master is elected. Discarding the values that differ too much from the others also makes the algorithm tolerant to processes that send wrong values.

### What is the Network Time Protocol (NTP)?

The **Network Time Protocol (NTP)** is the time service of the Internet: it synchronizes clients with UTC, and it is the external synchronization algorithm that ordinary computers use. It obtains reliability through redundant servers and redundant paths, and it is scalable thanks to a hierarchy: the primary servers are connected directly to UTC sources, the secondary servers are synchronized with the primary ones, and so on down to the lowest level, the computers of the users.

### What changes when the communication graph is not complete?

In an arbitrary graph, synchronization can follow a tree, in which a server imposes its clock on the nodes below it, or be fully distributed, with each node adjusting its clock according to its neighbors. Two measures of quality are distinguished:

- **Global skew:** the maximum possible skew between any two nodes of the graph.
- **Local skew:** the maximum possible skew between two neighbors.

## Recap of an exercise on links

### Can a perfect point-to-point link be implemented with finite memory over a fair-lossy channel?

**Theorem:** it is impossible to implement a perfect point-to-point link (guaranteeing reliable delivery and no duplication) over a fair-lossy link if processes have a finite memory, bounded by $K$ messages.

**Proof sketch:**

1. Suppose a process $p_i$ has a memory that holds at most $K$ messages.
2. The upper layer submits $K$ distinct messages $m_1, m_2, \dots, m_K$ to $p_i$.
3. To satisfy reliable delivery over a fair-lossy channel, $p_i$ must keep all $K$ messages in memory and retransmit them infinitely often.
4. Now suppose the upper layer submits the message $m_{K+1}$. Because the memory is bounded by $K$, $p_i$ must overwrite at least one previously stored message (e.g., $m_1$).
5. Once $m_1$ is removed from memory, $p_i$ stops retransmitting $m_1$.
6. Because a fair-lossy link can lose all the copies of a message that is sent only a finite number of times, all the transmissions of $m_1$ made before its removal may be lost.
7. Since $m_1$ is no longer retransmitted, process $p_j$ will never deliver $m_1$, violating reliable delivery. Thus, finite memory cannot guarantee the perfect link abstraction over lossy networks.
