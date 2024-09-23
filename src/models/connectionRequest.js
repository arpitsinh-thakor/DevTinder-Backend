const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    // fromUserId
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    //toUserId
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ['ignored', 'interested', 'accepted', 'rejected'],
            message: '{VALUE} is not supported'
        },
        required: true
    }
}, {
    timestamps: true
});

connectionRequestSchema.index({ sender: 1, receiver: 1 });

connectionRequestSchema.pre('save', async function (next) {
    const request = this;
    if(request.sender.toString() === request.receiver.toString()){
        throw new Error("Sender and receiver cannot be same")
    } 
    next();
})

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);