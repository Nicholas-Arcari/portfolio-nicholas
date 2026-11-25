// src/config/distributed.js
// Le lezioni di Distributed Systems (laurea magistrale, Sapienza), una riga
// ciascuna nell'elenco di /distributed-systems. Il testo di ogni lezione sta
// in src/pages/distributed/notes, in inglese e in italiano:
// <file>.en.md e <file>.it.md, nel formato di parseNotes.js.
//
// Per aggiungere una lezione: una voce qui e i suoi due file. La build
// controlla che ci siano e che le due lingue abbiano la stessa struttura
// (build/distributed-notes.js).

export const DS_LECTURES = [
  {
    n: 1,
    slug: 'lecture-1',
    file: 'lecture-01',
    title: {
      en: 'Introduction and Formal System Models',
      it: 'Introduzione e modelli formali di sistema',
    },
    description: {
      en: 'What a distributed system is, the local view and why information is always stale. Consensus and the Two Generals Problem, the milestones of dependability and the Tangaroa case. Then the formal model: processes as automata, configurations, events, fair executions, indistinguishability, crash-stop and Byzantine failures, message loss as an event.',
      it: 'Che cos\'è un sistema distribuito, la vista locale e perché l\'informazione è sempre vecchia. Il consenso e il problema dei due generali, le tappe della dependability e il caso Tangaroa. Poi il modello formale: processi come automi, configurazioni, eventi, esecuzioni fair, indistinguibilità, guasti crash-stop e bizantini, la perdita di un messaggio come evento.',
    },
  },
  {
    n: 2,
    slug: 'lecture-2',
    file: 'lecture-02',
    title: {
      en: 'Communication Links, Safety and Liveness',
      it: 'Collegamenti di comunicazione, safety e liveness',
    },
    description: {
      en: 'How a real link becomes an abstraction with events and properties, without probabilities. The fair-lossy link and how much it can lose. Safety and liveness, how a bound turns one into the other and why they must not be mixed. The reactive model with atomic handlers, then the stubborn and the perfect link with their algorithms and proofs, and two impossibility results.',
      it: 'Come un collegamento reale diventa un\'astrazione con eventi e proprietà, senza probabilità. Il fair-lossy link e quanto può perdere. Safety e liveness, come un limite trasforma l\'una nell\'altra e perché non vanno mescolate. Il modello reattivo con handler atomici, poi lo stubborn link e il perfect link con algoritmi e dimostrazioni, e due risultati di impossibilità.',
    },
  },
  {
    n: 3,
    slug: 'lecture-3',
    file: 'lecture-03',
    title: {
      en: 'Synchrony Models and Physical Clock Synchronization',
      it: 'Modelli di sincronia e sincronizzazione degli orologi fisici',
    },
    description: {
      en: 'Asynchronous, synchronous and eventually synchronous systems: what each one allows, why safety must never depend on timing while liveness may, and the Global Stabilization Time. Then physical clocks: hardware and software clocks, skew, drift rate, correct clocks and monotonicity, and the algorithms that synchronize them: Cristian, Berkeley and NTP.',
      it: 'Sistemi asincroni, sincroni e sincroni prima o poi: che cosa permette ciascuno, perché la safety non deve mai dipendere dai tempi mentre la liveness può, e il Global Stabilization Time. Poi gli orologi fisici: orologi hardware e software, skew, drift rate, orologi corretti e monotonia, e gli algoritmi che li sincronizzano: Cristian, Berkeley e NTP.',
    },
  },
  {
    n: 4,
    slug: 'lecture-4',
    file: 'lecture-04',
    title: {
      en: 'FIFO Links, Causality, Lamport Clocks and Vector Clocks',
      it: 'FIFO link, causalità, orologi di Lamport e vector clock',
    },
    description: {
      en: 'The FIFO link built on a perfect link with sequence numbers, and its proof. Why FIFO order is not enough: the chat example and Lamport\'s happened-before relation, with concurrency. Scalar logical clocks and what they cannot tell, then vector clocks, from full event histories to an array of counters, and their comparison rules. An exam exercise on vector clocks seen from a network card.',
      it: 'Il FIFO link costruito su un perfect link con i numeri di sequenza, e la sua dimostrazione. Perché l\'ordine FIFO non basta: l\'esempio della chat e la relazione happened-before di Lamport, con la concorrenza. Gli orologi logici scalari e ciò che non sanno dire, poi i vector clock, dalle storie complete degli eventi a un array di contatori, e le regole per confrontarli. Un esercizio d\'esame sui vector clock visti da una scheda di rete.',
    },
  },
  {
    n: 5,
    slug: 'lecture-5',
    file: 'lecture-05',
    title: {
      en: 'Lamport\'s Mutual Exclusion and Perfect Failure Detectors',
      it: 'La mutua esclusione di Lamport e i perfect failure detector',
    },
    description: {
      en: 'The mutual exclusion abstraction and Lamport\'s algorithm: scalar timestamps in a total order, requests, acknowledgments and releases over FIFO links, a worked example, the proofs of safety, liveness and fairness, and its cost. Then failure detectors: completeness and accuracy, the perfect failure detector, Exclude on Timeout and the round-based version that halves the messages.',
      it: 'L\'astrazione di mutua esclusione e l\'algoritmo di Lamport: timestamp scalari in ordine totale, richieste, conferme e rilasci su FIFO link, un esempio svolto, le dimostrazioni di safety, liveness e fairness, e il costo. Poi i failure detector: completeness e accuracy, il perfect failure detector, Exclude on Timeout e la versione a round che dimezza i messaggi.',
    },
  },
  {
    n: 6,
    slug: 'lecture-6',
    file: 'lecture-06',
    title: {
      en: 'Eventually Perfect Failure Detectors and Leader Election',
      it: 'Eventually perfect failure detector e leader election',
    },
    description: {
      en: 'A recap of Lamport\'s mutual exclusion with its safety proof. Then failure detection under partial synchrony: the eventually perfect failure detector with suspect and restore, its increasing timeout, the stabilization lemma and the pongs from the dead. Leader election with a perfect failure detector, the eventual leader detector Omega, and the fail-stop, fail-noisy and fail-silent models.',
      it: 'Un ripasso della mutua esclusione di Lamport con la sua dimostrazione di safety. Poi la rilevazione dei guasti in sincronia parziale: l\'eventually perfect failure detector con suspect e restore, il timeout crescente, il lemma di stabilizzazione e i pong dal morto. La leader election con un perfect failure detector, l\'eventual leader detector Omega e i modelli fail-stop, fail-noisy e fail-silent.',
    },
  },
  {
    n: 7,
    slug: 'lecture-7',
    file: 'lecture-07',
    title: {
      en: 'Fault-Tolerant Mutual Exclusion and Broadcast: BEB, RB, URB',
      it: 'Mutua esclusione tollerante ai guasti e broadcast: BEB, RB, URB',
    },
    description: {
      en: 'Lamport\'s mutual exclusion made fault tolerant with a perfect failure detector and three patches, then a simpler version with a leader. Communication in a group: best-effort broadcast, regular reliable broadcast with the lazy and the eager algorithm, their proofs and costs, and the specification of uniform reliable broadcast. Exercises on clocks, vector clocks, failure detectors and FIFO links.',
      it: 'La mutua esclusione di Lamport resa tollerante ai guasti con un perfect failure detector e tre correzioni, poi una versione più semplice con un leader. La comunicazione in un gruppo: best-effort broadcast, reliable broadcast regolare con l\'algoritmo lazy e quello eager, dimostrazioni e costi, e la specifica dell\'uniform reliable broadcast. Esercizi su orologi, vector clock, failure detector e FIFO link.',
    },
  },
  {
    n: 8,
    slug: 'lecture-8',
    file: 'lecture-08',
    title: {
      en: 'Uniform Reliable Broadcast and Quorums',
      it: 'Uniform reliable broadcast e quorum',
    },
    description: {
      en: 'Regular against uniform agreement, with four executions to classify. The All-Ack algorithm with a perfect failure detector, its proof and cost. Quorums and their intersection, the Majority-Ack algorithm without a failure detector and why it needs a majority of correct processes. A comparison of the four broadcast algorithms, spanning trees, and exam exercises on modified algorithms.',
      it: 'Agreement regolare contro uniform agreement, con quattro esecuzioni da classificare. L\'algoritmo All-Ack con un perfect failure detector, la sua dimostrazione e il suo costo. I quorum e la loro intersezione, l\'algoritmo Majority-Ack senza failure detector e perché ha bisogno di una maggioranza di processi corretti. Un confronto fra i quattro algoritmi di broadcast, gli spanning tree ed esercizi d\'esame su algoritmi modificati.',
    },
  },
  {
    n: 9,
    slug: 'lecture-9',
    file: 'lecture-09',
    title: {
      en: 'URB Impossibility, FIFO Broadcast and Causal Broadcast',
      it: 'Impossibilità dell\'URB, FIFO broadcast e causal broadcast',
    },
    description: {
      en: 'Why uniform reliable broadcast cannot be solved without a majority of correct processes or a perfect failure detector, proved with two indistinguishable executions. Ordered communications: FIFO-order broadcast with sequence numbers, the bank example that FIFO cannot protect, causal order, the No-Waiting algorithm with the full causal past and its garbage collection, and the Waiting algorithm with vector clocks.',
      it: 'Perché l\'uniform reliable broadcast non si può risolvere senza una maggioranza di processi corretti o un perfect failure detector, dimostrato con due esecuzioni indistinguibili. Le comunicazioni ordinate: FIFO-order broadcast con i numeri di sequenza, l\'esempio bancario che il FIFO non protegge, l\'ordine causale, l\'algoritmo No-Waiting con l\'intero passato causale e la sua garbage collection, e l\'algoritmo Waiting con i vector clock.',
    },
  },
  {
    n: 10,
    slug: 'lecture-10',
    file: 'lecture-10',
    title: {
      en: 'Total Order Broadcast and Regular Registers',
      it: 'Total order broadcast e regular register',
    },
    description: {
      en: 'How large the vectors of causal broadcast grow. Why causal order is not enough for replicas with non-commutative operations: total order (atomic) broadcast, its specification and its relation with FIFO and causal order. Two exercises of the book on causal delivery. Distributed registers: operations, precedence and concurrency, the regular semantics, and the Read-One Write-All algorithm with a perfect failure detector.',
      it: 'Quanto crescono i vettori del causal broadcast. Perché l\'ordine causale non basta per repliche con operazioni non commutative: il total order (atomic) broadcast, la sua specifica e la sua relazione con l\'ordine FIFO e causale. Due esercizi del libro sulla causal delivery. I registri distribuiti: operazioni, precedenza e concorrenza, la semantica regolare e l\'algoritmo Read-One Write-All con un perfect failure detector.',
    },
  },
  {
    n: 11,
    slug: 'lecture-11',
    file: 'lecture-11',
    title: {
      en: 'Majority Voting, Sequential Consistency and Linearizability',
      it: 'Majority Voting, sequential consistency e linearizability',
    },
    description: {
      en: 'The limits of Read-One Write-All: a writer that crashes, and why an eventually perfect failure detector is not enough. Majority Voting, a regular register without failure detector, built on quorums and timestamps, with its costs and resilience. The three consistency conditions (regular, sequential, atomic), how they relate, which ones are compositional, and an exercise on the values that reads can return.',
      it: 'I limiti di Read-One Write-All: uno scrittore che va in crash, e perché un eventually perfect failure detector non basta. Majority Voting, un regular register senza failure detector, costruito su quorum e timestamp, con i suoi costi e la sua resilienza. Le tre condizioni di consistenza (regolare, sequenziale, atomica), le loro relazioni, quali sono composizionali, e un esercizio sui valori che le letture possono restituire.',
    },
  },
  {
    n: 12,
    slug: 'lecture-12',
    file: 'lecture-12',
    title: {
      en: 'Atomic Registers: From Regular Registers to Read-Impose Write-All',
      it: 'Atomic register: dai regular register a Read-Impose Write-All',
    },
    description: {
      en: 'The (1,N) atomic register: the ordering property, linearization points, and six executions to classify. Building it with registers only: timestamps give a (1,1) atomic register, and a matrix in which every reader writes gives a (1,N) one. The same idea with messages: Read-Impose Write-All with a perfect failure detector, its costs, and a first look at Read-Impose Write-Majority.',
      it: 'L\'atomic register (1,N): la proprietà di ordering, i punti di linearizzazione e sei esecuzioni da classificare. Come costruirlo con soli registri: i timestamp danno un atomic register (1,1), e una matrice in cui ogni lettore scrive ne dà uno (1,N). La stessa idea con i messaggi: Read-Impose Write-All con un perfect failure detector, i suoi costi, e un primo sguardo a Read-Impose Write-Majority.',
    },
  },
  {
    n: 13,
    slug: 'lecture-13',
    file: 'lecture-13',
    title: {
      en: 'Read-Impose Write-Majority and Consensus in the Fail-Stop Model',
      it: 'Read-Impose Write-Majority e consenso nel modello fail-stop',
    },
    description: {
      en: 'The atomic register without failure detector: Read-Impose Write-Majority, why the impose phase is needed and what it costs, with a comparison of the four register algorithms. Then consensus: its history, its specification and seven executions to classify, Hierarchical Consensus with a perfect failure detector and its proof, uniform consensus, and Hierarchical Uniform Consensus.',
      it: 'L\'atomic register senza failure detector: Read-Impose Write-Majority, perché serve la fase di impose e quanto costa, con un confronto fra i quattro algoritmi per i registri. Poi il consenso: la sua storia, la specifica e sette esecuzioni da classificare, Hierarchical Consensus con un perfect failure detector e la sua dimostrazione, l\'uniform consensus e Hierarchical Uniform Consensus.',
    },
  },
  {
    n: 14,
    slug: 'lecture-14',
    file: 'lecture-14',
    title: {
      en: 'Exercises on Broadcast, Failure Detectors and Registers',
      it: 'Esercizi su broadcast, failure detector e registri',
    },
    description: {
      en: 'A lecture of exercises. A regular and then a uniform reliable broadcast on a line of processes with an oracle for the neighbors; when a FIFO link is needed; a failure detector that halves its timeout; how to tell best-effort, regular and uniform broadcast apart in an execution; reads on regular and atomic registers, and the assumptions hidden in the register algorithms.',
      it: 'Una lezione di esercizi. Un reliable broadcast regolare e poi uniforme su una linea di processi con un oracolo per i vicini; quando serve un FIFO link; un failure detector che dimezza il suo timeout; come distinguere in un\'esecuzione broadcast best-effort, regolare e uniforme; letture su registri regolari e atomici, e le ipotesi nascoste negli algoritmi per i registri.',
    },
  },
  {
    n: 15,
    slug: 'lecture-15',
    file: 'lecture-15',
    title: {
      en: 'The f+1 Lower Bound, FLP and Paxos',
      it: 'Il limite f+1, FLP e Paxos',
    },
    description: {
      en: 'Why synchronous consensus needs f+1 rounds, and why it cannot be solved at all in an asynchronous system if one process may crash (FLP). Then Paxos, for eventually synchronous systems: the three roles, the round numbers, the properties from P1 to P2c, the two phases, the pseudocode with its proof of safety, dueling proposers and the leader that restores termination.',
      it: 'Perché il consenso sincrono richiede f+1 round, e perché in un sistema asincrono non si può risolvere affatto se un processo può andare in crash (FLP). Poi Paxos, per i sistemi sincroni prima o poi: i tre ruoli, i numeri di round, le proprietà da P1 a P2c, le due fasi, lo pseudo-codice con la dimostrazione di safety, i dueling proposers e il leader che ripristina la termination.',
    },
  },
];
