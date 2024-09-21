const express = require('express');
const connetDB = require('./config/database');
const app = express();
const User = require('./models/user');
const { validateSignUpData, validateLoginData } = require('./utils/validation');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { userAuth } = require('./middlewares/auth');

app.use(express.json());
app.use(cookieParser());

app.post('/signup', async (req, res) => {

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

app.post('/login', async (req, res) => {
    
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

app.get('/profile', userAuth, async (req, res) => {
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

app.get('/user', async (req, res) => {
    const email = req.body.email;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.send(user);
    } catch (err) {
        res.status(400).send("Error while getting users: " + err);
    }
})

app.get('/feed', async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (err) {
        res.status(400).send("Error while getting users: " + err);
    }
})

app.delete('/user', async (req, res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).send("UserId not found");
        }
        res.send(user);
    } catch (err) {
        res.status(400).send("Error while deleting user: " + err);
    }
})

app.patch('/user/:userId', async (req, res) => {
    const userId = req.params?.userId;
    const data = req.body;

    try {

        const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills"];
        const isUpdateAllowed = Object.keys(data).every((k) =>
                                    ALLOWED_UPDATES.includes(k));
        if (!isUpdateAllowed) {
            throw new Error("Update not allowed");
        }
        if (data?.skills.length > 10) {
            throw new Error("Skills cannot be more than 10");
        }

        const user = await User.findByIdAndUpdate(userId, data, 
                                { returnDocument: 'after', runValidators: true });
        if (!user) {
            return res.status(404).send("UserId not found");
        }
        res.send(user);
       
    } catch (err) {
        res.status(400).send("Error while updating user: " + err);
    }
})

app.post('/sendConnectionRequest/:userId', userAuth, async (req, res) => {
    const user = req.user;
    res.send(user);
})


connetDB()
    .then(() => {
        
    console.log('Database connected...');
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}
).catch((err) => {
    console.log(err);
});