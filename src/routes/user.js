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

userRouter.get('/user/feed', userAuth, async (req, res) => {
    try{
        const user = req.user;
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 30 ? 30 : limit;
        if(!user){
            throw new Error("User not found");
        }
        if(page < 1 || limit < 1){
            throw new Error("Invalid page or limit");
        }

        const connectionRequests = await ConnectionRequest.find({
            $or: [
                {sender: user._id},
                {receiver: user._id}
            ]
        }).select('sender receiver');

        const hideUsersFromFeed = new Set();
        connectionRequests.forEach(connectionRequest => {
            hideUsersFromFeed.add(connectionRequest.sender.toString());
            hideUsersFromFeed.add(connectionRequest.receiver.toString());
        });

        const users = await User.find({
            $and: [
                {_id: {$nin: Array.from(hideUsersFromFeed)}},
                {_id: {$ne: user._id}}
            ]
        }).select(USER_SAFE_FIELDS)
          .skip((page - 1) * limit)
          .limit(limit);

        if(!users){
            res.send({message: "No users found"});
        }

        res.send({
            message: "Feed fetched successfully",
            users
        });
    }
    catch(err){
        res.status(400).send("Error while fetching feed: " + err);
    }
})

module.exports = userRouter;