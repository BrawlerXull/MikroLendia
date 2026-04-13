# MikroLendia - Technical Documentation & Viva Reference

## 1. Project Overview
**MikroLendia** is a decentralized application (dApp) designed for micro-lending. It allows users to register, request loans, and form or interact with "Communities". Communities act as multi-signature liquidity pools where multiple stakeholders can vote to approve and fund loans to individuals.

### Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS, Redux, Ethers.js (for blockchain interaction).
- **Backend:** Node.js, Express.js, MongoDB (handles off-chain data like transaction logs or caching).
- **Blockchain/Smart Contracts:** Solidity, Hardhat, OpenZeppelin.

---

## 2. Smart Contracts Architecture
The blockchain backbone consists of four main smart contracts.

### A. UserContract.sol
- **Purpose:** Onboards users and maintains user profiles.
- **Key Features:** Stores user details (name, age, city, profession, wallet address) and keeps track of **strikes** (penalties for failing to pay loans on time).

### B. LoanContract.sol
- **Purpose:** The core engine that handles the lifecycle of a loan.
- **Key Features:** 
  - Allows requesting loans (personal, business, student).
  - Handles the flow from `pending` -> `accepted` -> `completed` (or `cancelled`).
  - Logic for calculating monthly repayments including interest.
  - Can apply penalties (`addStrikeIfLate`) bridging with `UserContract`.
  - Communities or individual granters can approve and fund loans directly through this contract.

### C. Community.sol
- **Purpose:** Acts as a community-driven decentralized fund/wallet.
- **Key Features:** 
  - Based on a multi-signature logic. It requires a specific number of owner signatures (`_requiredSignatures`) to execute a transaction.
  - Owners deposit funds into the community pool.
  - When reaching consensus, they can execute a transaction to grant a loan through the `LoanContract`.

### D. CommunityFactory.sol
- **Purpose:** A factory pattern contract to spawn new Communities cheaply and effectively.
- **Key Features:** 
  - Uses the **ERC-1167 Minimal Proxy (Clones)** standard. Instead of deploying the heavy `Community` contract code every time, it deploys a tiny proxy that points to a single `Community` "Implementation". 
  - Hugely saves on gas fees when creating new communities.

---

## 3. Deployment Process
### How did we deploy it?
We used a modern deployment framework called **Hardhat Ignition**.
1. **Local Blockchain:** We initiated a local Ethereum-compatible network using `npx hardhat node`. This spins up an RPC server at `localhost:8545` and provides 20 test accounts with 10,000 fake ETH each.
2. **Ignition Module:** We created a declarative deployment script (`Deploy.js`) that told Hardhat the exact order of deployment:
   - Deploy `UserContract`
   - Deploy `LoanContract` (passing `UserContract` address)
   - Deploy `Community` (the logical implementation)
   - Deploy `CommunityFactory` (passing the `Community` implementation address)
3. **Execution:** By running `npx hardhat ignition deploy`, the scripts compiled the Solidity files into bytecode and ABI, sent creation transactions to the local blockchain, and outputted the live contract addresses.
4. **Integration:** Finally, these output addresses were added to `mikrolendia/lib/contract/contract.ts` to allow the frontend to interact with them via `ethers.js`.

---

## 4. Costing & Gas Fees
### Where is Gas required?
**Gas** is required for any transaction that alters the state of the blockchain. In MikroLendia, gas fees occur when:
- Registering a user.
- Creating a new community.
- Requesting a loan.
- Approving and funding a loan (the hardest on gas as it moves native funds).
- Making a repayment.

**No Gas is required for (View functions):**
- Checking loan status.
- Viewing user profiles.
- Reading the communities list.

### What are the real-world costs?
- **Currently (Localhost):** The cost is $0. We use a local Hardhat node with fake ETH.
- **Testnet (Avalanche Fuji):** The project is configured to be deployable to the Avalanche Fuji testnet. Testnet tokens (AVAX) are gathered for free from a faucet. Cost is technically $0.
- **Mainnet Launch:** If deployed to the Avalanche C-Chain or Ethereum Mainnet, users would pay gas in the native token (AVAX or ETH). To optimize costs, we used the `Clones` proxy pattern in `CommunityFactory` to make deploying communities highly gas-efficient.

---

## 5. Potential Viva Questions & Answers

**Q1: Why did you use MongoDB when you already have a blockchain?**
*Answer:* Blockchains are expensive and slow for querying large amounts of data. We use the smart contracts strictly for core financial logic, asset transfer, and critical state (loans/user records). MongoDB is used to cache, index, and quickly serve this data to the frontend without straining blockchain RPCs.

**Q2: What happens if a user doesn't repay their loan on time?**
*Answer:* The `LoanContract` has a function `addStrikeIfLate`. If the `dueDate` has passed, anyone can trigger this function. It verifies the timestamp and communicates with the `UserContract` to add a "strike" to the user's profile, severely damaging their credibility for future loans.

**Q3: How does the Community multi-sig wallet prevent fraud?**
*Answer:* The `Community.sol` contract uses cryptographic signatures. When a loan needs to be funded, owners sign the transaction details off-chain. The contract's `executeTransaction` function takes these signatures, splits them (`r, s, v`), and uses `ecrecover` to extract the addresses of the signers. The funds are only unlocked if the number of valid owner signatures matches the `_requiredSignatures` parameter.

**Q4: How do you prevent re-entrancy attacks when transferring funds?**
*Answer:* Ideally, state changes should happen *before* transferring funds (Checks-Effects-Interactions pattern). In our `LoanContract`, when a loan is approved, the status is updated, lists are updated, and then the funds are transferred via `.call{value: ...}("")`. 

**Q5: What is a Proxy Contract and why is it in CommunityFactory?**
*Answer:* The `Clones.clone()` function creates an ERC-1167 minimal proxy. Instead of users paying a massive gas fee to deploy the thousands of lines of bytecode for `Community.sol` every time they start a group, the factory deploys a miniature 45-byte contract that simply delegates all its logic to a master `Community` contract. This reduces deployment costs by over 90%.
