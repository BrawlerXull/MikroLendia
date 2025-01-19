const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
  amount: Number,
  from: {
    type: String,
    required: true,
  },
  signatures: {
    type: [ {address: String, signature: String} ]
  },
  to: {
    type: String,
    required: true,
  },
  reason:{
    type: String,
    required:true
  },
  txHash: {
    type: String,
    default: false
  },
  executed: {
    type: Boolean,
  },
})

const Transaction= mongoose.model("Transaction", txnSchema);
module.exports=Transaction