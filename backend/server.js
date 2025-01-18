const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const loanRoutes = require('./routes/loanRoutes');
const transactionRoutes=require('./routes/transactionRoutes')
const cors = require('cors'); 

const app = express();
app.use(cors());

mongoose.connect('mongodb+srv://jaindhairyashj:dhairyash85@tradehub.ihqkfez.mongodb.net/?retryWrites=true&w=majority&appName=TradeHub')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

app.use(bodyParser.json());

app.use('/api/loan', loanRoutes);
app.use('/api/txn', transactionRoutes)

const port = 5001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});