const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req, res, next) => {
    try {
        const cookies = req.cookies;
        const {token} = cookies;
        if (!token) {
            throw new Error("Invalid token");
        }

        const decodedPayload = await jwt.verify(token, 'DevTinder');
        const { _id } = decodedPayload;

        const user = await User.findById(_id);
        if (!user) {
            throw new Error("User not found");
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(400).send("Error while getting profile: " + err);
    }
}

module.exports = {userAuth};