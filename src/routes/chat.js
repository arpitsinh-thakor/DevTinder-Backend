const express = require('express');
const Chat = require('../models/chat');
const { userAuth } = require('../middlewares/auth');
const chatRouter = express.Router();

chatRouter.get('/chat/:targetUserId', userAuth, async (req, res) => {

    const { targetUserId } = req.params;
    const userId = req.user._id;

    try {
        let chat = await Chat.findOne(
            {
                participants: { $all: [userId, targetUserId] }
            })
            .populate({
                path: 'messages.senderId',
                select: 'firstName lastName senderId',
            })

        if (!chat) {
            chat = new Chat({
                participants: [userId, targetUserId],
                messages: [],
            });
            await chat.save();
        }

        res.status(200).json(chat);
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
    
});

module.exports = chatRouter;