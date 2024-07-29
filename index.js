const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();
dotenv.config();
app.use(bodyParser.json());

// const mongoURI = 'your_mongoDB_connection_string';
const port = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
