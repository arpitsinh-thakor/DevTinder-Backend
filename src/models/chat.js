const mongoose = require('mongoose');
const { Schema } = mongoose;

const  messageSchema = new mongoose.Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
},
{
    timestamps: true
});

const chatSchema = new Schema({
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [messageSchema],
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;