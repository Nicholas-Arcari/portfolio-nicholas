Lecture 18 introduces the programming of smart contracts in **Solidity**, the main language of Ethereum. The slides come from the online course "Decentralized Finance" (defi-learning.org, given by Berkeley with Stanford, Imperial College London and the University of Illinois; this lecture is by Andrew Miller). They present smart contracts from the programmer's point of view (objects on the blockchain with code, storage and methods, through a domain-name registry), the basics of Solidity (types, mappings, functions, constructors, visibility and mutability modifiers, events, calls between contracts, the native currency, block metadata), a case study (the Dutch auction of CryptoKitties), **gas** (the fee for computation and the out-of-gas exception), the comparison between legal contracts and smart contracts (Szabo's definition), **tokens** (fungible ERC-20 and non-fungible ERC-721), a run-through of a test-network wallet and, at the end of the deck, extra slides on Solidity data types and integer conversions. The lecture extends the crash course of Lecture 16 and gives the language background of the re-entrancy attack of Lecture 17; throughout these notes, the code is also read with the eyes of an attacker. The slide deck has 72 pages.

## Smart contracts from the programmer's perspective (pages 1-14)

### Slide 1 · Title slide

> **Decentralized Finance**
>
> Introduction to Smart Contracts
>
> Instructor: Dan Boneh, Arthur Gervais, **Andrew Miller,** Christine Parlour, Dawn Song

Below the names the slide shows the photos of the five instructors and the logos of Stanford University, Imperial College London, the University of Illinois Urbana-Champaign and the University of California, Berkeley (not reproduced in these notes).

**Expansion.** The deck is the "Introduction to Smart Contracts" lecture of the MOOC "Decentralized Finance" (2021); the name in bold, Andrew Miller, is the instructor of this lecture. **DeFi** (decentralized finance) means financial services, such as exchanges, lending and stablecoins, implemented as smart contracts instead of being run by banks.

### Slide 2 · Outline

> - ***What are smart contracts?***
>
>   They're neither smart nor contracts!
>
>   Developer's perspective: Program objects on the blockchain
>
> - ***Basics of Solidity programming in Ethereum***
>
>   Just enough to follow the DeFi examples later
>
> - ***Case Study: The Dutch Auction from CryptoKitties***
> - ***Comparing Legal Contracts and Smart Contracts***

**Expansion.** "Neither smart nor contracts": a smart contract is not intelligent (it executes exactly its code, bugs included) and it is not a legal contract (no court enforces it: what is enforced is the code). For a developer it is an **object**: code plus persistent state, stored on the blockchain at an address, whose methods are invoked by transactions.

Page 3 is the section divider "Part 1: Smart Contracts from Programmer Perspective".

### Slide 4 · Digital currencies: just one blockchain application

![Lecture 18, page 4](L18_p04.webp "50% 1400x592")

**Figure.** On the left, **Users** (a group of person icons) exchange **Money** (a pile of coins on a two-way arrow) with a box labelled **Decentralized Consensus "Blockchain"**. The box contains **Account Balances**: Alice: ฿10, Bob: ฿15, Carol: ฿120. Several copies of the box are stacked behind it, and on the right a small chain of blocks with a short side branch.

**Expansion.** A cryptocurrency such as Bitcoin is a blockchain whose shared state is only a table of balances and whose only operation is a transfer. The consensus protocol (Lecture 16) makes all the nodes, the stacked copies of the drawing, agree on the same table without a trusted bank; the side branch in the chain is a fork, which consensus resolves.

### Slide 5 · Smart Contracts: user-defined programs running on top of a blockchain

![Lecture 18, page 5](L18_p05.webp "50% 1400x583")

**Figure.** The same picture as Slide 4, but the blockchain box now contains **Contracts** (in red): each contract is a box with its **Code** (pink) and its **Storage** (a database cylinder), with an arrow from the code to the storage. The users exchange with the blockchain both **Money** and **Data** (two arrows).

**Expansion.** Ethereum generalizes Bitcoin: besides balances, the shared state contains programs, the contracts, each with its own storage. A transaction can call a function of a contract, passing data and money; every node executes the code (in the Ethereum Virtual Machine, Slide 18) and applies the same changes, so the result is agreed by consensus. For security this has strong consequences: the code is public, it cannot be changed once deployed, it handles real money, and anyone in the world can call it with any input. Contracts are therefore an ideal target for attackers (Lectures 16 and 17).

### Slides 6-9 · Example: Domain Name Registry in Ethereum

```solidity
pragma solidity ^0.5.0;

contract MyRegistry {

    mapping ( string => address ) public registry;

    function registerDomain(string memory domain) public {
        // Can only reserve new unregistered domain names
        require(registry[domain] == address(0));

        // Update the owner of this domain
        registry[domain] = msg.sender;
    }
}
```

**Code analysis.** The four slides show the same code in the Remix editor (lines 1-14), each with a different part highlighted in pink: on Slide 6 the whole contract; on Slide 7 the `mapping` declaration, with a **Storage** cylinder drawn next to the code; on Slide 8 the function `registerDomain`, with a box labelled **Code**; on Slide 9 the two statements inside the function (lines 8-9 and 11-12).

- *What it does.* `pragma solidity ^0.5.0` selects the compiler version (0.5.x). The contract `MyRegistry` has one **storage** variable, `registry`, a mapping from domain names (strings) to owner addresses; `public` makes the compiler generate a getter `registry(string)` that anyone can call. The **code** is the function `registerDomain`: with `require` it checks that the name is still free (unassigned names map to the zero address, `address(0)`), and then it records the caller, `msg.sender`, as the owner. If the `require` fails, the whole transaction is reverted.
- *The model.* Slides 7 and 8 map the code onto the picture of Slide 5: the storage variables are the persistent state of the contract, kept on the blockchain; the functions are the code that transactions execute.
- *Weaknesses.* They are the topic of the question on Slide 14.

### Slide 10 · Example: Domain Name Registry in Ethereum

![Lecture 18, page 10](L18_p10.webp "50% 1400x629")

**Figure.** A user sends a request to the **Registry Contract** (a box with a storage cylinder and the method `registerDomain`): "invoke **`registerDomain`** with string "*defi.io*"". A group of other users exchanges messages with the contract (two-way arrow) to "query registry to look up the current owner".

**Expansion.** The two kinds of interaction with a contract. Registering a domain is a **transaction**: it changes the state, so it must be signed, included in a block and paid with gas. Looking up the owner is a **call** to a read-only function (the getter `registry`): any node answers it locally from its copy of the state, for free and immediately, and nothing is recorded on the chain.

### Slide 11 · Let's look at an instance on the Test Network

![Lecture 18, page 11](L18_p11.webp "50% 1400x637")

**Figure.** Screenshots of the Etherscan block explorer for the **Kovan Testnet Network**. On the left, the page of "Contract 0x12E9d045dD5cF027EEbad8fdC3454A1dcCC5d89D", section "Read Contract Information": the function "1. registry" with an input field "<input> (string)" containing `https://berkeley-defi.github.io/`, a **Query** button and the result "[ registry(string) method Response ] » address : 0x1B326Ad348e19ecFd1406C43D3bF7a95547AC55c". On the right: "Contract Source Code Verified (Exact Match)", "Contract Name: MyRegistry", and the **Logs** of a transaction: the event "Registered (address registrant, string domain)", "[topic0] 0xb3eccf73f39b1c07947c780b2b39df2a1bb…" (cut off), and the data decoded word by word: Addr → 0x1b326ad348e19ecfd1406c4… (cut off), Text → @, Text → (empty), Text → https://berkeley-defi.git… (cut off).

**Expansion.** The registry of Slides 6-9, extended with the event of Slide 25, deployed on Kovan, a test network whose ether has no value (Kovan and Ropsten were shut down in 2022; the main test network today is Sepolia).

- "Contract Source Code Verified (Exact Match)" means that Etherscan compiled the published source and obtained exactly the bytecode deployed at that address. Only then can users trust that the readable source is what the contract really does (Slide 53, "Mutuality").
- The query returns the owner of the domain `https://berkeley-defi.github.io/`: the address `0x1B32…C55c`, the instructor's account, which appears again on Slide 61.
- The logs show the event emitted by the registration. topic0 is the hash of the event signature (Slide 25), and the data are the ABI-encoded arguments, shown as 32-byte words decoded as text: the address of the registrant; `@`, which is the byte 0x40, the offset where the string starts; an "empty" word, which is the length of the string, 32 = 0x20, the code of a space; and then the string itself.

### Slide 12 · Interaction between Contracts

![Lecture 18, page 12](L18_p12.webp "50% 1400x540")

**Figure.** A group of users interacts (two-way arrow) with a **Joint Account Contract** (method `signRequest`, with a pile of coins). The joint account interacts with an **Auction Contract** (method `placeBid`; coins on the arrow), which in turn interacts with a **Digital Asset Contract** (method `transferToken`; above it a small pixel-art character, a digital collectible).

**Expansion.** Contracts can call each other: a joint account (for example a multi-signature wallet, which spends only with the approval of several owners) bids in an auction, and the auction transfers a digital asset (a token, Slides 57-62) to the winner. This **composability** ("money legos") is the basis of DeFi. It is also a source of attacks, because every call to another contract hands control to code that may be malicious: this is how re-entrancy works (Lecture 17).

### Slide 13 · Recap of contract programming model so far...

> - ***Contract class:*** Defines the program code and storage variables for a contract
> - ***Contract object:*** an instance of the class living on the blockchain
> - ***Storage fields:*** variables stored by the contract
> - ***Functions/methods***: can be invoked to run the given code, updating the state of the contract
> - ***Access control:*** Use "require()" to cancel the transaction if it isn't authorized. You can inspect the caller that invoked the function
> - ***Composition:*** interaction between multiple contracts

**Expansion.** The object-oriented analogy: the source code is a **class**; deploying it creates an **instance** with its own address and storage, and the same code can be deployed many times. Access control is not automatic: every public function can be called by anyone, unless the code itself checks the caller (`msg.sender`) with `require`. A missing check is the classic "unprotected function" vulnerability: in July 2017 an attacker took over Parity multi-signature wallets by calling their initialization function, which anyone could call, and stole about 150,000 ether.

### Slide 14 · Question: What's missing from the example?

> - What could go wrong here? How could you fix it
> - What other functionality would a useful domain name registry need to have?

**Code analysis.** Next to the questions, the slide shows again the code of `MyRegistry` (Slides 6-9, lines 1-14), unchanged.

- *What could go wrong.*
  - **Front-running.** Transactions wait in a public pool (the mempool) before being included in a block. An attacker who sees a pending `registerDomain("defi.io")` can send the same call with a higher gas price and be included first: the attacker gets the name and the victim's transaction fails at the `require`.
  - **Squatting.** Registration costs only the gas and names never expire, so anyone can register all the valuable names and resell them.
  - There is no way to **transfer**, release or renew a name: if the owner loses the private key, the name is lost forever. Names are not normalized, so `DeFi.io` and `defi.io` are different names, which allows look-alike names for phishing.
- *Fixes and missing functionality.* A **commit-reveal** registration: first send only a hash of the name and a secret, then, a few blocks later, reveal them; a front-runner cannot know the name in time. Make registration cost something and expire (a yearly fee), add functions to transfer and renew a name, protected by `require(registry[domain] == msg.sender)`, emit events for every change, and resolve names to useful data (addresses, content hashes). This is how the Ethereum Name Service (ENS) works: `.eth` names are registered with a commit-reveal process and a yearly fee.

## Ethereum programming basics (pages 15-30)

Pages 15 and 16 are the section dividers "Introduction to Smart Contracts - Part 2: Ethereum programming basics - Just enough to follow the Defi examples later" and "Part 2: Ethereum programming basics - Just enough to follow the Defi examples".

### Slide 17 · Outline and background

> No programming experience required, but might help
>
> Focus on the unique parts of Solidity
>
> ***Outline:***
>
> - Solidity and EVM bytecode
> - Data types
> - Functions and constructors
> - Visibility/mutability modifiers
> - Accessing blockchain metadata
> - Working with the built-in currency
> - Events and interaction between contracts
>
> Saved for next time: Gas

**Expansion.** The plan of Slides 18-29. "Next time" refers to the next lecture of the original course; in this deck gas follows a few slides later (Slides 39-49).

### Slide 18 · Solidity and Ethereum Bytecode

![Lecture 18, page 18](L18_p18.webp "43% 782x743")

**Figure.** Two boxes joined by a thick downward arrow: "**Solidity program** High level language" above, "**Ethereum Virtual Machine (EVM) Program** Low level bytecode" below.

On the right of the slide, a screenshot of the first eight lines of `MyRegistry` (Slides 6-9), cut off at the right edge, and below it a listing of EVM bytecode in mnemonic form, cut off at both edges:

```text
REVERT JUMPDEST POP PUSH2 0x303 DUP1 PUSH2
PUSH1 0x4 CALLDATASIZE LT PUSH2 0x78 JUMPI
0x1000000000000000000000000000000000000000
0x7D JUMPI DUP1 PUSH4 0x1D0806AE EQ PUSH2
PUSH2 0xDD JUMPI DUP1 PUSH4 0xD3642A88 EQ
DUP1 REVERT JUMPDEST PUSH2 0x85 PUSH2 0x18
DUP1 REVERT JUMPDEST POP PUSH2 0x9C PUSH2
```

**Code analysis.**

- *What it shows.* The compiler (`solc`) translates the Solidity source into bytecode for the EVM, a stack machine; the bytecode is what is stored on the chain and executed by every node. The fragment is part of the **dispatcher**, the code that runs first at every call: `PUSH1 0x4 CALLDATASIZE LT` checks whether the input of the call (the call data) is shorter than 4 bytes; the long constant, a power of 2, serves to shift the call data and keep its first 4 bytes, the **function selector** (the first 4 bytes of the Keccak-256 hash of the function's signature); the sequences `PUSH4 0x1D0806AE EQ … JUMPI` and `PUSH4 0xD3642A88 EQ … JUMPI` compare it with the selectors of the contract's two public functions (`registerDomain` and the getter `registry`) and jump to the corresponding code. If nothing matches, the call ends with `REVERT`.
- *Why it matters for security.* What runs is the bytecode, not the source: analysis tools (decompilers, symbolic executors such as Mythril) and attackers work on it, and the source is trustworthy only when it is verified against it (Slide 11). Gas is also charged per bytecode instruction (Slide 45).

### Slide 19 · Solidity and Data Types

> Solidity is statically typed
>
> Like Java, C, Rust….. unlike python or javascript
>
> Example:
>
> - **Integers**: uint (unsigned 256-bit integer)
>
>   int (signed 256-bit integer)

```solidity
/* Initialize ten users */
for (uint i = 0; i < 10; i++) {
    users[i].balance = 1;
}
```

**Code analysis.**

- *What it does.* A loop with a `uint` counter that sets to 1 the `balance` field of the first ten elements of `users` (an array or mapping of structs declared elsewhere).
- *The types.* The word of the EVM is 256 bits, so `uint` means `uint256` and `int` means `int256`. Types are checked at compile time (as in Lecture 19, part 2), but static typing does not prevent arithmetic overflow: before Solidity 0.8 integers silently wrapped around (Slide 69), the cause of the token vulnerabilities listed in Lecture 1 (Slides 16-17).
- *Gas.* Each iteration costs gas, and here each one writes to storage, the most expensive operation (Slide 43). A loop over a list that users can make arbitrarily long can exceed the gas limit of a block and make the function impossible to execute (Slide 41).

### Slide 20 · Mapping data types

> - *Mapping*: a key value storage / hash table
> - Every key is initially mapped to zero
> - There is no built-in way to query the length of a mapping, or iterate over its non-zero elements. A separate variable can be used

```solidity
mapping ( string => address ) public registry;
```

**Code analysis.** On the slide an arrow labels `string` as "Key type" and another labels `address` as "Value type".

- *What it does.* The declaration of the registry of Slides 6-9: a mapping from strings to addresses.
- *How it works.* The keys are not stored anywhere: the value for a key is kept at a storage location computed by hashing (Keccak-256) the key together with the position of the mapping. Every one of the 2^256 possible locations exists and contains zero until it is written. Hence "every key is mapped to zero", and there is no list of keys to count or to iterate over: if needed, the contract must keep a counter or an array of keys itself (Slide 71), paying the gas for it.
- *Consequence.* Zero doubles as "absent": the registry treats `address(0)` as "not registered", which works because no one can send transactions from the zero address.

### Slide 21 · Function signatures

```solidity
function getCurrentPrice(int slidingWindowSize) public view
    returns(int price, int confidence) {

    /** Compute the current price using on-chain data
     ... */

}
```

**Code analysis.** On the slide arrows label the parts of the declaration: "Name" (`getCurrentPrice`), "Arguments" (`int slidingWindowSize`), "Visibility Modifier" (`public`), "Mutability Modifier" (`view`) and "Return types" (`returns(int price, int confidence)`).

- *What it does.* It declares a function that computes a price from data on the blockchain (the body is omitted) and returns two named values: Solidity functions can return several values at once.
- *Security note.* A price computed from on-chain data, for example from the reserves of a decentralized exchange, can be manipulated within a single transaction by an attacker who borrows a large amount with a flash loan. Averaging the price over a time window (the "sliding window" of the argument) makes the manipulation much more expensive: price-oracle manipulation is one of the main classes of DeFi attacks.

### Slide 22 · Constructors

> Invoked when initially creating the contract
>
> Used to customize settings or give an initial state

```solidity
contract BoardAction {

    address public president;
    address public vicePresident;

    constructor(address initialPresident, address initialVP) public {
        /** initialize the contract **/
        president = initialPresident;
        vicePresident = initialVP;
    }
}
```

**Code analysis.** The code is lines 42-52 of a file; the keyword `constructor` is highlighted.

- *What it does.* The constructor runs once, in the transaction that deploys the contract: its arguments set the two public addresses. After deployment the constructor code is not part of the contract and cannot be called again.
- *Security note.* Before Solidity 0.4.22 the constructor was the function with the same name as the contract. A typo in the name, or renaming the contract, turned it into an ordinary public function that anyone could call to become the owner: it happened to the Rubixi contract, renamed from DynamicPyramid while its constructor was still called `DynamicPyramid()`. The `constructor` keyword removes this class of bugs. (The `public` visibility on the constructor was required in Solidity 0.5 and 0.6 and is no longer used since 0.7.)

### Slide 23 · Visibility modifiers

> For functions:

```solidity
function calledByAnyone() public { /* anyone can call */ }

function calledInternally() internal { /* only called by another
                                          function in this contract */ }
```

> For instance variables:

```solidity
int public myPublicField; /* A getter method is
                             automatically created */

int private myPrivateField; /* No getter method is
                               provided */
```

> Question: could **`myPrivateField`** hold a secret value?

**Code analysis.** On the slide the modifiers `public`, `internal`, `public` and `private` are highlighted.

- *What it does.* A `public` function can be called by anyone (by transactions, by other contracts and internally); an `internal` one only from this contract and from contracts that inherit from it (Solidity also has `external`, callable only from outside, and `private`, callable only from this contract). For state variables, `public` makes the compiler generate a getter, `private` does not, and also hides the variable from derived contracts.
- *The question.* **No.** `private` restricts access by *the code of other contracts*, not the visibility of the data. The whole storage of every contract is part of the blockchain state, copied at every node: anyone can read any storage slot (for example with the JSON-RPC method `eth_getStorageAt`) or find the value in the input of the transaction that wrote it, which is public. Passwords, keys or the secret number of a guessing game must never be stored in a contract, private or not: use a commit-reveal scheme (store only a hash and reveal the value later) or keep the secret off the chain. It is the difference between visibility modifiers and confidentiality pointed out in Lecture 20 (Slide 8).
- *Another pitfall.* Before Solidity 0.5 a function without a visibility modifier was `public` by default, so forgetting the modifier exposed internal functions; since 0.5 the visibility must be written explicitly.

### Slide 24 · Mutability modifiers

```solidity
function ordinary() public { /* can modify state and
                                call other functions */ }

function viewOnly() public view { /* can't modify any storage or
                                     call another non-view function */ }

function localOnly() public pure { /* doesn't even read any
                                      state either */ }
```

**Code analysis.** On the slide `view` and `pure` are highlighted.

- *What it does.* An ordinary function can read and change the state. A `view` function promises not to modify the state: no storage writes, no events, no ether sent, no calls to functions that are not `view` or `pure`. A `pure` function also promises not to read the state, so its result depends only on its arguments. The compiler checks these promises, and calls from other contracts to `view` and `pure` functions use the EVM instruction `STATICCALL`, which makes any attempt to change the state fail.
- *Why it matters.* `view` and `pure` functions can be called from outside the blockchain for free (Slide 10); called inside a transaction they still cost gas. And `view` does not mean harmless: in **read-only re-entrancy**, a contract calls the `view` function of another contract while that contract is in an inconsistent intermediate state (in the middle of a re-entrant call, Lecture 17), and makes decisions based on wrong values.

### Slide 25 · Events

> There are two main ways to observe the state of a contract:
>
> - Using ***view*** functions, such as getter functions for public fields
> - Looking at ***event logs***. Can "subscribe" to events of a contract

```solidity
event Registered(address registrant, string domain);

function registerDomain(string memory domain) public {
    // Can only reserve new unregistered domain names
    require(registry[domain] == address(0));

    // Update the owner of this domain
    registry[domain] = msg.sender;

    emit Registered(msg.sender, domain);
}
```

![Lecture 18, page 25](L18_p25.webp "49% 882x319")

**Figure.** Over the bottom right of the code, a piece of an Etherscan **Logs** panel: "Registered (address registrant, string domain)" and a decoded data line "Text → https://berkeley-defi.github.io/".

**Code analysis.** On the slide the event declaration and the `emit` statement are highlighted.

- *What it does.* The registry of Slides 6-9 now declares an event `Registered` and emits it at every registration. The event is recorded in the log of the transaction, with the hash of the event signature as first topic (topic0, visible on Slide 11) and the arguments as data.
- *Why events.* Logs are much cheaper than storage, and off-chain programs (wallets, web interfaces, Etherscan) can subscribe to them and react to changes instead of polling the `view` functions. Contracts cannot read logs: they are meant for the outside world.
- *Security note.* Events are the basis of monitoring and incident response (detecting an attack while it happens), so emitting an event for every important state change is a recommended practice. They are not a protection, however: they say what the code chooses to say, and a malicious token can emit a `Transfer` event without transferring anything.

### Slide 26 · Calling methods of other contracts

```solidity
abstract contract Token {
    function transferFrom(address from, address to, uint amount) public virtual;
}

contract Exchanger {
    Token tokenA = Token(address(0x000 /* Hardcoded address of existing token */ ));
    Token tokenB = Token(address(0x000 /* Hardcoded address of existing token */ ));

    function swap1(address Alice, address Bob) public {
        tokenA.transferFrom(Alice, Bob, 1);
        tokenB.transferFrom(Bob, Alice, 1);
    }
}
```

**Code analysis.** On the slide arrows point to "The interface for an external contract" (the `abstract contract Token`), the "Address of external contract instance" (the hardcoded addresses) and a "Method Call" (`tokenA.transferFrom(...)`).

- *What it does.* To call another contract, a contract needs its interface (here an abstract contract containing only the declaration of `transferFrom`; Solidity also has the keyword `interface`) and its address. `Token(address(...))` turns the address into a typed reference, and `tokenA.transferFrom(...)` compiles to a message call to that contract. `swap1` exchanges one unit of token A, from Alice to Bob, against one unit of token B, from Bob to Alice.
- *The vulnerability.* `swap1` is `public` and receives Alice and Bob as **arguments**: anyone can call it with any two addresses. `transferFrom` succeeds only if the owners have authorized the `Exchanger` to move their tokens (`approve`, Slide 62); but once they have, any third party can trigger swaps between them, at any moment and any number of times. Moreover, the results of `transferFrom` are ignored: with an ERC-20 token that reports failure by returning `false` instead of reverting, one half of the swap could fail silently while the other half succeeds.
- *Fix.* Take one party from `msg.sender` and require the consent of the other (for example a signed order), declare the real return type (`returns (bool)`) and check it, or use a wrapper such as OpenZeppelin's `SafeERC20`.
- *Note.* `abstract` and `virtual` are Solidity 0.6+ syntax, while Slides 6-9 use version 0.5: the deck mixes versions of the language.

### Slide 27 · Working with the native currency

```solidity
function acceptExactlyTwoEther() public payable returns(uint) {
    require(msg.value >= 2.0 ether);

    uint refund = msg.value - 2.0 ether;
    payable(msg.sender).transfer(refund);

    return address(this).balance;
}
```

> `1.0 ether` => 1000000000000000000 wei

**Code analysis.** On the slide `payable`, `msg.value`, `2.0 ether`, `.transfer` and `.balance` are highlighted.

- *What it does.* `payable` allows the function to receive ether together with the call (a call with ether to a function that is not `payable` is rejected); `msg.value` is the amount received. The function requires at least 2 ether, sends the excess back to the caller with `transfer`, and returns the balance of the contract, `address(this).balance`. The contract thus keeps exactly 2 ether.
- *Units.* Amounts are integers in **wei**: 1 ether = 10^18 wei, and 1 gwei = 10^9 wei. `2.0 ether` is just a way to write 2·10^18; there are no floating-point numbers.
- *Security notes.* The subtraction cannot underflow thanks to the `require`. `transfer` forwards only 2300 gas to the recipient and reverts if the payment fails: it used to be the recommended protection against re-entrancy (Lecture 17), but since gas costs can change (EIP-1884, 2019) it is now discouraged in favour of `call` combined with the checks-effects-interactions pattern or a re-entrancy guard. If the caller is a contract that rejects payments, the refund fails and so does the whole call (here this harms only the caller). Since Solidity 0.8 `msg.sender` is not payable by default, hence the conversion `payable(...)`.

### Slide 28 · Reading the current time

```solidity
function placeBid(int price) public {
    require(block.timestamp <= deadline);

    /** rest of the code for placing a bid **/
}
```

> Other metadata about the block are available too

**Code analysis.** On the slide `block.timestamp` is highlighted.

- *What it does.* It accepts bids only until a deadline (a storage variable), comparing it with the timestamp of the block that includes the transaction (Unix time, seconds since 1970).
- *Other metadata.* Among others `block.number`, `block.coinbase` (the address of the block producer), `block.chainid`, `blockhash(n)`, `msg.sender`, `msg.value`, `tx.origin` (the account that signed the transaction) and `gasleft()`.
- *Security notes.* The timestamp is chosen by the block producer within limits (before 2022 miners could shift it by some seconds; since the switch to proof of stake it is fixed by the 12-second slot), so it is fine for deadlines of hours, not for precise timing. Block data must never be used as a source of randomness: the producer can see and influence it, and any other contract in the same block computes the same values, which is how many on-chain lotteries were attacked. `tx.origin` must never be used for authorization: a malicious contract called by the victim would pass the check.

### Slide 29 · Other Solidity quirks and features

> - ***Storage, memory, calldata***
>
>   Compiler warnings often give recommendations to follow
>
> - ***Creating contracts programmatically***
> - ***Modifier macros*** e.g. onlyOwner
> - ***Calling another contract's code***
> - ***Inheritance and interfaces***
> - ***…..***
>
> Next time: Hands on writing and deploying a smart contract

**Expansion.**

- **Data locations.** `storage` is the persistent state on the chain (expensive: writing a new storage slot costs 20,000 gas), `memory` is temporary data for the duration of a call, `calldata` is the read-only input of an external call (the cheapest). Arrays, structs and strings must declare their location. Assigning a storage variable to a local variable declared `storage` creates a reference, so writing through it changes the state (aliasing, as in Lecture 19); assigning it to a `memory` variable makes a copy. Old compilers allowed uninitialized storage pointers, which pointed at slot 0 and silently overwrote other variables.
- **Creating contracts programmatically.** `new C(...)` deploys a new contract from inside a contract (factories); the `CREATE2` instruction makes the address of the new contract predictable.
- **Modifiers** are reusable checks attached to functions, for example `modifier onlyOwner() { require(msg.sender == owner); _; }`, where `_` stands for the body of the function; `function withdraw() public onlyOwner { ... }` then runs the check first. Forgetting the modifier on one function is a common access-control bug.
- **Calling another contract's code.** Besides typed calls (Slide 26) there are the low-level `call` and `delegatecall`. `delegatecall` runs the code of another contract *on the caller's storage*: it is used for libraries and upgradeable proxies, and it was at the heart of both Parity wallet incidents of 2017.
- **Inheritance and interfaces.** Contracts can inherit from several contracts and implement interfaces such as ERC-20 (Slide 62).

### Slide 30 · Quiz:

> What does this Solidity code do?
>
> What's wrong with it?

**Expansion.** In the PDF the slide contains only the two questions, without code: in the original lecture the code was shown live. The two questions are the right ones for every contract of this lecture: see the answers for the registry (Slide 14), the exchanger (Slide 26), the Dutch auction (Slide 35) and the token sale (Slide 52).

## Case study: the Dutch auction (pages 31-35)

Pages 31 and 32 are the section dividers "Smart Contract Case Study: Dutch Auction" and "Part 3a: Smart Contract Case Study - Dutch Auction".

### Slide 33 · CryptoKitties (news article)

> The first big NFT

![Lecture 18, page 33](L18_p33.webp "50% 1306x1017")

**Figure.** The slide has no title: it shows a news article with the headline "CryptoKitties is the Ethereum cat collecting game that's seen over $1m in user spending" and the subtitle "This is definitely what blockchain was invented for", above the picture of a yellow cartoon cat in a pink circle, with a purple Ethereum diamond above its head. A yellow starburst on the slide says "The first big NFT".

**Expansion.** CryptoKitties (by Axiom Zen, later Dapper Labs) was launched in November 2017: users buy, collect and breed digital cats, each of which is a non-fungible token (Slides 56-62). In December 2017 its transactions were a large share of all Ethereum traffic and congested the network, the first real demonstration of the limited capacity of Ethereum; the ERC-721 standard for non-fungible tokens grew out of it. The subtitle of the article is ironic.

### Slide 34 · Cryptokitties is based on Dutch Auctions

> The "Buy it Now" price is initially set at a largest value
>
> As time goes on, the "Buy it Now" price is lowered
>
> As soon as someone is ready to buy it, they announce their bid and win

![Lecture 18, page 34](L18_p34.webp "50% 1400x498")

**Figure.** The CryptoKitties sale page of a kitty (labelled "3.5/4 purrfect"): "Buy now price Ξ 0.0028", "Time left 1 day", an orange "Buy now" button, and a chart of the price falling along a straight line from "Started at Ξ 0.005" to "Price goes to Ξ 0.002", with a dot on the current price.

**Expansion.** In a **Dutch** (descending) **auction** the price starts high and decreases with time; the first bidder who accepts the current price wins and pays that price. It suits a blockchain well: a single transaction ends the auction, the contract does not have to store and compare many bids, and there are no sealed bids, which on a public chain would be visible to everyone unless a commit-reveal scheme were used. The weak point is that the price is fixed by the block in which the transaction is included, and that pending purchases are visible: another buyer can see a `buyNow` in the mempool and get in first with a higher gas price (front-running).

### Slide 35 · Dutch Auction in a few lines of Solidity

```solidity
contract DutchAuction {
    // Parameters
    uint public initialPrice; uint public biddingPeriod;
    uint public offerPriceDecrement; uint public startTime;
    KittyToken public kitty; address payable public seller;
    address payable winnerAddress;

    function buyNow() public payable {
        uint timeElapsed = block.timestamp - startTime;
        uint currPrice = initialPrice - (timeElapsed * offerPriceDecrement);
        uint userBid = msg.value;
        require (winnerAddress == address(0)); // Auction hasn't ended early
        require (timeElapsed < biddingPeriod); // Auction hasn't ended by time
        require (userBid >= currPrice); // Bid is big enough

        winnerAddress = payable(msg.sender);
        winnerAddress.transfer(userBid - currPrice);  // Refund the difference
        seller.transfer(currPrice);
        kitty.transferOwnership(winnerAddress);
    }
}
```

**Code analysis.**

- *What it does.* The storage holds the parameters of the auction (starting price, duration, price decrease per second, start time), the item on sale (`kitty`, a token contract with a `transferOwnership` method), the seller and the winner. `buyNow` computes the current price (the starting price minus the elapsed time multiplied by the decrement) and checks that nobody has won yet, that the auction is not over and that the ether sent covers the price. Then it records the winner, refunds the excess, pays the seller and transfers the kitty to the winner. The order follows the checks-effects-interactions pattern: `winnerAddress` is set before the external calls, so a re-entrant call to `buyNow` would fail the first `require` (Lecture 17).
- *What can go wrong.*
  - **Arithmetic.** If `biddingPeriod * offerPriceDecrement` is larger than `initialPrice`, near the end of the auction the subtraction goes below zero: before Solidity 0.8 `currPrice` wraps around to a huge number and nobody can buy; since 0.8 the call reverts. The parameters must be validated when the auction is created; in fact the contract has no constructor at all, so as written the parameters are never set, and the auction contract must be made the owner of the kitty beforehand.
  - **Denial of service by the seller.** `seller.transfer` reverts if `seller` is a contract that rejects payments or needs more than 2300 gas; then every `buyNow` fails and the kitty can never be sold. Safer: record the amount owed and let the seller withdraw it ("pull" instead of "push" payments).
  - **No ending.** If nobody buys before the deadline, no function returns the kitty to the seller.
  - **Front-running and time.** Pending purchases are public, so a competitor can overtake them with a higher gas price (Slide 34); block producers have a small influence on `block.timestamp`, hence on the price.
  - The winner is not `public` and no event announces the sale (Slide 25).

## Demo: coding and deploying with Remix (pages 36-38)

Pages 36 and 37 are the section dividers "Introduction to Smart Contracts - Part 3: Demonstration of Coding and Deploying Smart Contracts with Remix" and "Part 3b: Demo of Coding and Deploying Smart Contracts with Remix".

### Slide 38 · Remix demo (video)

**Figure.** The slide has no title: it is a frame of the video of the demo, not reproduced because it includes the presenter's webcam. It shows the Remix IDE in the browser (remix.ethereum.org). On the left the file `browser/helloworld.sol`, a small contract `Test` with a member variable, a `pure` function `test` returning the string "hello world", a public string `message` and a function `set` that changes it (the frame is too blurred to transcribe the code exactly). On the right the "Run" panel: gas limit 3000000, value 0 wei, the contract `Test` with the buttons Deploy and At Address, "Transactions recorded: 2", and under "Deployed Contracts" the instance "Test at 0x692…77b3a (memory)" with the button `set` (input "hello again WORLD"), `message` (output "0: string:") and `test` (output "0: string: hello world!"). At the bottom, the console with the decoded input, decoded output, logs and value (0 wei) of a transaction.

**Expansion.** Remix is the web IDE for Solidity: it compiles, deploys to an in-browser simulated chain ("memory") or to a real network through a wallet, lets the user call the functions with buttons and shows every transaction with its decoded input and output. It also includes a debugger (Slides 42-43) and static analysis plugins.

## Gas in Ethereum (pages 39-49)

Page 39 is the section divider "Part 4: Gas in Ethereum".

### Slide 40 · Each transaction has to pay a gas fee

> More complicated transactions consume more gas, so they cost more.
>
> source: ethgasstation.info

![Lecture 18, page 40](L18_p40.webp "50% 1400x618")

**Figure.** A dashboard of ethgasstation.info with three panels: "Transaction Count by Gas Price" (a bar chart of the percentage of transactions in five gas-price categories, from below 1 to above 50 gwei; most transactions are in the 20-50 category), "Confirmation Time by Gas Price" (time to confirm, in minutes, for gas prices of 1, 20, 21 and more than 40 gwei, all under a minute) and "Real Time Gas Use" (a gauge at 100, last block 12846402). Below, "Recommended Gas Prices in Gwei": 36 TRADER (< ASAP), 36 FAST (< 2m), 24.1 STANDARD (< 5m).

**Expansion.** Every operation costs an amount of **gas**, and the fee of a transaction is the gas used multiplied by the **gas price** (in gwei per unit of gas). Users choose the price, and block producers include first the transactions that pay more: the price is an auction for the limited space in blocks, which is why the site recommends a price for each confirmation speed. Since the London fork (EIP-1559, 2021) the fee is a **base fee** per unit of gas, set by the protocol and burned, plus a **priority fee** (tip) for the producer. Gas is first of all a security mechanism: the EVM is Turing-complete, so a node cannot know in advance whether a piece of code terminates (the halting problem); with gas every execution is bounded and paid for, which prevents denial of service by infinite loops and makes flooding the network expensive.

### Slide 41 · Miners limited by a global limit on gas per block

![Lecture 18, page 41](L18_p41.webp "50% 1039x903")

**Figure.** "Ethereum Average Gas Limit Chart" (Source: Etherscan.io; "Click and drag in the plot area to zoom in"). The average gas limit per block, from 2016 to 2021 (y axis from 0 to 17.5 M), grows in steps: about 3 million in 2016, about 4.7 M, a short sharp drop at the end of 2016, then about 4 M, 6.7 M (2017), 8 M (2018-2019), 10 M and 12.5 M (2020) and 15 M (2021).

**Expansion.** Every block has a maximum total gas, so the network processes a bounded amount of computation per block (one block every 12-15 seconds): this bounds the work of every node and is the capacity limit of the blockchain. The limit is adjusted by the block producers. The drop at the end of 2016 corresponds to the denial-of-service attacks of that autumn, in which attackers used instructions whose gas price was far lower than their real cost (operations that read the state of other accounts): miners temporarily lowered the limit, and the fork of October 2016 (EIP-150) raised the price of those instructions. Gas protects against denial of service only if prices reflect real costs. For contract authors: a function whose gas grows with the amount of data, such as a loop over all users, can exceed the block limit and become impossible to call, locking the funds that depend on it.

### Slides 42-43 · Every instruction costs a fixed amount of gas

> A counter of gas used is tracked when executing the transaction
>
> Remaining gas: 9500
>
> Remaining gas: 8000

```solidity
contract MyRegistry {

    mapping ( string => address ) public registry;

    function registerDomain(string memory domain) public {
        // Can only reserve new unregistered domain names
        require(registry[domain] == address(0));

        // Update the owner of this domain
        registry[domain] = msg.sender;
    }
}
```

**Code analysis.** The code is lines 3-14 of `MyRegistry` (Slides 6-9) in the Remix debugger (a bug icon on the left). The body of `registerDomain` is highlighted in light blue and the statement being executed in darker blue: on Slide 42 the `require` (line 9), with the yellow label "Remaining gas: 9500"; on Slide 43 the assignment (line 12), with "Remaining gas: 8000".

- *What it shows.* The transaction starts with a budget of gas, and every EVM instruction executed subtracts its cost; between the two snapshots 1500 gas were spent. The numbers are only illustrative: in reality the assignment is by far the most expensive step, because a storage write that changes a slot from zero to a non-zero value costs 20,000 gas, against 3-5 gas for an arithmetic instruction (Slide 45), since every node has to keep the value forever.

### Slide 44 · Gas limits and refunds

> - Each transaction specifies a gas limit and a price for the gas, in units of Ether
> - Ether value to pay for the gas must be reserved up front
> - At end of contract execution, unused gas is refunded

![Lecture 18, page 44](L18_p44.webp "50% 1396x509")

**Figure.** A user sends a transaction to an **Auction Contract** (method `placeBid`). The transaction box, with a pile of coins, reads "Transaction: Gas Limit: 4500 gas / Gas Price: 15.0e-6 per gas / …….".

**Expansion.** Gas limit × gas price is the maximum fee: here 4500 × 15·10⁻⁶ = 0.0675 ether, taken from the sender's balance before the execution. At the end, the gas not used is given back; the gas used is paid even if the transaction fails (Slide 46). The limit protects the sender: a bug that loops forever costs at most the limit.

### Slide 45 · There's a big table for gas prices per opcode

> This is based on the compiled opcodes for Ethereum Virtual Machine (EVM), not high level code
>
> "FORMULA" means the gas for this opcode depends on the arguments (for example on the size of the argument).
>
> https://github.com/djrtwo/evm-opcode-gas-costs

![Lecture 18, page 45](L18_p45.webp "50% 1025x923")

**Figure.** A spreadsheet, cut off at the top and on the right, with the columns Value, Mnemonic, Gas Used and a fourth column of which only the first letters are visible. Rows: 0x00 STOP 0; 0x01 ADD 3; 0x02 MUL 5; 0x03 SUB 3; 0x04 DIV 5; 0x05 SDIV 5; 0x06 MOD 5; 0x07 SMOD 5; 0x08 ADDMOD 8; 0x09 MULMOD 8; 0x0a EXP FORMULA; 0x0b SIGNEXTEND 5; 0x10 LT 3. The visible beginnings of the fourth column ("ze", "ve", "lo", "m") are the cost tiers of the Ethereum specification (zero, very low, low, mid).

**Expansion.** Gas costs are defined per EVM instruction in the Ethereum specification (the Yellow Paper), so the cost of a Solidity statement depends on the instructions it compiles to (Slide 18). Some costs are dynamic: `EXP` costs more for larger exponents, copying and hashing cost per 32-byte word, storage access depends on whether the slot was already used. The table changes with forks (EIP-150, EIP-1884, EIP-2929), and contracts that assume fixed costs can break, as happened with the 2300 gas forwarded by `transfer` (Slide 27).

### Slide 46 · What happens when gas runs out?

> - An **Out-Of-Gas** exception is thrown
> - Any changes made to storage variables, any account transfers, are **reverted** to their state before this method call
> - You are ***still charged*** the gas fee for every instruction leading up to the exception
> - Like other exceptions, it can be ***caught*** by a handler function
> - Methods can be invoked with just a portion of available gas

**Expansion.** Execution is atomic: an out-of-gas exception undoes every effect of the call, the same "revert" semantics as a failed `require`, but the gas is spent; otherwise attackers could make every node compute for free. When contract A calls contract B with only part of its gas (explicitly, as in `b.call{gas: 50000}(...)`, or automatically, since at most 63/64 of the remaining gas is passed on, EIP-150), running out of gas in B undoes only B's effects: A receives a failure flag (`call` returns `false`) or catches the error with `try`/`catch` (Solidity 0.6+), and continues. The danger is ignoring that flag: continuing as if a payment had succeeded is the "unchecked send" bug, which in 2016 made the "King of the Ether Throne" contract lose payments to its players. An attacker can also choose the gas of a transaction so that an inner call fails while the outer one succeeds ("insufficient gas griefing").

### Slide 47 · Etherscan: a transaction out of gas

![Lecture 18, page 47](L18_p47.webp "50% 1400x699")

**Figure.** The slide has no title: it is an Etherscan transaction page (tabs Overview, State Changes, Comments): Transaction Hash 0x679d887dd23623c5477bffb62f854215b97; Block 3910317 (5926643 Block Confirmations); Timestamp 1022 days 9 hrs ago (Jun-21-2017 11:16:46 PM +UTC); From 0x7ed1e469fcb3ee19c0366d829e29; To: Contract 0x12444b6ec62e616ebc8a23e5, with the warning in red "Warning! Error encountered during contract execution [**Out of gas**]", pointed out by a red arrow; Value: 1.5651901706057287 Ether ($269.82) - [CANCELLED]; Transaction Fee: 0.00126 Ether ($0.22); "Click to see More".

**Expansion.** A real failed transaction of 2017: the 1.565 ether sent to the contract were not transferred (the value is "CANCELLED" and stays with the sender), but the fee was paid. With an out-of-gas error the execution consumes all the gas made available, so the sender pays the whole gas limit (Slide 46).

### Slide 48 · MetaMask: transaction error

![Lecture 18, page 48](L18_p48.webp "50% 1400x762")

**Figure.** The slide has no title: it shows a MetaMask confirmation window ("MetaMask Notification", Main Ethereum Network) for a transaction from "Account 3" to "0xeE03…F8…", method WITHDRAW, amount ◆0 ($0.00), tabs DETAILS and DATA. On the right: GAS FEE ◆0.19602 ($77.39); AMOUNT + GAS FEE, TOTAL ◆0.19602 ($77.39); a red box "ALERT: Transaction Error. Exception thrown in contract code."; the buttons Reject and Confirm.

**Expansion.** Before sending, wallets simulate the transaction to estimate its gas. Here the simulation fails, the contract would throw an exception, and MetaMask warns that confirming would only pay a fee of almost 0.2 ether ($77) for a transaction that does nothing. Such transactions should be rejected: they are useless at best, and possibly part of a phishing attempt.

### Slide 49 · Recap: Gas in Ethereum

> Pay for the computation you use with gas
>
> Gives a good reason to optimize your code
>
> Next time: a case study comparing smart contracts with legal contracts

**Expansion.** Optimizing a contract (fewer storage writes, compact variables, no unbounded loops) saves money for its users. Gas is also part of the attack surface: the block gas limit (Slide 41), calls that fail for lack of gas (Slide 46) and fixed gas assumptions (Slide 45) all appear in real attacks.

## Smart contracts vs real world contracts (pages 50-55)

Page 50 is the section divider "Part 5: Smart contracts vs real world contracts".

### Slide 51 · Traditional contracts: the basic elements

> - Offer and acceptance
> - Consideration
> - Mutual agreement
> - Legality and Capacity
>
> How could we make a smart contract that models this contract?

![Lecture 18, page 51](L18_p51.webp "45% 809x573")

**Figure.** A parchment scroll with the text "If Bob pays Alice 1.0 ETH by Feb 21, then Alice will transfer 1.0 CAT tokens to Bob.", signed "*Alice*" in handwriting.

**Expansion.** In contract law a contract needs: an **offer** by one party and its **acceptance** by the other; **consideration**, something of value given by each party (here ether against CAT tokens); **mutual agreement**, both parties understand and agree to the same terms; **legality and capacity**, the object is legal and the parties are able to make a contract (adults, of sound mind). Alice's scroll is a simple conditional offer; the next slide turns it into code.

### Slide 52 · Example: Offering a token for sale

```solidity
contract ContractOffer {

    address payable public Alice = address(0x0 /**/);
    address payable public   Bob = address(0x0 /**/;
    /* Hardcoded address of the CAT token */
    Token public CatToken = Token(address(0x0 /**/));

    function bobAcceptsOffer() public payable {
        require(msg.sender == Bob);  /* Only offered to Bob */
        require(msg.value == 1.0 ether); /* Payment must be 1 ETH */
        require(now <= 1613937837); /* Offer good through Feb 21 */

        // Transfer the payment to Alice
        Alice.transfer(1.0 ether);

        // Transfer the CAT token to Bob
        CatToken.transferFrom(Alice, Bob, 1.0);
    }
}
```

**Code analysis.** The code is lines 3-21 of a file.

- *What it does.* The addresses of Alice, Bob and the CAT token are written into the contract (the `0x0 /**/` are placeholders for the real addresses). Only Bob can accept, only by paying exactly 1 ether, and only until the timestamp 1613937837, that is 21 February 2021, 20:03:57 UTC (`now` is the old name of `block.timestamp`, removed in Solidity 0.7). The ether goes to Alice and one CAT token goes from Alice to Bob with `transferFrom`, which works only if Alice has authorized the contract with `approve` (Slide 62). Both transfers are in the same transaction: if the token transfer fails, Bob's payment is reverted too. The exchange is atomic, and nobody has to trust the other party.
- *Problems.*
  - Line 6 lacks a closing parenthesis, `address(0x0 /**/;`, so the code does not compile as written.
  - Bob can call `bobAcceptsOffer` again: nothing records that the offer was accepted, so as long as Alice's authorization covers it, every call sells another token for another ether. A `bool accepted` flag is missing.
  - `1.0` is a number of the smallest units of the token: an ERC-20 token usually has 18 decimals, so "1.0 CAT tokens" should be `1e18` units; as written Bob receives 10⁻¹⁸ CAT.
  - If deployed with the placeholders, `Alice` is the zero address, and the ether sent to it is lost forever.

### Slide 53 · Example: Offering a token for sale

> - ***Offer and acceptance***
>
>   To accept an offer, have to digitally sign the transaction.
>
>   Alice would have to transfer asset to the contract ahead of time
>
> - ***Consideration***
>
>   Payment is collected in the blockchain's native currency
>
> - ***Mutuality***
>
>   The high level code for the contract is typically published
>
> - ***Capacity / Legality***
>
>   The execution of the contract code automatically carry out the transfer of the digital asset in the same transaction as the payment.

**Expansion.** How the legal elements map onto the smart contract:

- **Offer and acceptance**: Alice makes the offer by deploying the contract; Bob accepts by signing a transaction that calls `bobAcceptsOffer`. To be sure that the asset will be delivered, Alice must lock it in the contract in advance (escrow) or at least authorize the contract to take it.
- **Consideration**: ether, paid together with the acceptance.
- **Mutuality**: the terms are the code; the parties agree on the same terms if the source is published and verified (Slide 11), and if they can read it.
- **Capacity / Legality**: these are not checked by anybody: anyone with a key can call the contract. What the contract offers instead is automatic, atomic execution: payment and delivery happen in the same transaction, or not at all.

### Slide 54 · "Smart contracts" conceptualized by Szabo in 1994

> *A smart contract is a **computerized transaction protocol that executes the terms of a contract**. The general objectives are to satisfy common contractual conditions (such as payment terms, liens, confidentiality, and even enforcement), **minimize exceptions** both malicious and accidental, and **minimize the need for trusted intermediaries**. Related economic goals include **lowering fraud loss, arbitrations and enforcement costs**, and other transaction costs.*
>
> -Nick Szabo "The Idea of Smart Contracts"

**Expansion.** Nick Szabo, a computer scientist and legal scholar, introduced the term in 1994; his classic example is the vending machine, which enforces a simple contract (coins in, product out) without any intermediary. Ethereum (2015) made the idea practical by running contracts on a blockchain. The objectives meet reality in two places. "Minimize exceptions both malicious and accidental": in practice bugs in contracts have caused enormous losses (the DAO attack of 2016, Lecture 17; the Parity wallets), and immutable code makes mistakes permanent. "Minimize the need for trusted intermediaries": trust moves from banks and notaries to the code, its authors and auditors, and the oracles that bring outside data on the chain.

### Slide 55 · Questions

> Consider the Dutch Auction smart contract.
>
> How could we describe it based on the four elements of a legal contract?
>
> How could we describe it based on Szabo's smart contract objectives?

**Expansion.** A possible answer for the auction of Slide 35. **Offer**: the seller deploys the auction with a public, decreasing price and gives the kitty to the contract; **acceptance**: a buyer calls `buyNow` with enough ether; **consideration**: ether against the kitty; **mutuality**: published code and public parameters; **capacity and legality**: not checked, anyone can buy. As for Szabo's objectives: the payment terms are enforced by the code, in a single atomic transaction, without an auction house as intermediary, and with low costs (only gas); but "exceptions" are not eliminated, as the problems found on Slide 35 show.

## Fungible and non-fungible tokens (pages 56-64)

Page 56 is the section divider "Part 6: Fungible and Non-Fungible Tokens on Ethereum".

### Slide 57 · What are tokens?

> Tokens are smart contracts that function as digital assets

![Lecture 18, page 57](L18_p57.webp "50% 925x782")

**Figure.** A group of users with three two-way arrows: one carries coins and is labelled "Transfer transaction"; one leads to a **Contract** with its "methods"; one leads to a **Token**, a contract box with a cloud of coins on its corner and the methods "transfer", "checkbalance", "...".

**Expansion.** A token is a contract that keeps a ledger of balances (a mapping from addresses to amounts) and offers methods to transfer them: the "coins" exist only as entries in the storage of the contract. Ether is the native currency, moved by transactions themselves; tokens are currencies and assets defined by applications (stablecoins such as USDC, governance tokens, collectibles). The security of a token is the security of its code: a bug in it creates or destroys value, as the integer overflows in `mintToken` functions listed in Lecture 1 (Slides 16-17).

### Slide 58 · Etherscan: the CryptoKitties token

![Lecture 18, page 58](L18_p58.webp "50% 1400x966")

**Figure.** The slide has no title: it shows the Etherscan page of the token **CryptoKitties** (tags CryptoKitties, NFT, Collectibles; at the top "Eth: $3,267.71 (+0.48%) | 43 Gwei"). Overview [ERC-721]: Max Total Supply 2,007,928 CK; Holders 104,893 (0.00%); Transfers 5,507,348. Profile Summary: the contract address (0x06…, cut off), the official site and social profiles. Tabs Transfers, Holders, Inventory (selected), Info, DEX Trades, Contract, Comments: "Latest 10,000 active tokens (From a total of 2,008,006 tokens)", with the pictures of kitties #1, #2 and #3 and the addresses of their owners.

**Expansion.** Each kitty is a token with its own number (#1, #2, ...), its own attributes and its own owner: a **non-fungible** token. Etherscan can list them, count the holders and show the transfers without knowing anything specific about CryptoKitties, because the contract implements the ERC-721 standard (next slide).

### Slide 59 · Following a standard means some functionality can be completely generic

![Lecture 18, page 59](L18_p59.webp "50% 1339x836")

**Figure.** Etherscan's "Non-Fungible Token Tracker" (ERC-721): "Non-Fungible Tokens (NFT)", "A total of 15,282 ERC-721 Token Contracts found", pages "First < Page 1 of 306 > Last", and a table of tokens with their transfers in the last 24 hours and 3 days: 1 Template 10,452 and 11,174; 2 Art Blocks 5,133 and 12,872; 3 Gauntlets 4,317 and 5,718.

**Expansion.** Because thousands of contracts implement the same interface, one generic tool can list, show and transfer any of them: wallets, explorers and marketplaces need no code specific to each token. The same holds for fungible tokens and ERC-20 (Slide 62).

### Slide 60 · A non-fungible token contract

```solidity
contract NonFungibleToken {
    struct Record {
        string description;     // This could be a url that points to a jpeg, or anything else
        address owner;          //
        bool exists;            // True if this record exists (asset has been minted)
    }

    mapping (uint => Record) public table; //maps ids to records
    uint public nextid = 0;

    function ownerOf(uint id) view public  returns(address) {
        return table[id].owner;
    }

    address public administrator;
    constructor () public { administrator = msg.sender; }

    function mint(string memory description) public {
        require(msg.sender == administrator);
        require(table[nextid].exists == false);
        table[nextid].exists = true;
        table[nextid].owner = msg.sender;
        table[nextid].description = description;
        nextid += 1;
    }

    function transfer(uint id, address to) public {
        require(table[id].exists);
        require(ownerOf(id) == msg.sender);
        table[    id].owner = to;
    }
}
```

**Code analysis.** The slide has no title: the code (lines 3-34 of a file, on a dark background) covers the whole slide.

- *What it does.* A minimal NFT: each asset is a `Record` with a description (for example the URL of a picture), an owner and a flag saying whether it has been created ("minted"); the records are stored in a mapping from IDs to records. Only the `administrator`, the deployer set by the constructor, can mint new assets, which receive increasing IDs and belong to the administrator. `transfer` lets the owner of an existing asset give it to another address; `ownerOf` returns the owner of an ID.
- *What is missing or weak.*
  - It is not ERC-721: there are no `Transfer` events (Slide 25), no `approve`/`transferFrom` for marketplaces, no `safeTransferFrom` (which checks that a receiving contract can handle NFTs), so generic tools (Slide 59) would not recognize it.
  - `transfer` accepts any `to`, including the zero address or a mistyped one: the asset is then lost forever.
  - The "jpeg" is only a URL: the token records ownership of a pointer, and the picture can change or disappear unless it is referenced by its hash (for example on IPFS).
  - Minting depends on one administrator key: if it is stolen, the attacker can mint at will. (The check `exists == false` is always true, since `nextid` always points to a fresh record; and `ownerOf` returns the zero address for IDs that do not exist.)

### Slide 61 · Top 100 holders of a test token

![Lecture 18, page 61](L18_p61.webp "50% 1400x709")

**Figure.** The slide has no title: it shows a donut chart from Etherscan, "ECE398SC test token 1 Top 100 Token Holders" (Source: Etherscan.io). One address, 0x1b326ad348e19ecfd1406c43d3bf7a95547ac55c, holds more than half of the supply (the large blue slice); the rest is split among dozens of addresses, each a thin colored slice labelled with its address.

**Expansion.** A **fungible** test token created for a course: units are interchangeable and the contract only records how many each address holds. The largest holder is the same address that owns the domain on Slide 11, presumably the instructor who created the token and distributed it to the students.

### Slide 62 · ERC20 defines interfaces for basic token behavior

> **Basic functionality:**
>
> https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md

```solidity
function totalSupply() constant returns (uint256 totalSupply)

function balanceOf(address _owner) constant returns (uint256 balance)

function transfer(address _to, uint256 _value) returns (bool success)
```

> **Delegating control:**

```solidity
function transferFrom(address _from, address _to, uint256 _value) returns (bool success)

function approve(address _spender, uint256 _value) returns (bool success)

function allowance(address _owner, address _spender) constant returns (uint256 remaining)
```

**Code analysis.** On the slide the link is at the top right, next to "Basic functionality:".

- *What it does.* The interface of the ERC-20 standard (EIP-20, 2015) for fungible tokens. **Basic functionality**: the total number of tokens, the balance of an address, and `transfer` of tokens from the caller to another address. **Delegating control**: with `approve` an owner authorizes a spender, typically a contract such as the exchanger of Slide 26, to move up to `_value` of the owner's tokens; the spender then calls `transferFrom`; `allowance` tells how much the spender may still move. The functions return `success`, and the standard also defines the events `Transfer` and `Approval`.
- *Old syntax.* `constant` is the old keyword for `view` (removed in Solidity 0.5); the current version of the standard uses `external view`.
- *Security notes.* Changing an allowance from N to M with `approve` is racy: the spender can see the change in the mempool, spend the old N first and then the new M (the approve front-running problem); the usual remedy is to set the allowance to 0 first, or to use functions that increase or decrease it. Unlimited approvals given to a contract that is later exploited are a common way users lose their tokens. Some tokens return `false` instead of reverting, so callers must check the result (Slide 26).

### Slide 63 · To summarize

> - Tokens are contracts that function like digital assets
> - Difference between fungible and non-fungible
>
>   Non-fungible: each asset in a series has a distinct ID, attributes
>
>   Fungible: the assets are interchangeable, can be summed up
>
> - Using standard interfaces for tokens help enable interoperability
>   - ERC20/721 feature many additional features, approval mechanism for composing with other contracts

**Expansion.** Fungible tokens (ERC-20) behave like money: a balance is just a number. Non-fungible tokens (ERC-721) are like titles of ownership of distinct items, each with its own ID. The approval mechanism is what lets other contracts (exchanges, auctions, lending protocols) move tokens on behalf of their owners, the composability of Slide 12, and it is also one of the main sources of risk (Slide 62).

### Slide 64 · There are plenty ERC20 templates on the internet

> This is a widely adopted standard, and so tons of tools/service will "just work" if you adhere to ERC20 standard
>
> http://lmgtfy.com/?q=erc20+token+template
>
> https://github.com/bitfwdcommunity/Issue-your-own-ERC20-token/blob/master/contracts/erc20_tutorial.sol
>
> https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/contracts/token/ERC20

**Expansion.** The first link is a "let me google that for you" joke. For real tokens, the advice of secure development applies: reuse an audited, maintained library such as OpenZeppelin's (today the repository is called `openzeppelin-contracts`) instead of copying templates. Many early tokens copied each other's code together with its bugs, which is why the same `mintToken` overflow appears in dozens of CVEs (Lecture 1, Slides 16-17).

## Bonus: Ropsten / Metamask run-through (pages 65-68)

Page 65 is the section divider "Bonus: Ropsten / Metamask Run-through".

### Slide 66 · Ropsten / Metamask Run-Through

> Beforehand - install Metamask
>
> In this demo:
>
> 1. Create a new Ropsten (testnet) account in Metamask, copy the address
> 2. Visit the ropsten faucet, request Ether
> 3. View the transaction in Etherscan
> 4. Send a transaction to the instructor to complete the first challenge

**Expansion.** MetaMask is a wallet in the browser: it keeps the user's private keys and signs transactions for websites. A faucet gives away free test-network ether, and Etherscan shows the transactions. Ropsten was shut down in 2022; the same exercise is done today on the Sepolia test network. The **seed phrase** (mnemonic) that MetaMask shows at installation generates all the user's keys: anyone who learns it controls all the accounts, so it must never be shared or typed into a website.

### Slide 67 · Etherscan home page

> https://etherscan.io/

![Lecture 18, page 67](L18_p67.webp "50% 1400x726")

**Figure.** The slide has no title: it shows screenshots of the old home page of Etherscan, next to the Etherscan logo ("The Ethereum Block Explorer", not reproduced) and its link. A blue banner: market cap of $23.803 billion; $232.71 @ 0.0352 BTC/ETH; last block 6428950 (13.9 s); transactions 317.87 M (5.4 TPS); hash rate 263,624.79 GH/s; network difficulty 3,245.89 TH. The list of the latest **Blocks**: block 6428949 mined by SparkPool (21 transactions in 3 seconds, block reward 3.25126 ether), 6428948 by Ethermine (117 transactions in 25 seconds, 3.30499 ether), 6428947 by MiningPoolHub_1 (48 transactions in 4 seconds, 3.08219 ether), 6428946 by MineralPool. The list of the latest **Transactions**: transaction hashes with sender, receiver and amount (0.02230033 ether, 0.01 ether, ...), all ">32 secs ago".

**Expansion.** A block explorer is the window on the public state of the chain: anyone can see every block, every transaction, every balance and every contract, which is the reason why nothing secret can be stored on chain (Slide 23). The screenshot dates from the proof-of-work era, with mining pools producing the blocks and earning a block reward.

### Slide 68 · Several links for creating a ropsten wallet

> Get testnet Ether from the faucet
>
> Send some tETH (any amount) the instructor:
>
> 0x0974d3A22bDB7f73dCAb552a71896A2150DD2346

**Figure.** The logos of MetaMask and MyEtherWallet, the titles "Mnemonic Code Converter", "MetaMask Ether Faucet" and "Ethereum Ropsten Faucet" (links to the respective sites) and a QR code, presumably of the instructor's address (not reproduced).

**Expansion.** MyEtherWallet is a web wallet and the Mnemonic Code Converter a tool that derives keys from a seed phrase (BIP-39): both are fine for experiments with test accounts, but a real seed phrase must never be typed into a website. tETH is test ether, without value.

## Solidity data types (pages 69-72)

The last four slides of the deck are extra material on Solidity data types.

### Slide 69 · Basic datatypes available in Solidity

> **Integers:**
>
> int, int8, int16, …, int256
>
> uint, uint8, uint16, …, uint256
>
> Solidity is statically typed, like C or Java, but unlike python and javascript

```solidity
uint8 x = 15;
uint8 y = 255;
return x+y;
```

**Code analysis.**

- *What it does.* It adds two 8-bit unsigned integers. Integer types exist in steps of 8 bits, from `int8`/`uint8` to `int256`/`uint256`.
- *The trap.* 15 + 255 = 270 does not fit in a `uint8` (maximum 255). Before Solidity 0.8 the result silently wrapped around to 270 - 256 = **14**; since 0.8 arithmetic is checked and the operation reverts the transaction, unless it is written inside an `unchecked { ... }` block. Overflow bugs of this kind are behind the token CVEs of Lecture 1 (Slides 16-17) and the "batchOverflow" attack of 2018, in which a multiplication overflowed and created enormous amounts of a token; before 0.8 the defence was the SafeMath library.

### Slide 70 · Integer Conversions in Solidity

> - Syntax most similar to python, but the behavior is like C
> - Some restrictions on integer conversions, only change sign or size in one conversion
>
> Question: what value will y take?

```solidity
int x = -2;
uint y = uint(uint8(int8(x)));
```

**Code analysis.**

- *What it does.* Three explicit conversions, from the inside out. `int8(x)` changes only the size: it keeps the lowest 8 bits of -2, which as a signed 8-bit number is still -2 (bits `11111110`). `uint8(...)` changes only the sign: the same bits read as unsigned are **254**. `uint(...)` changes only the size again, extending with zeros: `y` = **254**.
- *Why the chain.* Since Solidity 0.8 an explicit conversion may change the sign or the size, not both at once, so `uint(int8(x))` or `uint8(x)` with `x` of type `int` do not compile: the programmer has to spell out the steps, and thus see what happens to the bits. Explicit conversions are never checked at run time: truncating a large value to a smaller type silently loses the high bits, a frequent source of bugs.
- *Note.* Solidity's syntax is mostly modelled on JavaScript and C++, with some influence from Python; the behavior of integers (fixed size, two's complement) is the one of C.

### Slide 71 · Arrays and lists in Solidity

> Statically sized array:

```solidity
int32[10] memory fixSizeArray;
fixSizeArray[2] = 15;
fixSizeArray[5] = 30;
```

> Dynamic length array: (more expensive, still can't change once created)

```solidity
int32[] memory varSizeArray = new int32[](x);
varSizeArray[2] = 15;
varSizeArray[5] = 30;
```

> Array in storage: (persists across transactions)

```solidity
address[] listOfCallers;

function append() public returns(uint) {
    listOfCallers.push(msg.sender);
    return listOfCallers.length;
}
```

**Code analysis.**

- *What it does.* A fixed-size array of ten `int32` in memory; an array in memory whose length `x` is decided at run time with `new` (it cannot grow afterwards: memory arrays have no `push`); and a dynamic array in storage, which keeps its content between transactions and grows with `push`: `append` adds the caller's address and returns the new length.
- *Bounds.* Every access is checked: `fixSizeArray[10]` or an index beyond `x` reverts the transaction. Unlike C (Lectures 3 and 19), Solidity is memory-safe for arrays.
- *Security notes.* Anyone can call `append` as many times as they like, so the array grows without limit: any function that loops over `listOfCallers` will eventually exceed the block gas limit and become impossible to execute (Slide 41). In Solidity before 0.6 the `length` of a storage array could be assigned directly: shrinking an empty array made its length underflow to 2^256 - 1, so that the array covered the whole storage and an attacker could overwrite any variable through it, a classic of smart-contract capture-the-flag exercises.

### Slide 72 · Basic datatypes available in Solidity

> **Strings and Bytes:**
>
> *bytes32*: fixed size, returned by hash functions
>
> *bytes memory*: array of bytes
>
> *string memory:* array of characters
>
> *abi.encode( )*: flattens multiple arguments to a *bytes*
>
> Fancier string libraries are available too

```solidity
string memory s = "hello world";
bytes memory x = abi.encode(s);
bytes32 y = sha256(x);
bytes32 z = sha256(abi.encode(y));
```

**Code analysis.**

- *What it does.* `abi.encode(s)` serializes the string in the standard ABI format (offset, length, data padded to 32 bytes, as in the logs of Slide 11); `sha256` hashes the bytes and returns a `bytes32`; the last line hashes the hash, after encoding it again. (Ethereum itself mostly uses `keccak256`, which is also available.)
- *Notes.* A `string` is a sequence of UTF-8 bytes: Solidity has no built-in operations to compare, concatenate or measure strings in characters (strings are compared by comparing their hashes), hence the "fancier string libraries". When several values are hashed together, `abi.encode` must be preferred to `abi.encodePacked`: the packed encoding of the two strings `("a", "bc")` and of `("ab", "c")` is the same, so two different inputs give the same hash, which breaks signatures and commitments built on it.
