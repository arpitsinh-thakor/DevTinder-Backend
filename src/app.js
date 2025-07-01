const express = require('express');
const connetDB = require('./config/database');
const app = express();
const User = require('./models/user');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();
// require('./utils/cronjob')

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require('./routes/user');
const paymentRouter = require('./routes/payment');

app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);
app.use('/', paymentRouter);

connetDB()
    .then(() => {
        
    console.log('Database connected...');
    app.listen(process.env.PORT, () => {
        console.log('Server is running on port 3000');
    });
}
).catch((err) => {
    console.log(err);
});