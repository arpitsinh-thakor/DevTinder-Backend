const express = require('express');
const profileRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const { validateProfileData } = require('../utils/validation');
const bcrypt = require('bcrypt');

profileRouter.get('/profile/view', userAuth, async (req, res) => {
    try {
        
        const user = req.user;
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.send(user)
    } catch (err) {
        res.status(400).send("Error while getting profile: " + err);
    }
})

profileRouter.patch('/profile/edit', userAuth, async (req, res) => {
    try {
        
        if(!validateProfileData(req)){
            throw new Error("Invalid data for profile edit");
        }

        const user = req.user;
        if (!user) {
            return res.status(404).send("User not found");
        }

        Object.keys(req.body).forEach((field) => {
            user[field] = req.body[field];            
        });

        await user.save();
        res.send(user);
        
    } catch (err) {
        res.status(400).send("Error while updating profile: " + err);
    }
})

profileRouter.patch('/profile/change-password', userAuth, async (req, res) => {
    try {
        
        const user = req.user;
        if (!user) {
            return res.status(404).send("User not found");
        }

        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new Error("Old password and new password are required");
        }

        const isMatch = await user.validatePassword(oldPassword);
        if (!isMatch) {
            return res.status(404).send("Invalid credentials");
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 8);
        user.password = newHashedPassword;
        await user.save();
        res.send({message: "Password changed successfully", user});

        
    } catch (err) {
        res.status(400).send("Error while updating password: " + err);
    }
})

module.exports = profileRouter;