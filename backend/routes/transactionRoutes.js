const express = require('express');
const { addTxn, executeTransaction, getAllTxn, signTxn, createCommunity } = require("../controllers/transactionController.js");

const router = express.Router();

router.post("/", getAllTxn);
router.post("/add", addTxn);
router.post("/sign", signTxn);
router.post("/execute", executeTransaction);

module.exports=router