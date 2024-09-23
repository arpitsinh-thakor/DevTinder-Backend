const express = require('express');
const requestRouter = express.Router();
const { userAuth } = require('../middlewares/auth');

requestRouter.post('/sendConnectionRequest/:userId', userAuth, async (req, res) => {
    const user = req.user;
    res.send(user);
})

module.exports = requestRouter