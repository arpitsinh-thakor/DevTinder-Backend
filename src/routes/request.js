const express = require('express');
const requestRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const User = require('../models/user');
const ConnectionRequest = require('../models/connectionRequest');

requestRouter.post('/request/send/:status/:receiverId', userAuth, async (req, res) => {
    try{
        const sender = req.user;
        const receiverId = req.params.receiverId;
        const status = req.params.status;
        if(!sender || !receiverId || !status){
            throw new Error("Invalid data for request");
        }

        const allowedStatus = ['interested', 'ignored'];
        if(!allowedStatus.includes(status)){
            throw new Error("Invalid status for request");
        }

        const receiver = await User.findById(receiverId);
        if(!receiver){
            throw new Error("Receiver not found");
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                {sender: sender._id, receiver: receiverId},
                {sender: receiverId, receiver: sender._id}
            ]
        });
        if(existingRequest){
            throw new Error("Request already exists");
        }

        const request = new ConnectionRequest({
            sender: sender._id,
            receiver: receiverId,
            status: status
        });
        await request.save();
        res.send({
            message: "Request sent successfully",
            request
        });
    }
    catch(err){
        res.status(400).send("Error while sending request: " + err);
    }
})

module.exports = requestRouter