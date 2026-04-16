/**
 * transactionController.js
 * In-memory store for community multi-sig transactions.
 * Data resets on server restart — fine for local dev/testing.
 * (Replaced MongoDB because Atlas DNS is unavailable offline.)
 */

let transactions = [];
let nextTxnId = 1;

function makeId() {
  return String(nextTxnId++);
}

// POST /api/txn — get all transactions for a community wallet
exports.getAllTxn = (req, res) => {
  const { multisigWallet } = req.body;
  const txns = transactions.filter(
    t => t.from?.toLowerCase() === multisigWallet?.toLowerCase()
  );
  res.status(200).json({ data: txns });
};

// POST /api/txn/add — create a new loan request for a community
exports.addTxn = (req, res) => {
  try {
    const { amount, from, to, reason } = req.body;
    if (!from || !to || !reason) {
      return res.status(400).json({ error: 'Missing required fields: from, to, reason' });
    }
    const txn = {
      _id: makeId(),
      amount: Number(amount) || 0,
      from,
      to,
      reason,
      signatures: [],
      txHash: null,
      executed: false,
      createdAt: new Date(),
    };
    transactions.push(txn);
    console.log(`[Txn Created] #${txn._id} from ${from} to ${to}, amount: ${amount} ETH`);
    res.status(201).json({ message: 'Transaction created successfully', txn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/txn/sign — owner signs a pending transaction
exports.signTxn = (req, res) => {
  const { transactionId, signature } = req.body;
  try {
    const txn = transactions.find(t => t._id === transactionId);
    if (!txn) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    if (txn.executed) {
      return res.status(400).json({ success: false, error: 'Transaction already executed' });
    }
    const alreadySigned = txn.signatures.some(
      s => s.address?.toLowerCase() === signature?.address?.toLowerCase()
    );
    if (alreadySigned) {
      return res.status(200).json({ success: false, error: 'Already signed by this address' });
    }
    txn.signatures.push(signature);
    console.log(`[Txn Signed] #${transactionId} by ${signature?.address} (${txn.signatures.length} sigs total)`);
    res.status(200).json({ success: true, sigCount: txn.signatures.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/txn/execute — mark a transaction as executed on-chain
exports.executeTransaction = (req, res) => {
  const { txHash, transactionId } = req.body;
  try {
    const txn = transactions.find(t => t._id === transactionId);
    if (!txn) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    txn.txHash = txHash;
    txn.executed = true;
    console.log(`[Txn Executed] #${transactionId}, txHash: ${txHash}`);
    res.status(200).json({ message: 'Transaction executed', txn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// (kept for route compatibility)
exports.createCommunity = exports.addTxn;
