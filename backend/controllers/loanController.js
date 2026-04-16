/**
 * loanController.js
 * Uses in-memory store so the backend works even without MongoDB.
 * Data resets on server restart — fine for local development/testing.
 */

let loans = [];      // In-memory loan store
let nextId = 1;

function makeId() {
  return String(nextId++);
}

// GET /api/loan/:address — get loans by borrower address
exports.getUserLoans = (req, res) => {
  const { address } = req.params;
  const userLoans = loans.filter(l => l.address?.toLowerCase() === address?.toLowerCase());
  res.json(userLoans);
};

// GET /api/loan — get all loans
exports.getLoan = (req, res) => {
  res.json(loans);
};

// POST /api/loan — create a new loan record
exports.setLoan = (req, res) => {
  try {
    const { address, userLoan, loanIndex } = req.body;
    const newLoan = {
      _id: makeId(),
      address,
      loan: userLoan,
      bidCount: 0,
      paidAmount: 0,
      returnOnLoan: 0,
      totalLoanValue: userLoan,
      bids: [],
      acceptedBid: null,
      status: 'pending',
      lender: null,
      paid: false,
      loanIndex: loanIndex ?? loans.length,
      createdAt: new Date(),
    };
    loans.push(newLoan);
    console.log(`[Loan Created] #${newLoan._id} by ${address}, amount: ${userLoan}`);
    res.json({ message: 'Loan has been created successfully.', loan: newLoan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating loan', error: err.message });
  }
};

// POST /api/loan/bid — place a bid on a loan
exports.bid = (req, res) => {
  try {
    const { loanIndex, bidBy, bid } = req.body;
    const loan = loans.find(l => Number(l.loanIndex) === Number(loanIndex));
    if (!loan) {
      console.warn(`[Bid] Loan at index ${loanIndex} not found. Creating placeholder.`);
      // Create a placeholder so bidding still works
      const placeholder = {
        _id: makeId(),
        address: '',
        loan: 0,
        bidCount: 0,
        paidAmount: 0,
        returnOnLoan: 0,
        totalLoanValue: 0,
        bids: [],
        acceptedBid: null,
        status: 'pending',
        lender: null,
        paid: false,
        loanIndex: Number(loanIndex),
        createdAt: new Date(),
      };
      loans.push(placeholder);
      const returnOnLoan = 0;
      placeholder.bids.push({
        _id: makeId(),
        bidBy,
        paidAmount: 0,
        returnOnLoan,
        bidAt: new Date(),
        status: 'pending',
        interest: Number(bid),
      });
      placeholder.bidCount++;
      console.log(`[Bid Placed] on placeholder loan #${loanIndex} by ${bidBy} at ${bid}%`);
      return res.json({ message: 'Bid placed successfully (placeholder loan).' });
    }

    const returnOnLoan = (loan.loan * Number(bid)) / 100;
    const totalLoanValue = loan.loan + returnOnLoan;

    loan.bids.push({
      _id: makeId(),
      bidBy,
      paidAmount: 0,
      returnOnLoan,
      bidAt: new Date(),
      status: 'pending',
      interest: Number(bid),
    });
    loan.bidCount++;
    loan.returnOnLoan = returnOnLoan;
    loan.totalLoanValue = totalLoanValue;

    console.log(`[Bid Placed] on loan #${loanIndex} by ${bidBy} at ${bid}%`);
    res.json({ message: 'Bid placed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error placing bid', error: err.message });
  }
};

// POST /api/loan/approve — approve a bid
exports.approveBid = (req, res) => {
  try {
    const { loanIndex, bidNumber } = req.body;
    // Look up by on-chain loanIndex (the canonical identifier)
    const loan = loans.find(l => Number(l.loanIndex) === Number(loanIndex));
    if (!loan) {
      console.warn(`[Approve] No backend record for loanIndex ${loanIndex} — skipping backend update`);
      // Still return success: the on-chain tx already went through
      return res.json({ message: 'Bid approved on-chain (no backend record to update).' });
    }

    const idx = bidNumber ?? loan.bids.length - 1;
    const bid = loan.bids[idx] ?? loan.bids[loan.bids.length - 1];
    if (!bid) return res.status(400).json({ message: 'Bid not found' });

    loan.acceptedBid = bid;
    loan.lender = bid.bidBy;
    loan.status = 'approved';
    loan.paid = false;
    // Mark all other bids as rejected
    loan.bids.forEach((b, i) => { b.status = i === (loan.bids.indexOf(bid)) ? 'accepted' : 'rejected'; });

    console.log(`[Loan Approved] loanIndex=${loanIndex}, lender: ${loan.lender}`);
    res.json({ message: 'Bid has been approved', loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error approving bid', error: err.message });
  }
};

// GET /api/loan/approved/:address — get loans where this address is lender
exports.getUserApprovedBids = (req, res) => {
  const { address } = req.params;
  const result = loans.filter(l => l.lender?.toLowerCase() === address?.toLowerCase());
  res.json(result);
};

// POST /api/loan/bid-count — get bid count
exports.bid_count = (req, res) => {
  try {
    const { loanId } = req.body;
    const loan = loans.find(l => l._id === loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    res.json({ message: 'Bid count retrieved.', bidCount: loan.bidCount });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bid count', error: err.message });
  }
};

// POST /api/loan/mark-done
exports.markLoanAsDone = (req, res) => {
  try {
    const { loanId } = req.body;
    const loan = loans.find(l => l._id === loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.status !== 'approved') return res.status(400).json({ message: 'Loan must be approved first' });
    loan.status = 'done';
    loan.paid = true;
    res.json({ message: 'Loan marked as done.', loan });
  } catch (err) {
    res.status(500).json({ message: 'Error marking loan as done', error: err.message });
  }
};