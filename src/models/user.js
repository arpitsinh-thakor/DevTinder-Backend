const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');    

const userSchema = new mongoose.Schema({
    firstName : {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50,
        trim: true
    },
    lastName : {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50,
        trim: true
    },
    email : {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        trim: true,
        minLength: 3,
        maxLength: 320,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email - " + value);
            }
        }
    },
    password : {
        type: String,
        required: true,
        trim: true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("Invalid Password - " + value);
            }
        }
    },
    age :{
        type: Number,
        min: 18,
    },
    gender : {
        type: String,
        trim: true,
        enum: {
            values : ['male', 'female', 'other'],
            message : '{VALUE} is not valid gender type'
        }
    },
    photoUrl : {
        type: String,
        default: 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png',
        trim: true,
        validate(value){
            if(!validator.isURL(value)){
                throw new Error("Invalid URL - " + value);
            }
        }
    },
    about : {
        type: String,
        maxLength : 50,
        minLength : 3,
    },
    skills : {
        type: [String],
        maxLength: 10,
    },
},
{
    timestamps: true
});

userSchema.index({firstName: 1, lastName: 1, email: 1});

userSchema.methods.getJWT = async function(){
    const user = this;
    const token = jwt.sign({_id: user._id}, 'DevTinder', {expiresIn: '1 day'});
    return token;
}

userSchema.methods.validatePassword = async function(passwordInputByUser){
    const user = this;
    if(!validator.isStrongPassword(passwordInputByUser)){
        throw new Error('Not enough strong password');
    }
    const isMatch = await bcrypt.compare(passwordInputByUser, user.password);
    return isMatch;
}

module.exports = mongoose.model('User', userSchema);