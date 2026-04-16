const express = require('express');
const bodyParser = require('body-parser');
const loanRoutes = require('./routes/loanRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use('/api/loan', loanRoutes);
app.use('/api/txn', transactionRoutes)

const port = 5001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});