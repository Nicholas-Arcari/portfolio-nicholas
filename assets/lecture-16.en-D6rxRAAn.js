const e=`Lecture 16 is a crash course on blockchains and smart contracts, the setting of the attack of Lecture 17. It starts from a traditional problem, notarizing a contract (a notary and an archive that must both be trusted), automates it with a central notary service (and shows its integrity and availability problems), and then decentralizes it: what a **blockchain** is (blocks of signed transactions from which account balances are computed), its properties (persistence, liveness, public verifiability), how new blocks are proposed and new coins minted with **proof-of-work** (and, as an alternative, **proof-of-stake**), and how **Ethereum smart contracts** are deployed and executed by all the nodes, with two pseudo-code examples (a token contract and a notary contract) and the cost of execution (**gas**). It closes on why software security matters even more here: smart contracts are ordinary code that directly handles money, as the DAO attack showed. The slide deck has 28 pages.

## The notarization problem (pages 1-8)

### Slide 1 · Title slide

> **Security in Software Applications**
>
> Smart Contracts - Crash Course

### Slide 2 · The Notarization Problem

> - Alice wants to buy a house.
> - With the aid of some entity (e.g. real estate company) produces a contract
> - The contract C must be *notarized* and *deposited* somewhere.
> - What do we need to conclude the procedure?
>   - A **notary**, whose aim is to validate the contract
>   - A secure **archive** where the contract can be deposited
>
> The **notary** must be trusted: he must sign *only* correct contracts
>
> The **archive** must be *publicly* accessible and should be *untamperable*

**Expansion.** The running example of the lecture. Buying a house requires two trusted services: a **notary**, who checks that the contract is correct (the parties are who they claim to be, the terms are legal) and certifies it, and an **archive** (a public registry) that keeps the certified contract. The two requirements on the slide are security properties in the vocabulary of Lecture 1: the notary must be trustworthy, signing *only* correct contracts (**integrity** of the certification), and the archive must be **publicly accessible** (**availability**, and verifiability by anyone) and **untamperable** (**integrity** of the records). The whole lecture asks how to obtain these properties without having to trust a single person or server.

### Slide 3 · Notarization example - Basic interaction

> The certificate is a document signed by the notary

![Lecture 16, page 3](L16_p03.webp "50% 1400x930")

**Figure.** Two stick figures, **A** (**Alice**) on the left and **B** (the **Notary**) on the right. Alice sends B a document together with "**+ 10 EUR**" (arrow to the right). B thinks (cloud): "**Generate certificate For**" the document. B sends back to Alice a certified document (a document with a seal) and, with an arrow upwards, deposits another certified copy in an archive box.

**Expansion.** The traditional procedure: Alice pays the notary, the notary checks the document and returns a **certificate**, a copy of the document carrying the notary's signature and seal, and deposits a copy in the archive. Anyone can later verify the contract by asking the archive. Trust is placed in two parties, the notary (who could certify a false contract, if dishonest or bribed) and the archive (which could lose or alter records).

### Slide 4 · Digital Interaction with the notary

![Lecture 16, page 4](L16_p04.webp "50% 1400x911")

**Figure.** The same exchange over the Internet. **A** sends B a document "**+ payment**" over a connection marked by a red padlock, and receives a certified document back. A's speech bubble reads "**B gets 10 euros If he certifies my document**". **B** is inside a box, with a certified document and a red key (B's signing key); from the box an arrow carries the certified document down to a **PKI** (a database with a server and an archive). The legend at the bottom: padlock "**= Secure connection (e.g. HTTPs)**".

**Expansion.** The digital version replaces paper with cryptography. The connection is protected by **TLS** (HTTPS), which gives confidentiality and integrity in transit and authenticates the server. The notary signs with its **private key**, and anyone can verify the signature with the notary's public key, whose authenticity is guaranteed by a **PKI** (public-key infrastructure: certificate authorities that bind public keys to identities); the PKI also stores the certified documents. The trust has not disappeared, it has moved: Alice must still trust B to certify only correct documents, and everyone must trust the PKI.

### Slide 5 · Automatic Notarization - First attempt

![Lecture 16, page 5](L16_p05.webp "50% 1400x922")

**Figure.** The human notary is replaced by a **Notary Service**: a box with a server, a code window ("</>") that produces certified documents, and the red signing key. **A** exchanges documents with A's own server, connected to **A's bank**; A's server sends the document "**+ payment**" to the notary service over a secure connection (red padlock) and receives a certified document back. The notary service is connected to **B's bank** and sends the certified document to the **PKI**. A thought cloud of the service reads "**Code that Validates and Signs**".

**Expansion.** First attempt at automation: the notary becomes a program running on a server, which validates the document, collects the payment through the banks and signs automatically. It is faster and cheaper, but every component is now software, and the next slide lists what can go wrong.

### Slide 6 · Automatic Notarization issues

> - Other than common software vulnerabilities issues in:
>   - Server's code
>   - Notarization program code
>
> We have that an untrusted server might be compromised!
>
> ➔ Integrity issues: Corrupted notary server will notarize invalid contracts
>
> ➔ Availability issues: Compromised database might be violated, and records *deleted,* DoS attacks
>
> ➔ *Extra*: we need to trust banks and banks' servers

**Expansion.** Automation inherits all the problems of this course. The server's code and the notarization program can contain the usual vulnerabilities (buffer overflows, injections, Lectures 3-9), and even with perfect code the **server itself** is a single point of trust that can be compromised (by an external attacker or an insider):

- **Integrity**: a corrupted notary server signs invalid contracts, and since it holds the signing key its forged certificates look perfectly valid.
- **Availability**: the database can be breached and records deleted, and a denial-of-service attack can stop the service.
- And the payments still depend on **banks** and their servers, more parties to trust.

The common root is **centralisation**: one server, one key, one database. The next slides remove it.

### Slide 7 · Second attempt - Decentralize everything!

![Lecture 16, page 7](L16_p07.webp "50% 1400x888")

**Figure.** A stick figure sends a document "**+ payment**" to a network icon (a cube in the centre connected to eight nodes) and receives a certified document back; the network thinks (cloud) "**Validates**" the document.

**Expansion.** The idea: replace the single notary server with a **network of many independent nodes** that together validate, execute and record the notarization. No single node has to be trusted, because the result is accepted only if the network as a whole agrees on it (Slide 10).

### Slide 8 · Second attempt - Decentralize everything!

> This system should be
>
> - Programmable
> - Publicly accessible
> - Publicly verifiable
> - Immutable
> - Manages money!
>
> - ➔ Solution: Blockchains!
>   - ➔ introduced by for the first time by Satoshi Nakamoto in 2008 had revolutionized the idea of currencies (decentralized currency)
>     - ➔ https://bitcoin.org/bitcoin.pdf
>     - ➔ First notion of programmability (scripts)

![Lecture 16, page 8](L16_p08.webp "41% 745x744")

**Figure.** The network icon of Slide 7: a cube in the centre, connected to eight nodes.

**Expansion.** The requirements for a decentralized notary are the requirements of a blockchain: **programmable** (it must run the notarization logic), **publicly accessible** and **publicly verifiable** (anyone can submit and check), **immutable** (records cannot be altered, the "untamperable archive" of Slide 2) and able to **manage money** (to pay the service without banks). The answer is the **blockchain**, introduced by the pseudonymous Satoshi Nakamoto in the 2008 Bitcoin white paper (the linked PDF), which created the first decentralized currency, with no central bank or payment processor. Bitcoin already had a limited form of programmability, **scripts** that state the conditions under which coins can be spent; Ethereum (Slide 14) generalised it to arbitrary programs.

## Blockchains (pages 9-13)

### Slide 9 · What is a blockchain?

> - A **blockchain** is a decentralized list of blocks that can be extended.
> - In the Ethereum blockchain, accounts are represented by signature public keys (addresses), used to verify transactions.
> - Account Balances can be recomputed by looking at the transactions inside the blocks
> - A block contains:
>   - Set of *valid* signed transactions justifying balance updates
>   - Other informations needed to verify block *validity* (e.g., hash the previous block, …)
>
> Tx is included in a block if
>
> - the signature σ verifies under A's public key
> - A has enough balance

![Lecture 16, page 9](L16_p09.webp "50% 1400x362")

**Figure.** Three blocks in a row, each with an arrow pointing to the previous one (to the left). Above each block, the balances after it: first block ("…"): A.Balance = 3, B.balance = 3; second block ("…", "**Tx=(pay,A,B,1,σ)**"): A.Balance = 3, B.balance = 4 (the 4 in red); third block, drawn faded ("… Txs…", with a faded dotted arrow arriving from the right): A.Balance = 3, B.balance = 4 (the 4 in red).

**Expansion.** A blockchain is an **append-only list of blocks**, replicated on every node. Each block contains transactions and the **hash of the previous block**, which chains the blocks together: changing an old block would change its hash and break every following link, so history cannot be rewritten without redoing all the later blocks (Slides 12-13). Accounts are identified by **public keys** (in Ethereum, the address is derived from the hash of the public key), and a transaction such as **Tx=(pay,A,B,1,σ)**, "A pays 1 to B", carries A's **digital signature σ**. Nobody stores balances in a central table: they are **recomputed** by replaying all the transactions from the beginning. A transaction is accepted only if the **signature verifies** under A's public key (only A can spend A's money) and **A has enough balance** (no overdraft, no double spending). In the figure, after the payment A's balance should go from 3 to 2 (as on Slide 13), while the slide leaves it at 3.

### Slide 10 · Blockchain properties

> - **Persistence**: Blocks are always available and cannot ever be modified.
> - **Liveness**: If a valid transaction is issued to the blockchain, it will eventually appear in a block.
> - **Public Verifiability**: Anyone can download and verify the validity of the blockchain.
>
> Such properties are guaranteed if less than 1/3 (or 1/2 depending on the consensus) of nodes is corrupted.
>
> A good blockchain has **thousands** of nodes keeping it alive.
>
> *Who proposes new blocks? Where such currency comes from?*

![Lecture 16, page 10](L16_p10.webp "50% 1181x578")

**Figure.** A thought cloud containing a dotted box ("…", "**Tx=(pay,A,B,1,σ)**") with a dotted arrow leaving it to the left, connected by small circles to an icon of four people around a box with a check mark, labelled "**Consensus mechanism**".

**Expansion.** The three properties are the security guarantees of a blockchain, the same as those required of the notary's archive:

- **Persistence** (integrity and availability of the history): once a block is settled, it stays available and unchanged.
- **Liveness** (availability of the service, resistance to censorship): no one can prevent a valid transaction from being included, sooner or later.
- **Public verifiability**: no trust in any node is needed, because anyone can download the chain and check every signature, every balance and every link.

They hold only under an **honest-majority assumption**: Byzantine-fault-tolerant consensus protocols tolerate fewer than **1/3** of corrupted nodes, while Bitcoin's proof-of-work consensus needs the attacker to control less than **1/2** of the computing power (otherwise a "51% attack" can rewrite recent history). This is why thousands of independent nodes matter: corrupting a third or a half of them is impractical. The **consensus mechanism** in the figure is the protocol by which the nodes agree on which block comes next; the last questions introduce the next slide.

### Slide 11 · Block proposal and currency minting: Proof-of-work (BTC)

> - Who mints currency?
>   - As for gold, smth physical must correspond to smth «logical»
>   - Consensus nodes can verify that some work has been done to mint and assign some currency
>   - **Coinbase transaction:** special *transaction assigning coins to the winning proposer based on the proof that some computational work has been done.*
>   - ***HOW??***
>
> SHA-256 hash function outputs are random-like strings
>
> \`Sha256(ab00)\` = 3a1eef43a87fff51d535b1025e31d8c8fed3109eec247ca6beb252333d2f4fac
>
> \`Sha256(ab01)\` = a61df51f631f44da66aeaeb67cceec39d04812efe5c8246aacb70c780198bb2b
>
> Given 3a1eef43a87fff51d535b1025e31d8c8fed3109eec247ca6beb252333d2f4fac
>
> - The input \`ab00\` can be guessed only with brute force
> - Hash outputs are unrelated

**Expansion.** New coins must be created by someone, and the analogy is gold: gold has value because extracting it costs real work. In **proof-of-work** (Bitcoin), a node earns the right to propose the next block, and to pay itself new coins through the special **coinbase transaction**, by proving that it spent a large amount of computation. The proof relies on two properties of a cryptographic hash function such as **SHA-256**:

- Its outputs look **random**: inputs that differ in a single character (\`ab00\`, \`ab01\`) give completely **unrelated** outputs (the avalanche effect), so nothing about the output of one input can be learnt from the output of a similar input.
- It is **one-way** (preimage resistant): given an output, the only way to find an input that produces it is **brute force**, trying inputs one after the other.

Proof-of-work turns this into a lottery in which each ticket is one hash computation (next slide).

### Slide 12 · Proof-of-work

> - Brute forcing on long inputs needs a lot of computational power
> - A node, to earn currency, must propose a new block B incorporating the hash of the previous block pB concatenated with a *nonce*.
>   - *Hash(pB ||nonce) = H*
>   - The new block is valid if *H < T*, for a threshold T
> - *In other words*, *Hash(pB ||nonce)* shall contain at least a certain number of 0s at the beginning.
> - After finding (x=(pB,nonce),Hash(x)=0000…), the proposed block contains the hash pair (x,Hash(x)), the txs (taken from a pool of received transactions) and *the coinbase transaction*. Consensus nodes, upon block validation, will append the new block to the chain.

![Lecture 16, page 12](L16_p12.webp "50% 1400x400")

**Figure.** The previous block **pB**, a box with a "**Prev. Hash**" field and several transactions ("**Tx**, **Tx**, …, **Tx**"), and a "**Nonce**" box are the **input** of a "**Hash Function**"; its **output** is "**000…000XXXXXXXXXXXXXX**", and a brace under the leading zeros is labelled "**PoW Threshold**".

**Expansion.** The puzzle: find a **nonce** (a number used once) such that the hash of the previous block concatenated with the nonce is **below a threshold T**, which is the same as saying that the hash starts with a given number of zeros. Since the hash output is unpredictable, the only strategy is to try nonces one by one; each attempt succeeds with probability about T/2²⁵⁶, so the expected work is set by T. The solution is **hard to find but trivial to verify**: any node checks it with a single hash computation. The winner publishes the block with the pair (x, Hash(x)), the transactions taken from the pool of pending ones and its coinbase transaction; the other nodes verify it and append it. Bitcoin adjusts the threshold every 2016 blocks so that a block is found about every 10 minutes whatever the total computing power. The same mechanism protects history: rewriting an old block means redoing the proof-of-work of that block and of all the following ones, faster than the rest of the network, which is infeasible without the majority of the computing power (Slide 10).

### Slide 13 · Proof-of-work

![Lecture 16, page 13](L16_p13.webp "50% 1400x865")

**Figure.** A **Block proposer** (person icon) sends a dotted box with "**prevHash**=0000010101…, …, CB-tx=(mint, **10ETH**, A, σ)" (10ETH in red) to the consensus icon, above which is written "**check if** *prevHash = Hash(pB||nonce)*". An arrow goes from the consensus icon down to the new block at the head of the chain. The chain, with arrows to the left: a block "…" (A.Balance = 3, B.balance = 3); **Block pB**, with "… Tx1=(pay,A,B,1,σ)" (A.Balance = 2, B.balance = 4); the new block, with "**prevHash**=0000010101…, …, CB-Tx=(mint, **10ETH**, A, σ)" (A.Balance = **12** in red, B.balance = 4).

**Expansion.** The whole cycle on one picture. Proposer A has found a nonce for which the hash of block pB starts with zeros, and proposes a new block containing that **prevHash** and its **coinbase transaction** "mint 10 to A", signed by A. The nodes **check** that prevHash really equals *Hash(pB||nonce)* (one hash computation) and that the block's transactions are valid; then they append the block, and the minted coins appear in A's balance (from 2 to 12). The slide uses ETH for the reward, but the mechanism is Bitcoin's (and Ethereum's until 2022, Slide 27).

## Ethereum smart contracts (pages 14-26)

### Slide 14 · Ethereum Smart Contracts - Programmable Money

> - Any user with an account can deploy a turing-complete program (*contract*) through a blockchain transaction.
>   - The *Contract C* is an account of his own (it has an address)
>   - Users interact with the contract by sending contract transactions, including currency
>   - Blockchain and contract states are calculated by the nodes within the *Ethereum Virtual Machine*
> - Smart Contract functions provide an interface to
>   - exchange ETH under certain conditions
>   - Manage an *immutable database*
> - They enable a lot of interesting applications:
>   - *Alternative currencies:* **Alternative tokens** with some ETH value.
>   - Decentralized Finance (DeFi)
>   - Decentralized Autonomous Organizations (DAO)
>   - *NFT*: A unique ID assigned to the token guarantees its non-fungibility.
>     - Include data such as images: Decentralized Art.
>   - Decentralized Notaries
>   - …

**Figure.** The Ethereum logo on the right of the slide.

**Expansion.** **Ethereum** (proposed by Vitalik Buterin in 2013, live since 2015) generalised Bitcoin's scripts into **smart contracts**: programs in a Turing-complete language, usually **Solidity**, compiled to bytecode for the **Ethereum Virtual Machine (EVM)**. Key facts:

- A contract is deployed by a transaction and then lives at its own **address**, with its own **balance** of ether and its own **storage**: it is an account controlled by code instead of by a private key.
- Users call its functions by sending **transactions** to that address, possibly with ether attached; **every node** executes the call in its EVM, so all nodes compute the same new state (Slides 17-26).
- Once deployed, the code is **immutable** (it cannot be patched) and **public** (anyone can read it and call it).

The applications: **tokens**, alternative currencies managed by a contract (the ERC-20 standard); **DeFi**, decentralized exchanges, lending and stablecoins run entirely by contracts; **DAOs**, organisations whose rules and treasury are contracts (the DAO of Lecture 17); **NFTs**, tokens with a unique identifier, used to represent ownership of a unique item such as a digital artwork; and decentralized notaries, the example of this lecture (Slide 21). The common point is that **code directly controls money**: a bug is not a crash but a theft (Lecture 1, Slides 16-17 and 29-31).

### Slide 15 · Basic Token Smart Contract

\`\`\`
Contract Token {
    int tknvalue;
    map balance (address=>int)
    …
    void deploy(int v) { tkn = v; }
    //Function to exchange ETH with Tokens
    void exchange (int quantity) payable {
    //sender.sent internal variable outputting the number of ETH sent together with the function input
        If (sender.sent >= quantity*tknvalue) balance[sender] += quantity*tknvalue
        }
    //Auxiliary function to retrieve the current user balance
    int getBalance() { return balance[sender]; }
}
\`\`\`

**Code analysis.** Pseudo-code (Java-like, not real Solidity) of a minimal token contract, used in the execution example of Slides 16-20.

- *What it does.* The state is the **price** of one token in ETH (\`tknvalue\`) and a **map from addresses to token balances**. \`deploy(v)\` runs once, when the contract is created, and sets the price (it plays the role of a constructor). \`exchange(quantity)\` is **payable**, so it receives ETH with the call: if the ETH sent (\`sender.sent\`, \`msg.value\` in Solidity) covers \`quantity*tknvalue\`, the caller's token balance is increased. \`getBalance()\` returns the caller's balance.
- *Problems to spot* (the exam-style reading of the code):
  1. \`deploy\` assigns \`tkn = v\`, but the state variable is called \`tknvalue\`: as written, the price is never set. If the price stayed 0, anyone could buy any quantity of tokens for free, because \`sender.sent >= quantity*0\` always holds.
  2. The balance is increased by \`quantity*tknvalue\`, the **ETH value**, not by \`quantity\`, the number of tokens: in the execution example (Slides 18-19), \`exchange(2)\` with a price of 10 gives \`balance[A]: 2\`, which matches \`+= quantity\`.
  3. \`quantity*tknvalue\` can **overflow**: with a huge \`quantity\` the product wraps around to a small number, the payment check passes and the attacker is credited a huge number of tokens. This is exactly the BatchOverflow bug of 2018 (Lecture 1, Slides 16-17; arithmetic issues, Lecture 8, Slides 30-33). With signed \`int\`, a negative \`quantity\` is also accepted.
  4. If the check fails nothing happens, but the ETH sent stays in the contract; and with \`>=\` any excess payment is kept too. In Solidity a failed check should **revert** the transaction, which also returns the ETH.
- *In Solidity*, a corrected version (since Solidity 0.8, arithmetic overflow reverts automatically):

\`\`\`solidity
contract Token {
    uint public tknvalue;                         // price of one token, in wei
    mapping(address => uint) public balance;

    constructor(uint v) { tknvalue = v; }

    function exchange(uint quantity) external payable {
        require(msg.value == quantity * tknvalue, "wrong payment");   // otherwise revert and refund
        balance[msg.sender] += quantity;
    }

    function getBalance() external view returns (uint) {
        return balance[msg.sender];
    }
}
\`\`\`

### Slide 16 · Contract deployment

> - Bob deploys a new contract to the Blockchain through containing:
>   - The code
>   - The value of the contract (currency)
>   - The issuer signature

![Lecture 16, page 16](L16_p16.webp "50% 1400x621")

**Figure.** A stick figure, the "**Contract issuer**", sends "**(deploy,T,code,10,σ)**" with an arrow to the consensus icon, labelled "**Blokchain nodes**", which thinks (cloud) "**T is valid**".

**Expansion.** Deploying a contract is itself a **transaction**: (deploy, T, code, 10, σ) carries the contract's code, a value (10) and the issuer's signature σ, the three items of the bullet list. The nodes check it like any transaction (valid signature, enough balance) and the contract gets its own address. In Ethereum, the deployment transaction carries the compiled bytecode and the constructor's arguments, it can transfer ether to the new contract, and the creator pays the cost of deployment in gas (Slide 26). In the example, once deployed the contract's state holds the token price \`tknvalue: 10\` (Slide 17).

### Slide 17 · Contract execution

> The block proposer will include the new contract to the block

![Lecture 16, page 17](L16_p17.webp "50% 1400x759")

**Figure.** The **Block proposer** (person icon) sends a dotted box with "TxA=…, TxB=…, …, (deploy,code,*T*,10,σ), (T,code)" to the consensus icon; an arrow goes down to the new block at the head of the chain ("…" ← "…" ← new block). The new block contains "TxA=…, TxB=…, …, (deploy,code, *T* ,10,σ), (C,code)", and below it the resulting state: "A.Balance: 20ETH", "B.Balance: …", "T.state = {*tknvalue*: 10}".

**Expansion.** Like any transaction, the deployment enters the chain when a block proposer includes it in a block. From then on the contract **exists on chain**: its code and its **state** are part of the blockchain state that every node keeps, here the token price \`tknvalue: 10\` set by \`deploy\`. (The block contains the pair (contract, code); the slide writes it once as (T,code) and once as (C,code).)

### Slide 18 · Contract execution

> All the nodes will run \`exchange(2)\` triggered by A to agree on the function output

![Lecture 16, page 18](L16_p18.webp "50% 1400x697")

**Figure.** **A** (stick figure) sends "**(T,exchange,2,σ)**" to the consensus icon, which thinks: "\`T.state: { balance[A]: 2} T.balance: 20ETH; A.balance: 0\`".

**Expansion.** Calling a contract is a transaction too: A sends (T, exchange, 2, σ), "call \`exchange(2)\` on contract T", with 20 ETH attached (2 tokens at 10 ETH each). There is no server that runs the contract: **every node runs the function** in its own EVM on the same input and state, and since the execution is **deterministic** all of them obtain the same result: A now owns 2 tokens, the contract holds the 20 ETH and A's ether balance is 0. This replication is what makes the result trustworthy without trusting any single node, and also why contract code must be deterministic (no randomness, no clock, no external data without an oracle).

### Slide 19 · Contract execution

> The block proposer will include the new state. To ensure validity, nodes re-run the code w.r.t the chain state

![Lecture 16, page 19](L16_p19.webp "50% 1400x724")

**Figure.** The **Block proposer** sends a dotted box "… **(T,exchange,2,σ)**" to the consensus icon. Above the middle block, in red, "A.Balance: 20ETH", then "B.Balance: …". The chain: "…" ← block "TxA=…, TxB=…, …, (T, code), …" ← new block "… **(T,exchange,2,σ)**". Below the new block, in red, "A.balance: 0", "T.balance: 20ETH", and in bold "**T.*state:* {…,balance[A]: 2}**".

**Expansion.** The proposer includes the call in a new block together with the resulting state. The other nodes do not take the proposer's word for it: each one **re-executes** the transaction on the previous chain state and accepts the block only if it obtains the same new state. A dishonest proposer who wrote, say, \`balance[A]: 2000\` would be rejected. This is public verifiability (Slide 10) applied to computation.

### Slide 20 · Contract execution

> Nodes will reject the transaction if Alice does not have enough ETHs to exchange 2 tokens (10 ETHs)

![Lecture 16, page 20](L16_p20.webp "50% 1400x791")

**Figure.** The **Block proposer** sends "… **(T,exchange,2,σ)**" to the consensus icon, which answers with a speech bubble "**REJECT**" (in red). The chain: a block "… Tx1=(pay,A,B,10,σ) …" ← a block "…"; next to the chain, "A.Balance: 10ETH" (in red), "B.Balance: …", "T.*state* = {*tknvalue*: 10}".

**Expansion.** The other case: Alice has already paid 10 ETH to B, so she has only 10 ETH left, less than the 20 ETH needed for 2 tokens at 10 ETH each. The transaction is invalid and every node rejects it. In a real contract this check is written in the code (\`require(msg.value == ...)\`), and a failing check **reverts** the whole call: none of its effects remain, although the gas spent is still paid (Slide 26).

### Slide 21 · Simple Notary Smart Contract

\`\`\`
Contract Notary {
    \\\\ Variables containing parameters for notarization
    string document;
    boolean notarized;
    …
    \\\\ deployment info, taking as inputs notarization parameters
    void deploy( … ) {
    notarized=false; … }
    \\\\Function to be triggered by the user
    void notarize ( string D, … ) {
        if (checkValidity(document,…)) {
        document = D;
        notarized = true }}
    \\\\ Checks that wether contract can be notarized, i.e. document is well written, involved parties signed the document, etc.
    boolean checkValidity(string s, …) { if (…) return true }
}
\`\`\`

**Code analysis.** Pseudo-code of the decentralized notary that solves the problem of Slide 2 (the comments are written with \`\\\\\` instead of \`//\`).

- *What it does.* The state is the notarized \`document\` and a flag \`notarized\`. \`deploy\` creates the contract with the notarization parameters (who the parties are, ...) and \`notarized = false\`. \`notarize(D, …)\`, called by a user, stores \`D\` and sets \`notarized = true\` if \`checkValidity\` succeeds; \`checkValidity\` stands for the checks a notary makes (the document is well formed, the parties have signed it, ...).
- *Problems to spot:*
  1. **It validates the wrong document.** \`notarize\` calls \`checkValidity(document, …)\`, the document already stored (initially empty), not the new argument \`D\`, and then stores \`D\`: what is checked is not what is used, so an invalid \`D\` is notarized whenever the check on the old value passes. Always validate exactly the data you are going to use (Lecture 5; the check/use mismatch is the same pattern as the TOCTOU bugs of Lecture 11).
  2. **No protection against re-notarization.** Anyone can call \`notarize\` again later and **overwrite** a notarized document: there is no \`require(!notarized)\` and no access control on who may call it, which breaks the "untamperable archive" requirement.
  3. \`checkValidity\` returns \`true\` when the condition holds but has no \`return false\` path.
  4. **Everything on chain is public**: the full text of a private contract would be visible to everyone; real notarization contracts store only a **hash** of the document (Lecture 17, Slide 11).
- *In Solidity*, the core of a corrected \`notarize\`:

\`\`\`solidity
function notarize(string calldata D) external {
    require(!notarized, "already notarized");
    require(checkValidity(D), "invalid document");   // validate what you store
    document = D;
    notarized = true;
}
\`\`\`

### Slide 22 · Contract deployment

> All the nodes will check the contract validity

![Lecture 16, page 22](L16_p22.webp "50% 1400x699")

**Figure.** **B** (stick figure) sends "**(deploy,code,*N*, σ)**" to the consensus icon, which thinks (cloud) "**N is valid**".

**Expansion.** The notary contract N is deployed exactly like the token contract (Slide 16): B sends a deployment transaction, signed by B, and the nodes check it.

### Slide 23 · Contract execution

> The block proposer will include the new contract

![Lecture 16, page 23](L16_p23.webp "50% 1400x694")

**Figure.** The **Block proposer** sends a dotted box "TxA=…, TxB=…, …, (deploy,code,*N*, σ), (N,code)" to the consensus icon; an arrow goes down to the new block at the head of the chain ("…" ← "…" ← "TxA=…, TxB=…, …, (deploy,code,*N*, σ), **(N,code)**").

**Expansion.** As on Slide 17: the deployment is included in a block, and from then on contract N, its code and its state are part of the chain.

### Slide 24 · Contract execution

> All the nodes will run \`notarize(D, …)\` and agree on the new state of the contract N.

![Lecture 16, page 24](L16_p24.webp "50% 1400x675")

**Figure.** **A** (stick figure) sends "**(N,notarize,D,…,σ)**" to the consensus icon, which thinks: "\`N.state = (document: D notarized: true)\`".

**Expansion.** Alice asks for the notarization of her document D by calling \`notarize(D, …)\` on contract N. All the nodes run the function and agree on the new state: document D, notarized. The roles of Slide 2 are now played by code and consensus: the **notary** is the contract's validation logic, which nobody can bribe (but which can have bugs, Slide 21), and the **archive** is the blockchain, public and untamperable as long as the honest-majority assumption holds.

### Slide 25 · Contract execution

![Lecture 16, page 25](L16_p25.webp "50% 1400x751")

**Figure.** The **Block proposer** sends "TxA=…, TxB=…, …, (N,notarize,D,…,σ)" to the consensus icon; the chain: "…" ← "… TxA=…, TxB=…, …, (N,code)" ← new block "… TxA=…, TxB=…, …, **(N,notarize,D,…,σ)**". Below the new block, in bold: "**N.*state* = { document: D, notarized: true }**".

**Expansion.** The notarization is recorded in a new block together with the new state of N; from now on anyone can check, by reading the chain, that document D was notarized and in which block, that is, when.

### Slide 26 · Contract execution: GAS

> In reality, triggering transaction has a cost (GAS) based on the number of instructions the nodes have to run

![Lecture 16, page 26](L16_p26.webp "50% 1400x691")

**Figure.** As on Slide 25, with balances. Under the block with "(N,code)": "A.Balance: 3", "B.Balance: …". Under the new block with "**(N,notarize,D,…,σ)**": "A.Balance: **2.9**" (2.9 in red), "B.Balance: …", "N.*state* = { document: D, notarized: true }".

**Expansion.** Every node executes every call, so computation on chain is expensive, and it is paid for with **gas**: each EVM instruction has a fixed gas cost (storage writes are among the most expensive), and the caller pays the gas used times a gas price, in ether (here A's balance drops from 3 to 2.9). Gas has a security role too: since the language is Turing-complete, a call could loop forever, and the **gas limit** set by the caller guarantees that every execution stops; if the gas runs out, the call is reverted but the gas is still paid. This also makes denial-of-service attacks on the network costly, and it creates a class of contract bugs of its own: a loop over a list that grows with the number of users can eventually exceed the block gas limit and become impossible to execute.

## Proof of stake and takeaways (pages 27-28)

### Slide 27 · Alternative Consensus Mechanism - Proof of Stake

> Stake is an amount of crypto-commodities invested into the system
>
> - Locked via a special transaction, or sent to a specific address
> - Cannot be spent
>
> Rationale
>
> - The more is left at stake by users, the less likely they would want to subvert the blockchain
> - Validators place their "bet" on the chain(s) they deem true
> - If the block is appended, validators get a reward proportional to the bet
>
> No block mining (puzzle solving) reward
>
> - But also nothing to lose! (No expenses due to hardware and energy consumption)
>
> Block proposers' election probability depends on their stake value

**Expansion.** **Proof-of-stake** replaces computing power with **locked money**. Validators lock a **stake** (in Ethereum, 32 ETH per validator) that they cannot spend while it is locked; block proposers are chosen at random with probability proportional to their stake, and the others attest to (vote for) the blocks they consider valid, earning rewards. The rationale: those with a lot at stake have the most to lose if the blockchain is subverted. Compared with proof-of-work there is no energy-hungry puzzle (Ethereum's switch to proof-of-stake, "the Merge" of September 2022, cut its energy use by more than 99%), but the slide's "nothing to lose" is the classic weakness, the **nothing-at-stake problem**: voting costs nothing, so a validator could vote for several competing chains at once. Modern protocols counter it with **slashing**: a validator caught signing conflicting blocks loses part of its stake. The security assumption changes accordingly, from an honest majority of computing power to an honest majority (or two thirds) of the stake (Slide 10).

### Slide 28 · Takeaways

> - Smart contracts are written by developers:
>   - It can be prone to most of the known software vulnerability!
>   - Software security is even more critical when dealing with currencies
>   - New attacks related to the new contexts can come out
>   - In practice, a smart contract is nothing more than a piece of code running on top of a Virtual Machine.
>     - With the knowledge of the underlying architecture (e.g., Ethereum Blockchain) and the (E)VM environment, symbolic analysis and fuzz testers can be implemented as well by adapting the standard techniques to this new environment.
> - Software vulnerabilities led to destructive attacks:
>   - DAO Attack: $150 million worth of ethers stolen due to a smart contract bug
>     - By carefully exploiting smart contract callbacks, the attacker could change smart contract ownership to any account of his choice.
>     - https://www.coindesk.com/consensus-magazine/2023/05/09/coindesk-turns-10-how-the-dao-hack-changed-ethereum-and-crypto/

**Expansion.** The link with the rest of the course. Smart contracts are **ordinary programs written by ordinary developers**, so they suffer from the usual vulnerability classes: integer overflows (Slide 15; Lecture 8), missing input validation and access control (Slide 21; Lectures 5 and 10), race-like interleavings (Lecture 11). Three features make them more critical: the code **handles money directly**, it is **public**, so attackers can study it at leisure, and it is **immutable**, so a bug cannot simply be patched. The context also creates **new attack classes**, the best known being **re-entrancy** (Lecture 17). The defences are the ones of Lectures 6 and 7, adapted to the EVM: static analysers and symbolic execution tools for Solidity and EVM bytecode (for example Slither and Mythril), fuzzers for contracts (Echidna), and formal verification of high-value contracts. The **DAO attack** (June 2016) is the cautionary tale: the DAO, a decentralized investment fund, had collected about $150 million in ether, and an attacker drained about a third of it (3.6 million ether) by exploiting its callbacks to re-enter the withdrawal ("split") function before the balance was updated; the full story is the subject of Lecture 17.
`;export{e as default};
