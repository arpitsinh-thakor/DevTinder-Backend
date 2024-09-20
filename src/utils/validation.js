const validator = require('validator');

const validateSignUpData = (req) => {
    const { firstName, lastName, email, password, } = req.body;

    if (!firstName || !lastName || !email || !password) {
        throw new Error("Invalid data");
    }
    else if(!validator.isEmail(email)){
        throw new Error("Invalid Email - " + email);
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Invalid Password - " + password);
    }
}

const validateLoginData = (req) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new Error("Invalid data");
    }
    else if(!validator.isEmail(email)){
        throw new Error("Invalid Email - " + email);
    }
    else if(!validator.isStrongPassword(password)){
        throw new Error("Invalid Password - " + password);
    }
}

module.exports = { validateSignUpData, validateLoginData };