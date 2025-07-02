const socket = require('socket.io');
const Chat = require('../models/chat');
const { listeners } = require('../models/user');

const initializeSocket = (server) => {
    const io = socket(server, {
        cors: {
            origin: 'http://localhost:5173', // Update with your frontend URL
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('joinRoom', ({userId, targetUserId}) => {
            const roomId = [userId, targetUserId].sort().join('-');
            console.log(`User ${socket.id} joining room: ${roomId}`);
            // Join the chat room
            socket.join(roomId);
        });

        socket.on('sendMessage', async (data) => {
            const { text, targetUserId, userId, firstName, lastName } = data;
            console.log(`Message from ${firstName} ${lastName} to ${targetUserId}: ${text}`);
            const roomId = [userId, targetUserId].sort().join('-');

            //save message to database 
            try { 
                let chat = await Chat.findOne( {
                    participants: { $all: [userId, targetUserId] }
                } );
                if (!chat) {
                    const newChat = new Chat({
                        participants: [userId, targetUserId],
                        messages: [],
                    });
                    chat = newChat;
                }
                chat.messages.push({
                    senderId: userId,
                    text,
                });
                await chat.save();
                
            } catch (error) {
                console.error('Error saving message to database:', error);
            }

            io.to(roomId).emit('receiveMessage', {
                firstName,
                lastName,
                text,
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });

    });
}

module.exports = initializeSocket;