const e=`Lecture 17 presents the best-known vulnerability specific to smart contracts, **re-entrancy**: a contract that sends ether to another contract *before* updating its own state can be called back by the recipient, whose fallback function re-enters the sending function while the old state is still in place and drains the contract. It is the bug behind the DAO attack of 2016 (Lecture 16, Slide 28). The lecture follows a vulnerable Solidity contract (\`DepositFunds\`), the attacker's contract, the step-by-step attack, the two defences (update the state before any external call; a re-entrancy guard modifier) and the practical consequences, from the Ethereum hard fork to the re-entrancy hacks of 2020-2021. The slide deck has 11 pages; the deck is based on the HackerNoon article linked on the title slide.

## The attack (pages 1-6)

### Slide 1 · Title slide

> **Security in Software Applications**
>
> Re-entrancy attack
>
> Based on https://hackernoon.com/hack-solidity-reentrancy-attack

### Slide 2 · Scenario

![Lecture 17, page 2](L17_p02.webp "50% 1400x971")

**Figure.** Two boxes, **Contract A** on the left and **Contract B** on the right, joined by two curved blue arrows. The lower arrow, from A to B, is labelled "**Send Funds**"; the upper arrow, from B back to A, is labelled "**B calls back into A before it done updating balances**". Contract A lists the functions \`checkBalance()\`, \`sendFunds()\`, \`updateBalance()\`; Contract B contains \`fallback_function()\`.

**Code analysis.** The pseudo-code in the two boxes:

\`\`\`
Contract A {
    checkBalance()
    sendFunds()
    updateBalance()
}

Contract B {
    fallback_function()
}
\`\`\`

- *What it shows.* A's withdrawal logic in three steps, in this order: **check** the caller's balance, **send** the funds, **update** the balance. B is the recipient, a contract with a **fallback function**, the function that Solidity runs automatically when a contract receives ether.
- *The vulnerability.* Sending ether to a contract **runs the recipient's code**. When A executes \`sendFunds()\`, control passes to B's fallback function *before* A has executed \`updateBalance()\`; if the fallback calls A's withdrawal again, \`checkBalance()\` still sees the old balance and approves a second payment, and so on. A is **re-entered** while it is in an inconsistent state, halfway through one of its own functions.
- *Fix.* Change the order: check, **update**, then send (Slides 7-9).

### Slide 3 · Contract example

\`\`\`solidity
contract DepositFunds {
  mapping(address => uint) public balances;
  function deposit() public payable {
      balances[msg.sender] += msg.value;
  }
  function withdraw() public {
      uint bal = balances[msg.sender];
      require(bal > 0);

      (bool sent, ) = msg.sender.call{value: bal}("");
      require(sent, "Failed to send Ether");

      balances[msg.sender] = 0;
  }
}
\`\`\`

**Code analysis.** The vulnerable contract, a simple bank in which users deposit and withdraw ether.

- *What it does.* \`balances\` maps each address to the ether it has deposited. \`deposit()\` is \`payable\`: the ether sent with the call (\`msg.value\`, in wei) is credited to the caller (\`msg.sender\`). \`withdraw()\` reads the caller's balance, requires it to be positive, sends the whole amount back with a low-level \`call\` (with empty data, \`("")\`), requires the transfer to have succeeded and finally sets the balance to 0.
- *The vulnerability.* The order is **check → interaction → effect**: the external call that sends the ether happens **before** the state update \`balances[msg.sender] = 0\`. If \`msg.sender\` is a contract, receiving the ether runs its \`receive\`/\`fallback\` function, and \`call\` forwards to it all the remaining gas, enough to call \`withdraw()\` again. In that nested call \`balances[msg.sender]\` still holds the old value, so the check passes and the same amount is sent again, and again, until the contract is empty. Only when the recursion stops do the nested calls return, and each of them sets the (already irrelevant) balance to 0. It is a time-of-check-to-time-of-use problem inside a single transaction (Lecture 11): the balance checked is not the balance at the time of use.
- *Exploit.* Slides 4-6, with the attacker's contract of Slide 5.
- *Fix.* Follow the **checks-effects-interactions** pattern, updating the state before the external call:

\`\`\`solidity
function withdraw() public {
    uint bal = balances[msg.sender];
    require(bal > 0);                                  // checks
    balances[msg.sender] = 0;                          // effects
    (bool sent, ) = msg.sender.call{value: bal}("");   // interactions
    require(sent, "Failed to send Ether");
}
\`\`\`

  Now a re-entrant call finds a balance of 0 and fails at \`require(bal > 0)\`. A re-entrancy guard (Slides 7-9) adds a second layer. Old code sometimes relied on \`transfer()\` and \`send()\`, which forward only 2300 gas, too little to re-enter; this is no longer recommended, because gas costs change over time (the 2019 Istanbul upgrade broke contracts that depended on that stipend).

### Slide 4 · The Attack

> 1. Vulnerable Smart Contract has 10 ETH
> 2. Attacker stores 1 ETH using \`deposit()\`
> 3. An attacker calls the \`withdraw()\` function and points to a malicious contract as a recipient.
> 4. Now withdraw function will verify if it can be executed:
>    - Does the attacker have 1 eth on their balance?
>      - *Yes* - because of their deposit.
>    - Transfer 1 ETH to a malicious contract. (Note: attacker balance has **NOT** been updated yet)
>    - Fallback function on received eth calls withdraw function again
>
> - Now withdraw function will verify if it can be executed:
>   - Does the attacker have 1 ETH on their balance?
>     - Yes - because the balance has not been updated.
>   - Transfer 1 ETH to a malicious contract.
>   - and again until the attacker will drain all the funds stored on the contract

**Expansion.** The attack, step by step, on concrete numbers. \`DepositFunds\` holds 10 ETH deposited by honest users. The attacker deposits 1 ETH from its malicious contract, so the victim holds 11 ETH and the attacker's recorded balance is 1. The attacker then calls \`withdraw()\` from that contract:

1. \`withdraw\` checks the balance (1 ETH: yes) and sends 1 ETH to the attacker's contract.
2. Receiving the ether runs the attacker's fallback function, which calls \`withdraw()\` again, while the first call is still waiting for \`call\` to return and the balance is still 1.
3. The check passes again (the balance was never updated), another 1 ETH is sent, the fallback re-enters again, and so on.

The recursion stops only when the victim has less than 1 ETH left, a condition checked by the attacker's own fallback (Slide 5). Then the nested calls return one by one and each sets the balance to 0. Result: the attacker has taken 11 ETH (its own 1 and the 10 of the other users) with a single transaction and an investment of 1 ETH.

### Slide 5 · The Attack contract

\`\`\`solidity
contract Attack {
  DepositFunds public depositFunds;
  constructor(address _depositFundsAddress) {
      depositFunds = DepositFunds(_depositFundsAddress);
  }
  // Fallback is called when DepositFunds sends Ether to this contract.
  fallback() external payable {
      if (address(depositFunds).balance >= 1 ether) {
            depositFunds.withdraw();
      }
   }
  function attack() external payable {
      require(msg.value >= 1 ether);
      depositFunds.deposit{value: 1 ether}();
      depositFunds.withdraw();
} }
\`\`\`

**Code analysis.** The attacker's contract.

- *What it does.* The constructor stores a reference to the victim, \`DepositFunds\`, at a given address. \`attack()\` is called by the attacker with at least 1 ether: it **deposits 1 ether** into the victim, so that its balance there is 1, and immediately calls **\`withdraw()\`**. The **\`fallback()\`** function, \`external payable\`, runs automatically whenever the victim sends ether to this contract (with empty call data and no \`receive()\` function, the payable fallback is the one called); as long as the victim still holds at least 1 ether, it calls \`withdraw()\` again.
- *Why it works.* Every payment from the victim triggers the fallback, which re-enters \`withdraw()\` before the victim reaches \`balances[msg.sender] = 0\`, so each nested call passes the \`require(bal > 0)\` check with the stale balance of 1 ether. The condition \`address(depositFunds).balance >= 1 ether\` is what makes the attack clean: it stops the recursion when the victim is empty, so that no \`call\` fails, no \`require(sent)\` reverts, and all the stolen transfers remain valid when the calls unwind. The depth of the recursion is limited only by the gas of the transaction and by the EVM's call-depth limit (1024), more than enough here.
- *Fix.* Nothing to fix in the attacker's code: the bug is in the victim (Slide 3). With the checks-effects-interactions fix, the re-entrant \`withdraw()\` reverts, the fallback fails, the victim's \`call\` returns \`false\` and the whole withdrawal reverts, so the attacker gains nothing.

### Slide 6 · The Attack contract

> - The attack function calls the withdraw function in the victim's contract.
> - When the token is received, the fallback function calls back the withdraw function.
> - Since the check is passed, the contract sends the token to the attacker, which triggers the fallback function, and so on and so forth.

**Expansion.** The cycle in three lines, with "token" standing for the ether sent: \`attack()\` → \`withdraw()\` → the ether arrives → \`fallback()\` → \`withdraw()\` → the ether arrives → ... Each round passes the check because the victim updates the balance only after the external call returns. The essential ingredient is that **sending money executes the recipient's code**: in a smart contract every external call, including a payment, hands control to code written by someone else, possibly the attacker, which can call back in.

## Prevention (pages 7-9)

### Slides 7-8 · How to prevent a re-entrancy attack

> - To prevent a reentrancy attack in a Solidity smart contract:
>   - Ensure all state changes happen before calling external contracts, i.e., update balances or code internally before calling external code
> - Use function modifiers that prevent reentrancy

\`\`\`solidity
contract ReEntrancyGuard {
  bool internal locked;
  modifier noReentrant() {
       require(!locked, "No re-entrancy");
       locked = true;
       _;
       locked = false;
  }
   function withdraw() public noReentrancy {
   // withdraw logic goes here…
  }
}
\`\`\`

Page 8 repeats the two bullets without the code.

**Code analysis.** The two defences.

- *Checks-effects-interactions.* The first bullet is the pattern applied to \`withdraw\` in the code analysis of Slide 3: first the **checks** (\`require\`), then the **effects** on the contract's own state (set the balance to 0), and only at the end the **interactions** with other contracts (the transfer). A re-entrant call then sees the updated state and gets nothing.
- *The re-entrancy guard.* A Solidity **modifier** is code wrapped around a function body: \`_;\` marks where the body runs. \`noReentrant\` checks that the contract is not \`locked\`, sets \`locked = true\`, runs the body and then resets \`locked = false\`. If, while the body is executing, an external call re-enters \`withdraw()\` (or any other function with the same modifier), \`require(!locked, ...)\` fails and the re-entrant call reverts. As the slide is written, the modifier is declared as \`noReentrant\` but used as \`noReentrancy\`: the two names must match, or the contract does not compile. The standard implementation is OpenZeppelin's \`ReentrancyGuard\`, with the \`nonReentrant\` modifier.
- *Limits.* The guard must be applied to **every** function that shares the state: if \`withdraw\` is guarded but a \`transfer\` function that moves balances is not, the attacker re-enters through \`transfer\` (cross-function re-entrancy). The two defences are complementary, and the checks-effects-interactions order is the more fundamental one.

### Slide 9 · Re-Entrancy Guard

\`\`\`solidity
contract ReEntrancyGuard {
   bool internal locked;
   modifier noReentrant() {
       require(!locked, "No re-entrancy");
       locked = true;
       _;
       locked = false;
   }
   function withdraw() public noReentrancy {
   // withdraw logic goes here…
   }
}
\`\`\`

> - The modifier wraps the code in a semaphore so that the function cannot be called if \`locked\` is \`true\`

**Code analysis.** The same code as on Slide 7. The \`locked\` flag works as a **semaphore** (a mutex, a binary lock): the function body is a critical section, and a second entry while the first is still running is refused. It is the same idea as the locks used against race conditions in Lecture 11 (Slides 7-9), applied to the "concurrency" created by callbacks inside a single transaction (Slide 11). Unlike a thread lock it never waits: a re-entrant call is simply reverted.

## Consequences and takeaways (pages 10-11)

### Slide 10 · Practical consequences

> - DAO attack: $150 mln worth of dollars stolen
> - Ethereum hard-fork: after re-entrancy issues have been fixed, a new chain has been forked to restore the lost funds
>   - Ethereum classic is the «old» chain with the DAO attack.
> - Re-entrancy is still a problem:
>   - Uniswap/Lendf.Me hacks (April 2020) - $25 mln, attacked by a hacker using a reentrancy.
>   - The BurgerSwap hack (May 2021) - $7.2 mln, because of a fake token contract and a reentrancy exploit.
>   - The SURGEBNB hack (August 2021) - $4 mln, seems to be a reentrancy-based price manipulation attack.
>   - CREAM FINANCE hack (August 2021) - $18.8 mln, reentrancy vulnerability allowed the exploiter for the second borrow.
>   - Siren protocol hack (September 2021) - $3.5 mln, AMM pools were exploited through reentrancy attack…
>   - … and more.

**Expansion.** **The DAO** (2016) was a decentralized investment fund whose contract had collected about $150 million worth of ether; in June 2016 an attacker used re-entrancy in its withdrawal ("split") function to drain about a third of it, 3.6 million ether. Because the stolen ether was temporarily locked by the DAO's own rules, the Ethereum community had time to react, and it chose a **hard fork**: a change of the protocol rules that moved the stolen funds to a recovery contract from which the investors could withdraw them. The fork was controversial, since it contradicts the idea that the chain is immutable ("code is law"), and part of the community kept running the original chain, which still exists as **Ethereum Classic**. The list shows that re-entrancy did not disappear: several later attacks (for example on Lendf.Me and CREAM Finance) re-entered through **tokens whose transfers call back into the receiver**, so even a "simple" token transfer can be an external call to attacker code. Every transfer of value to another contract has to be treated as untrusted code execution.

### Slide 11 · Takeaways

> - The nature of the re-entrancy attacks is not something new
>   - Callbacks and fallbacks allows for multi-threading inside smart contracts
>     - Race conditions can be exploited
> - Solidity is a language running on top of an EVM. Hence, testing and verification of both contracts and the EVM code are necessary to avoid tampering of data and currency being stolen
> - What about confidentiality? Code and data are public!
>   - Novel techniques can allow the EVM running inside the nodes to produce zero-knowledge proofs coupled with encrypted data
>     - Bugs in the contract/EVM code can break confidentiality

**Expansion.** Three closing points:

- **Re-entrancy is a race condition.** The EVM executes one transaction at a time, but callbacks interleave the execution of different contracts as threads would, so the problems of Lecture 11 come back: a shared state (the balance) is checked, then control passes to someone else, then the state is used, and in between it can be changed or re-used. The cures are the same too: make check and update atomic, or hold a lock.
- **Verify both layers.** Contracts must be tested and verified (the static analysis, symbolic execution and fuzzing of Lectures 6-7 adapted to Solidity, Lecture 16, Slide 28), and so must the **EVM and the client software** that run them: a bug in the virtual machine or in the compiler would affect every contract.
- **Confidentiality.** Everything on a public blockchain is visible: the code, every transaction and the whole storage (Solidity's \`private\` only restricts access from other contracts, while anyone can read the raw storage). Keeping data secret requires cryptography, such as storing only hashes, or the **zero-knowledge proofs** mentioned on the slide (one of the research topics of the lecturer, Lecture 1, Slide 2): the nodes can verify that a computation on encrypted or hidden data was done correctly without seeing the data. These systems are code as well, so a bug in them can break the confidentiality they promise.
`;export{e as default};
