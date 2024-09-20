const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect('mongodb+srv://arpit:arpit@cluster0.kt4u56e.mongodb.net/devTinder')
}

module.exports = connectDB;