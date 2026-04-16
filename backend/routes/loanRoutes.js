const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");

router.post("/", loanController.setLoan);
router.get("/", loanController.getLoan);
router.post("/bid", loanController.bid);
router.post("/approve", loanController.approveBid);
router.post("/bid_counts", loanController.bid_count);
router.post("/done", loanController.markLoanAsDone);
router.get("/approved/:address", loanController.getUserApprovedBids);
router.get("/:address", loanController.getUserLoans);

module.exports = router;