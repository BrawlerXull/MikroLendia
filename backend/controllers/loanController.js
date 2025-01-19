const Loan = require("../models/loan");
const moment = require("moment");

function generateUniqueBits() {
  return Math.random() * 100;
}

function adjustPriceBasedOnDemandSupply(loan, buyDemand) {
  const demandEffect = buyDemand * 2;
  const adjustedPrice = loan + demandEffect;
  return adjustedPrice;
}

exports.getUserLoans = async (req, res) => {
  const { address } = req.params;
  const userLoans = await Loan.find({ address: address });
  res.json(userLoans);
};

exports.bid_count = async (req, res) => {
  try {
    const { loanId } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    const bidCount = loan.bidCount;
    res.json({
      message: "Bid count retrieved successfully.",
      bidCount: bidCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bid count", error: error });
  }
};

exports.setLoan = async (req, res) => {
  console.log("calling");
  try {
    console.log(req.body);
    const { address, userLoan, loanIndex } = req.body;
    const loans=await Loan.find({});
    console.log(loans)
    const newLoan = new Loan({
      address: address,
      loan: userLoan,
      bidCount: 0,
      paidAmount: 0,
      returnOnLoan: 0,
      totalLoanValue: userLoan,
      bids: [],
      loanIndex: loans.length,
    });

    await newLoan.save();
    res.json({
      message: "Loan has been created successfully.",
      loan: newLoan,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating loan", error: err });
  }
};

exports.getLoan = async (req, res) => {
  const loans = await Loan.find({});
  res.json(loans);
};

exports.approveBid = async (req, res) => {
  const { loanId, bidNumber } = req.body;
  const loan = await Loan.findById(loanId);
  if (loan) {
    loan.acceptedBid = loan.bids[bidNumber];
    loan.lender = loan.bids[bidNumber].bidBy;
    loan.status = "approved";
    loan.paid = false;
  }
  await loan.save();
  res.json({ message: "Bid has been approved", loan: loan });
};

exports.getUserApprovedBids = async (req, res) => {
  const { address } = req.params;
  const loan = await Loan.find({ lender: address });
  res.json(loan);
};

exports.approveBid = async (req, res) => {
  const { loanId } = req.body;
  const loan = await Loan.findById(loanId);
  if (loan) {
    loan.acceptedBid = loan.bids[loan.bids.length - 1];
    loan.lender = loan.bids[loan.bids.length - 1].bidBy;
    loan.status = "approved";
    loan.paid = false;
  }
  await loan.save();
  res.json({ message: "Bid has been approved", loan: loan });
};


exports.getUserApprovedBids = async (req, res) => {
  const { address } = req.params;
  const loan = await Loan.find({ lender: address });
  res.json(loan);
};


exports.bid = async (req, res) => {
  try {
    const { loanIndex, bidBy, bid } = req.body;
    const loan = await Loan.findOne({loanIndex});
    console.log(loan)
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }
    const returnOnLoan = (loan.loan * bid) / 100;
    const totalLoanValue = loan.loan + returnOnLoan;

    const newBid = {
      bidBy,
      paidAmount :0,
      returnOnLoan,
      bidAt: moment().toDate(),
      status: "pending",
      interest: bid
    };
    console.log(loan)
    console.log(Array.isArray(loan.bids))
    console.log(loan.bids)

    loan.bids.push(newBid);
    // loan.bids[loan.bids.length] = newBid
    loan.bidCount++;
    loan.returnOnLoan = returnOnLoan;
    loan.totalLoanValue = totalLoanValue;

    // Add updated percentage to percentageHistory
    // loan.percentageHistory.push(updatedPercentage);

    const savedLoan = await loan.save();

    res.json({
      message: `Bid placed successfully.`,
      // paidAmount: 0,
      // currentPercentage: updatedPercentage.toFixed(2),
      // returnOnLoan: returnOnLoan.toFixed(2),
      // demand: loan.buyDemand.toFixed(2),
      // totalLoanValue: totalLoanValue.toFixed(2),
      // bidCount: loan.bidCount,
      // loan: savedLoan,
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Error placing bid", error: err });
  }
};

// New function to mark loan as done after money is sent
exports.markLoanAsDone = async (req, res) => {
  try {
    const { loanId } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Check if the loan status is currently "approved" and not already marked as done
    if (loan.status !== "approved") {
      return res
        .status(400)
        .json({ message: 'Loan must be in "approved" status to mark as done' });
    }

    // Mark loan as done and set paid to true
    loan.status = "done";
    loan.paid = true;

    await loan.save();

    res.json({
      message: "Loan status updated to Done.",
      loan: loan,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating loan status to Done", error: err });
  }
};

// Controller to get all percentage history
exports.all_percentage = async (req, res) => {
  try {
    const { loanId } = req.body;

    // Find loan by ID
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Return the percentageHistory array
    res.json({
      message: "Percentage history fetched successfully",
      percentageHistory: loan.percentageHistory,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching percentage history", error: err });
  }
};