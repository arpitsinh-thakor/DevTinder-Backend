const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const ConnectionRequest = require('../models/connectionRequest');
const { userAuth } = require('../middlewares/auth');

const USER_SAFE_FIELDS = 'firstName lastName photoUrl age gender about skills'

userRouter.get('/user/requests/received', userAuth, async (req, res) => {
    try{
        const user = req.user;
        if(!user){
            throw new Error("User not found");
        }

        const requests = await ConnectionRequest.find({
            receiver: user._id,
            status: 'interested' 
        }).populate('sender', USER_SAFE_FIELDS);
        if(!requests){
            res.send({message: "No requests found"});
        }

        res.send({
            message: "Requests fetched successfully",
            requests
        });
    } 
    catch(err){
        res.status(400).send("Error while fetching requests: " + err);
    }
})

userRouter.get('/user/requests/connections', userAuth, async (req, res) => {
    try{
        const user = req.user;
        if(!user){
            throw new Error("User not found");
        }

        const connections = await ConnectionRequest.find({
            $or: [
                {sender: user._id, status: 'accepted'},
                {receiver: user._id, status: 'accepted'}
            ]
        }).populate('sender', USER_SAFE_FIELDS).populate('receiver', USER_SAFE_FIELDS);

        if(!connections){
            res.send({message: "No connections found"});
        }

        const filteredConnections = connections.map(connection => {
            if(connection.sender._id.toString() === user._id.toString()){
                return connection.receiver
            }
            else{
                return connection.sender
            }
        });
        
        res.send({
            message: "Connections fetched successfully",
            connections: filteredConnections
        });

    }
    catch(err){
        res.status(400).send("Error while fetching connections: " + err);
    }
})

module.exports = userRouter;