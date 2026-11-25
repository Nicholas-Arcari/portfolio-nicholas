const e=`## Consensus in synchronous systems and the lower bound of f+1 rounds

### What is the round-based model of synchronous systems?

In a synchronous system the execution can be organized as a sequence of **rounds** ($\\text{Round}_1, \\text{Round}_2, \\dots, \\text{Round}_k$). In each round $\\text{Round}_k$:

- Every process $p_i \\in \\Pi$ sends its messages at the beginning of the round, to some or to all of the processes of the system $\\Pi$.
- Because the delays of the messages are bounded ($\\Delta$), all the messages sent at the beginning of $\\text{Round}_k$ arrive at their destinations before $\\text{Round}_k$ ends and $\\text{Round}_{k+1}$ begins.
- The only way in which a process $p_j$ can fail to receive in $\\text{Round}_k$ the message of a process $p_i$ is that $p_i$ crashes during that round. If $p_i$ crashes while it is sending, its message may reach an arbitrary subset $Q \\subset \\Pi$ of the processes, and the remaining processes $\\Pi \\setminus Q$ receive nothing from $p_i$ in that round.

In this model time is counted in rounds: the number of rounds of an algorithm is its step complexity.

### What is a full information protocol (FIP), and why is it used to show lower bounds?

A **full information protocol (FIP)** is an algorithm in which nothing is ever thrown away or summarized:

- At every round $\\text{Round}_k$, every process $p_i$ sends to all the processes its entire memory: its input value and everything it has received from the other processes in the previous rounds.
- Since the algorithms considered are deterministic, a process that knows the input and the memory of another process can simulate it, and work out what it will do. A process that runs a FIP therefore knows everything that can be known in that execution. If a problem (such as consensus) cannot be solved in $R$ rounds with a FIP, then it cannot be solved in $R$ rounds by **any** algorithm, because any other algorithm sends only a part of that information.

### Why can consensus not be solved in fewer than $f+1$ rounds in a synchronous system with at most $f$ crashes?

**In a synchronous system of $n$ processes in which up to $f$ processes may crash, every deterministic consensus algorithm has an execution that needs at least $f+1$ rounds to terminate.**

The idea of the proof can be seen on a full information protocol that decides with a deterministic function of the values it knows, such as $\\min()$ or $\\max()$:

- **No failures ($f = 0$): 1 round.**
  - If no process crashes, in $\\text{Round}_1$ every process $p_i$ sends its input value $v_i \\in \\{0, 1\\}$ to all the others.
  - At the end of $\\text{Round}_1$ no message has been lost, so every process holds the same vector of input values $V = \\langle v_1, v_2, \\dots, v_n \\rangle$.
  - Since every process holds the same $V$, a deterministic function such as $v_{\\text{decide}} = \\min(V)$ makes all of them decide the same value. One round is necessary and sufficient.
- **One failure ($f = 1$): 2 rounds.**
  - Suppose that at most one process may crash, and consider the inputs $V = \\langle 1, 1, 0 \\rangle$ of the processes $\\{p_1, p_2, p_3\\}$: $p_3$ is the only one with the value $0$.
  - Suppose that $p_3$ crashes during $\\text{Round}_1$, after sending its message (with $0$) to $p_2$ only.
  - At the end of $\\text{Round}_1$:
    - Process $p_1$ has received the messages of $p_1$ and $p_2$ only (both with $1$), so its view is $V_1 = \\{1\\}$. If it decided now with $\\min()$, it would decide $\\min(\\{1\\}) = 1$.
    - Process $p_2$ has received the messages of $p_1$, $p_2$ and $p_3$, so its view is $V_2 = \\{1, 0\\}$. If it decided now with $\\min()$, it would decide $\\min(\\{1, 0\\}) = 0$.
  - If both decided in $\\text{Round}_1$, $p_1$ would decide $1$ and $p_2$ would decide $0$, which violates the **agreement** property of consensus.
  - A second round is therefore necessary. In $\\text{Round}_2$ the correct process $p_2$ sends its whole memory, which includes the value $0$ of $p_3$, to $p_1$: now $p_1$ also knows $0$ and decides $0$, like $p_2$. With $f = 1$, $1 + 1 = 2$ rounds are needed.
  - Deciding with $\\max()$ would not help: here the two processes would agree, but it is enough to change the inputs (the process that crashes holds the only $1$) to obtain the same disagreement. For every deterministic function there is an input that causes it.
- **The general case ($f$ failures): $f+1$ rounds.**
  - The adversary builds a chain of failures, crashing exactly one process in each of $f$ consecutive rounds.
  - In $\\text{Round}_1$, a process $p_{\\text{crash}, 1}$, the only one that holds a certain input value, crashes after sending its memory to one process only, $p_{\\text{crash}, 2}$.
  - In $\\text{Round}_2$, $p_{\\text{crash}, 2}$ crashes after relaying that information to one process only, $p_{\\text{crash}, 3}$.
  - The chain goes on until $\\text{Round}_f$, in which $p_{\\text{crash}, f}$ crashes after delivering the information to a single process $p_{\\text{survivor}}$.
  - During the rounds from $1$ to $f$, at the end of each round one process knows more than the others: the views of the processes are different, and a decision would violate agreement.
  - Only in $\\text{Round}_{f+1}$, when no more crashes are possible (all the $f$ failures have been used), $p_{\\text{survivor}}$ certainly sends what it knows to all the other correct processes, and the views become equal.
  - One crash per round is the worst case. Two crashes in the same round would waste a failure: one is enough to make the views different, and the chain would end one round earlier.

$$\\text{minimum number of rounds for consensus} = f + 1$$

The algorithms of the previous lectures have executions of exactly this kind: in the consensus algorithms with leaders, $f$ leaders can crash one after the other, and only the leader number $f+1$ is certainly correct.

This is the intuition, shown for the algorithms that decide with the minimum or the maximum. The complete proof, which holds for any algorithm, is longer: it has to show that the same construction works whatever the decision function is. It can be found in the textbooks on distributed computing (Attiya and Welch; Lynch).

## The FLP impossibility result in asynchronous systems

### What does the Fischer-Lynch-Paterson (FLP) impossibility result state about consensus in asynchronous systems?

Proved by Fischer, Lynch and Paterson in 1985, the **FLP impossibility result** is one of the fundamental results of distributed computing:

**In an asynchronous message-passing system, no deterministic algorithm solves consensus if even a single process may crash ($f = 1$): for any algorithm there is an execution in which either safety (validity and agreement) or liveness (termination) is violated.**

The proof is not part of the course. What matters is the statement, and its consequence: an algorithm that never violates safety must have an execution in which some process waits forever without deciding.

### Why is consensus unsolvable in an asynchronous system even if only one process ($f = 1$) may crash?

In an asynchronous system:

- The delays of the messages are unbounded and unpredictable.
- There is no global clock, and no way to distinguish a process that is very slow, or whose messages are delayed, from a process that has crashed.
- If a process $p_i$ does not answer, an algorithm cannot wait for it forever: if $p_i$ has crashed, the algorithm would block, violating **termination** (liveness).
- On the other hand, if the algorithm goes on and decides without waiting for $p_i$, it may decide a value that contradicts what $p_i$ knows or has already decided, violating **agreement** or **validity** (safety), in case $p_i$ was only slow.
- The FLP proof turns this dilemma into a theorem: for any deterministic algorithm that is safe, the scheduling of the messages can be chosen so that the algorithm stays forever in a state from which both decisions, $0$ and $1$, are still possible, and never decides.

Consensus is therefore harder than the problems seen so far. In an asynchronous system uniform reliable broadcast and the atomic register tolerate a minority of crashes, and regular reliable broadcast tolerates any number of them; consensus does not tolerate even one.

### How does the solvability of consensus compare across system models and failure assumptions?

| System model | Failure detector and assumptions | Crashes tolerated ($f$) | Consensus |
|---|---|---|---|
| Synchronous | Perfect failure detector ($\\mathcal{P}$), bounded delays ($\\Delta$) | $f < n$ (any $f$) | Solvable (it needs $f+1$ rounds) |
| Asynchronous | Fail-silent, no failure detector | $f = 0$ only | Unsolvable for $f \\ge 1$ (FLP) |
| Asynchronous | Fail-silent, majority of correct processes | $f < n/2$ | Unsolvable for consensus; uniform reliable broadcast and $(1,N)$ atomic registers are solvable |
| Eventually synchronous | Eventually perfect failure detector ($\\diamond\\mathcal{P}$) or leader election ($\\Omega$) | $f < n/2$ (majority of correct processes) | Solvable (for example with Paxos) |

## Paxos: consensus in eventually synchronous systems

### How does Paxos get around the FLP impossibility in eventually synchronous systems?

The **Paxos** algorithm was devised by Leslie Lamport in 1989, while he was trying to prove that a fault-tolerant file system could not work as its builders claimed. It was described in "The Part-Time Parliament" and, since that paper was found hard to read, explained again in "Paxos Made Simple" (2001), whose abstract is a single sentence: "The Paxos algorithm, when presented in plain English, is very simple". Paxos gets around FLP by separating safety from liveness, in an eventually synchronous system with crash failures and a majority of correct processes:

1. **Safety is always guaranteed.** Paxos guarantees **validity**, **agreement** and **integrity** whatever the delays of the messages are, even in the periods in which the system behaves asynchronously.
2. **Liveness is guaranteed only eventually.** Paxos guarantees **termination** only when the network behaves well for long enough: after the global stabilization time ($\\mathrm{GST}$), when the delays stay below a bound $\\Delta$ for the time needed to complete the exchange of messages with a majority of the processes.

This is the only possible division: in an eventually synchronous system the properties that depend on synchrony must be liveness properties, because a safety property that is violated during a period of asynchrony cannot be repaired afterwards. In agreement with FLP, Paxos has executions that never decide; the assumption of eventual synchrony is what rules them out.

### What must a consensus algorithm guarantee?

Consensus has two events:

- **Request:** \`Propose(v)\`, with which a process proposes a value $v$.
- **Indication:** \`Decide(v)\`, with which the consensus module outputs the decided value $v$.

Its properties are:

- **Termination (liveness):** every correct process eventually decides some value.
- **Validity, or non-triviality (safety):** if a process decides a value $v$, then $v$ was proposed by some process. (This rules out the trivial algorithms that decide a fixed value without looking at the proposals.)
- **Integrity (safety):** no process decides more than once. (A decision is irrevocable.)
- **Uniform agreement (safety):** no two processes, correct or faulty, decide differently: if $p_i$ decides $v$ and $p_j$ decides $v'$, then $v = v'$.

In the terms of Paxos, where a value is "chosen" and then "learned": only a value that has been proposed may be chosen; only a single value is chosen; and a process never learns that a value has been chosen unless it actually has been.

### What are the three roles of Paxos, and how are they assigned?

Paxos divides the processes into three roles (the same physical process can play all three):

1. **Proposers:** the processes that propose the values, and try to have one of them chosen.
2. **Acceptors:** the processes that vote. They receive the requests of the proposers, remember what they have promised and what they have accepted, and accept or reject the proposals. A value is chosen when a majority of the acceptors has accepted it.
3. **Learners:** the processes that find out which value has been chosen, and decide it.

The assumption of a majority of correct processes is needed only for the set of the acceptors.

### How are the round numbers of the proposals made unique without communication among the proposers?

Every proposal has a number, called round number (or ballot number). To prevent two proposers from using the same number, each number $b$ can be built as a pair $b = \\langle s, p_i \\rangle$, where:

- $s \\in \\mathbb{N}_0$ is a counter that only grows;
- $p_i$ is the unique integer identifier of the proposer.

The pairs are ordered lexicographically: $$b_1 < b_2 \\iff (s_1 < s_2) \\lor (s_1 = s_2 \\land p_1 < p_2)$$

Alternatively, if there are $n$ proposers with identifiers $p_i \\in \\{1, 2, \\dots, n\\}$, the proposer $p_i$ uses as its $k$-th round number: $$b = k \\cdot n + p_i \\quad \\text{for } k \\in \\{0, 1, 2, \\dots\\}$$ With two proposers, one uses the odd numbers and the other the even ones; with three, the first uses $1, 4, 7, \\dots$, the second $2, 5, 8, \\dots$, and the third $3, 6, 9, \\dots$. In this way the numbers of different proposers are all different, and totally ordered. Uniqueness is essential: if two proposers used the same round number with two different values, two different values could be chosen.

### How are the properties P1, P2, P2a, P2b and P2c of "Paxos Made Simple" derived?

Lamport arrives at the algorithm through a chain of requirements, each of which fixes a problem of the previous one.

The simplest solution is a single acceptor, which chooses the first value it receives; but if that acceptor crashes, everything stops. So there must be several acceptors, and a value is **chosen** when a majority of them has accepted it: since any two majorities intersect, this makes it possible to guarantee that only one value is chosen.

1. **Property P1:** an acceptor must accept the first proposal that it receives.
  - Reason: a value must be chosen even if only one proposer proposes a single value.
  - Problem: if several proposers propose different values at the same time, every acceptor may accept a different one, and no value reaches a majority. So an acceptor must be allowed to accept more than one proposal. For this reason the proposals are numbered: a proposal is a pair $\\langle \\text{number}, \\text{value} \\rangle$, and a value is chosen when a single proposal with that value has been accepted by a majority. Several proposals may be chosen, as long as they all have the same value.
2. **Property P2:** if a proposal with value $v$ is chosen, then every higher-numbered proposal that is chosen has value $v$.
  - Reason: it guarantees agreement. Once a value $v$ has been chosen, no other value $v' \\neq v$ can be chosen later.
3. **Property P2a:** if a proposal with value $v$ is chosen, then every higher-numbered proposal accepted by any acceptor has value $v$.
  - Reason: P2a implies P2, because to be chosen a proposal must be accepted by at least one acceptor.
  - Problem: a proposal may be chosen while some acceptor $c$ has never seen it. A new proposer could then send to $c$ a higher-numbered proposal with a different value $v'$, which $c$ would have to accept because of P1, against P2a.
4. **Property P2b:** if a proposal with value $v$ is chosen, then every higher-numbered proposal issued by any proposer has value $v$.
  - Reason: P2b implies P2a. If no proposer ever issues a higher-numbered proposal with a value different from $v$, no acceptor can accept one.
5. **Property P2c:** for any value $v$ and any number $n$, if a proposal with value $v$ and number $n$ is issued, then there is a set $S$ consisting of a majority of the acceptors such that either:
  - no acceptor in $S$ has accepted any proposal numbered less than $n$, or
  - $v$ is the value of the highest-numbered proposal among all the proposals numbered less than $n$ accepted by the acceptors in $S$.

P2c implies P2b. If a proposal numbered $m$ with value $v$ has been chosen, a majority $Q$ of the acceptors has accepted it, and any majority $S$ contains at least one member of $Q$: by induction on $n$, every proposal numbered $n > m$ that respects P2c has value $v$.

The chain of the implications is:

**P2c $\\implies$ P2b $\\implies$ P2a $\\implies$ P2**

To maintain P2c, a proposer that wants to issue a proposal numbered $n$ must learn the highest-numbered proposal with number less than $n$ that has been accepted, or will be accepted, by each acceptor of a majority. Learning what has already been accepted is easy; predicting the future is not. So, instead of predicting, the proposer asks the acceptors to **promise** that they will not accept any more proposals numbered less than $n$. This request is the first phase of the algorithm.

### How do the two phases of Paxos work, step by step?

**Phase 1: prepare and promise**

- **Phase 1a, the prepare request of the proposer:**
  - A proposer $p_i$ chooses a new round number $b$, higher than those it has used before.
  - $p_i$ sends a message \`PREPARE(b)\` to the acceptors (a majority is enough). The message asks two things: whether $p_i$ may make a proposal numbered $b$, and whether the acceptor suggests a value for it.
- **Phase 1b, the promise of the acceptor:**
  - An acceptor $a_j$ that receives \`PREPARE(b)\` compares $b$ with the highest round number $b_{\\text{promised}}$ to which it has already answered.
  - If $b > b_{\\text{promised}}$:
    - $a_j$ updates $b_{\\text{promised}} \\leftarrow b$.
    - $a_j$ answers with a message \`PROMISE(b, b_a, v_a)\`, where $b_a$ is the highest round number of a proposal that $a_j$ has **accepted** (or $\\bot$ if there is none), and $v_a$ is the value of that proposal (or $\\bot$).
    - With this answer $a_j$ promises not to accept any more proposals numbered less than $b$.
  - If $b \\le b_{\\text{promised}}$:
    - $a_j$ ignores the request. As an optimization it can answer with a negative acknowledgment \`NACK\`, which is not part of the algorithm but lets the proposer find out sooner that its round number is too old.

**Phase 2: accept**

- **Phase 2a, the accept request of the proposer:**
  - When the proposer $p_i$ has received the \`PROMISE\` messages of a majority $S$ of the acceptors, it looks at all the pairs $(b_a, v_a)$ they contain.
  - Rule for the choice of the value (property P2c):
    - If all the pairs are empty ($b_a = \\bot$: no acceptor in $S$ has accepted anything), $p_i$ is free to propose its own value.
    - Otherwise $p_i$ takes the pair with the highest round number $b_a$, and it must propose the corresponding value $v_a$.
  - $p_i$ sends a message \`ACCEPT(b, v)\` with the round number of its prepare request and the value selected.
- **Phase 2b, the acceptance of the acceptor:**
  - An acceptor $a_j$ that receives \`ACCEPT(b, v)\` compares $b$ with $b_{\\text{promised}}$.
  - If $b \\ge b_{\\text{promised}}$:
    - $a_j$ accepts the proposal: $b_a \\leftarrow b$, $v_a \\leftarrow v$ and $b_{\\text{promised}} \\leftarrow b$. The acceptor is said to have **voted** for $v$ in round $b$.
    - $a_j$ informs all the learners with a message \`LEARN(b, v)\`.
  - If $b < b_{\\text{promised}}$:
    - $a_j$ rejects the request, because it has promised not to accept proposals numbered less than $b_{\\text{promised}}$.
- **Learning the decision:**
  - A learner that receives \`LEARN(b, v)\` for the same round $b$ from a majority of the acceptors knows that $v$ has been chosen: it decides $v$, and it sends \`DECIDE(v)\` to the other learners, which decide $v$ when they receive it.

## The pseudocode of Paxos and its correctness

### What is the pseudocode of the proposer, of the acceptor and of the learner?

The code is the one of the paper "A Simpler Proof for Paxos and Fast Paxos" (Marzullo, Mei and Meling), which the course uses for the second presentation of the algorithm.

\`\`\` Paxos: proposer p
Constants:
  A, n and f        // A is the set of acceptors, n = |A|, f = ⌊(n - 1)/2⌋

Init:
  crnd := -1        // current round number

on < Propose, val > do
  crnd := pickNextRound(crnd);
  cval := val;
  P := ∅;
  send < PREPARE, crnd > to A;

on < PROMISE, rnd, vrnd, vval > with rnd = crnd from acceptor a do
  P := P ∪ {(vrnd, vval)};

on event |P| ≥ n - f do
  j := max{vrnd : (vrnd, vval) ∈ P};
  if j ≥ 0 then
    V := {vval : (j, vval) ∈ P};
    cval := pick(V);      // the value voted in the largest round
  send < ACCEPT, crnd, cval > to A;
\`\`\`

\`\`\` Paxos: acceptor a
Constants:
  L                 // the set of learners

Init:
  rnd := -1;
  vrnd := -1;
  vval := -1;

on < PREPARE, prnd > with prnd > rnd from proposer p do
  rnd := prnd;
  send < PROMISE, rnd, vrnd, vval > to proposer p;

on < ACCEPT, i, v > with i ≥ rnd from proposer p do
  rnd := i;
  vrnd := i;
  vval := v;
  send < LEARN, i, v > to L;
\`\`\`

\`\`\` Paxos: learner l
Init:
  V := ∅;

on < LEARN, (i, v) > from acceptor a do
  V := V ⊎ {(i, v)};

on event ∃ i, v : |{(i, v) : (i, v) ∈ V}| ≥ n - f do
  v is chosen;
\`\`\`

- \`crnd\`, \`cval\`: the current round number of the proposer, and the value that it is proposing in that round.
- \`pickNextRound(crnd)\`: returns a round number greater than \`crnd\` and different from those of all the other proposers.
- \`P\`: the pairs \`(vrnd, vval)\` received in the promises of the current round, one for each acceptor that has answered. The test \`rnd = crnd\` discards the promises of the previous rounds.
- \`n - f\`: since \`f = ⌊(n - 1)/2⌋\`, a set of \`n - f\` acceptors is a majority.
- \`j\`, \`pick(V)\`: the rule of property P2c. If some acceptor of the majority has already voted (\`j ≥ 0\`), the proposer gives up its own value and takes the value voted in the largest round \`j\`. If nobody has voted (\`j = -1\`), \`cval\` remains the value of the proposer.
- \`rnd\`: the largest round to which the acceptor has answered; it is the promise of the acceptor.
- \`vrnd\`, \`vval\`: the last round in which the acceptor has voted and the value it voted for (\`-1\` if it has never voted).
- \`V\` of the learner: a multiset (\`⊎\` is the union of multisets), in which the same pair \`(i, v)\` is counted once for each acceptor that sent it. When \`n - f\` acceptors have sent the same pair, the value \`v\` is chosen.

### Why is Paxos safe?

Say that an acceptor has **voted** for $v$ in round $i$ if it has accepted the proposal $\\langle i, v \\rangle$. Three properties must be proved:

1. Only a value that has been proposed can be chosen.
2. A single value is chosen.
3. Only a chosen value is learned by the learners.

The first and the third follow directly from the code: a proposer proposes either its own value or a value already voted, and a learner decides only a value voted by a majority. The second follows from this claim:

**If an acceptor has voted for the value $v$ in round $i$, then no value $v' \\neq v$ can be chosen in a previous round $j < i$.**

The claim implies that a single value is chosen. In each round only one value is proposed, because a round number belongs to one proposer, which sends a single \`ACCEPT\` in that round. And if $v$ were chosen in a round and $v'$ in a later one, some acceptor would have voted for $v'$ in the later round, so by the claim no value different from $v'$ could have been chosen before: $v = v'$.

The proof of the claim is by induction on the round $i$. If an acceptor has voted for $v$ in round $i$, then a proposer has collected, for its \`PREPARE\` of round $i$, the promises of a majority $Q$ of the acceptors.

- **Base:** for $i = 0$ there are no previous rounds, and the claim holds.
- **Inductive step:** assume the claim for all the rounds less than $i$, and let $j$ be the largest round among the votes reported in the promises of $Q$ (with $j < i$).
  - **Rounds between $j + 1$ and $i - 1$:** the acceptors in $Q$ have reported no vote in these rounds, and they have promised not to vote any more in rounds less than $i$. Any majority intersects $Q$, so in these rounds no proposal can be voted by a majority: no value can be chosen there.
  - **No vote reported ($j = -1$):** the previous case covers all the rounds less than $i$, and the claim holds.
  - **Round $j$ and below:** otherwise the proposer has proposed the value voted in round $j$, which is therefore $v$. In round $j$ only $v$ can be chosen, because only one value is proposed in a round. And since some acceptor has voted for $v$ in round $j$, by the inductive hypothesis no value different from $v$ can be chosen in the rounds less than $j$.

What has been proved are safety properties only. Termination is missing, and it could not be otherwise, because of FLP.

### Can a new proposer ignore the values that have been accepted but not chosen?

Suppose that, in a system of $n$ acceptors, a proposer $P_1$ makes $n/2 - 1$ acceptors vote for the value $3$ in round $j$, a proposer $P_2$ makes other $n/2 - 1$ acceptors vote for the value $42$ in round $j + 1$, and the remaining acceptors receive nothing. No value has been chosen. Can a third proposer, in a later round $j + k$, have the value $7$ accepted?

It cannot. To send an \`ACCEPT\` with $7$, the proposer must have received, for its \`PREPARE\` of round $j + k$, the promises of a majority in which nobody reports a vote. But a majority must contain at least one of the acceptors that have voted, because those that have not voted are too few. Nor can that acceptor have promised before voting: an acceptor that has promised round $j + k$ rejects the proposals of the rounds $j$ and $j + 1$, so it could not have voted for them afterwards. The promises therefore report at least one vote, and the proposer must propose $42$ or $3$, the value of the largest round it sees. A value that has been accepted by somebody cannot be ignored, even if it has not been chosen.

### What are dueling proposers, and why does termination require eventual synchrony?

In an asynchronous system Paxos can suffer from **dueling proposers** (a livelock): two or more proposers keep overtaking each other, and no proposal ever completes the second phase.

1. The proposer $p_1$ sends \`PREPARE\` for round $b_1 = 1$. A majority of the acceptors promises round $1$.
2. Before $p_1$ can send its \`ACCEPT\`, the proposer $p_2$ sends \`PREPARE\` for round $b_2 = 2$. The same acceptors promise round $2$, and set $b_{\\text{promised}} \\leftarrow 2$.
3. When the \`ACCEPT\` of $p_1$ for round $1$ arrives, the acceptors reject it, because $b_1 = 1 < b_{\\text{promised}} = 2$.
4. Seeing its request rejected (through a timeout, or through the negative acknowledgments), $p_1$ takes a higher round, $b_3 = 3$, and sends \`PREPARE\` again. The acceptors promise round $3$, and set $b_{\\text{promised}} \\leftarrow 3$.
5. When the \`ACCEPT\` of $p_2$ for round $2$ arrives, it is rejected, because $b_2 = 2 < b_{\\text{promised}} = 3$.
6. The cycle can go on forever ($p_1$ with $b_3$, $p_2$ with $b_4$, $p_1$ with $b_5$, $\\dots$): an endless sequence of first phases, without any proposal ever being chosen.

This is the execution that FLP says must exist. How it disappears under eventual synchrony:

- The livelock arises only because the timing of an asynchronous network lets the proposers interleave their prepare requests with the accept requests of their rivals. Lost or late messages, by themselves, only slow the algorithm down, provided that the proposers use timeouts.
- In practice the proposers run an eventual leader election ($\\Omega$), and only the proposers that believe they are the leader make proposals. During the periods of asynchrony there may be several leaders, which duel. Once the system has become synchronous (after $\\mathrm{GST}$), $\\Omega$ indicates a single leader $p_{\\text{leader}}$, and only $p_{\\text{leader}}$ sends prepare and accept requests.
- With no rival to interrupt it, $p_{\\text{leader}}$ completes both phases in a bounded time, has its proposal voted by a majority, and the algorithm **terminates**.

### What does it take to use Paxos in a real system?

The paper "Paxos Made Live" (Chandra, Griesemer and Redstone, 2007) tells how Paxos was turned into the replicated log on which the Chubby lock service of Google is built. Its main lesson is the distance between the algorithm and a system: Paxos fits in one page of pseudocode, the implementation takes several thousand lines of code. A real system decides a sequence of values, running one instance of Paxos for each entry of the log (Multi-Paxos), and it has to deal with problems that the algorithm does not mention: disks that get corrupted, so that a replica may forget its promises; reads that should not cost a whole instance of consensus, served by a master that holds a lease; changes in the set of the replicas; logs that grow without bound and must be replaced by snapshots; and the testing of a system that is too large to be proved correct.
`;export{e as default};
