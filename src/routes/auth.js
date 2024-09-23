const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { validateSignUpData, validateLoginData } = require('../utils/validation');
const bcrypt = require('bcrypt');


router.post('/signup', async (req, res) => {

    try {
        validateSignUpData(req);

        const {firstName, lastName, email, password} = req.body;

        const hashedPassword = await bcrypt.hash(password, 8);

        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        const savedUser = await user.save();
        res.send(savedUser);
    } catch (err) {
        res.status(400).send("Error while saving user: " + err);
    }
})

router.post('/login', async (req, res) => {
    
    try {
        validateLoginData(req);

        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isMatch = await user.validatePassword(password);

        if (!isMatch) {
            return res.status(404).send("Invalid credentials");
        }

        const token = await user.getJWT();

        res.cookie('token', token, {
            expires: new Date(Date.now() + 3600000),
        });
        console.log(token);
        res.send({
            message: "Login successful",
            user
        });
    } catch (err) {
        res.status(400).send("Error while getting users: " + err);
    }
})

router.post('/logout', async (req, res) => {
    res.clearCookie('token');
    res.send("Logged out successfully");
})

module.exports = router;