const User = require('./models/user');
const {
    loginSchema,
    signupSchema,
    profileSchema
} = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const bcrypt = require('bcrypt');

module.exports.isNewUser = async (req, res, next) => {
    const {
        email
    } = req.body;
    const user = await User.findOne({
        email
    });
    if (user) {
        req.flash("error", "User with the given email address already exists.");
        return res.redirect('/signup');
    }
    next();
}

module.exports.isUserExists = async (req, res, next) => {
    const {
        email
    } = req.body;
    const user = await User.findOne({
        email
    });
    if (!user) {
        req.flash("error", "User not found. Please try again");
        return res.redirect('/login');
    }
    next();
}

module.exports.checkPassword = async (req, res, next) => {
    const {
        email,
        password
    } = req.body;
    const user = await User.findOne({
        email
    });

    const match = await bcrypt.compare(password, user.hash);
    if (!match) {
        req.flash("error", "Incorrect email or password.");
        return res.redirect('/login');
    }
    next();
}

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        req.flash("error", "You must be logged in!");
        return res.redirect('/login');
    }
    next();
}
module.exports.notLoggedIn = (req, res, next) => {
    if (req.session.user) {
        req.flash("error", "You are already logged in.");
        return res.redirect('/');
    }
    next();
}
module.exports.isAdmin = async (req, res, next) => {
    const user = await User.findById(req.session.user);
    if (user.role != "admin") {
        req.flash("error", "Sorry, you don't have permission.");
        return res.redirect('/');
    }
    next();
}
module.exports.isMod = async (req, res, next) => {
    const user = await User.findById(req.session.user);
    if (user.role != "moderator" || user.role != "admin") {
        req.flash("error", "Sorry, you don't have permission.");
        return res.redirect('/');
    }
    next();
}
module.exports.isApproved = async (req, res, next) => {
    const user = await User.findById(req.session.user);
    if (!user.account.approved) {
        req.flash("error", "You account is waiting for approval.");
        return res.redirect('/login');
    }
    next();
}
//Input validation.
module.exports.validateLogin = (req, res, next) => {
    const {
        error
    } = loginSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}
module.exports.validateSignup = (req, res, next) => {
    const {
        error
    } = signupSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}

module.exports.validateProfile = (req, res, next) => {
    const {
        error
    } = profileSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
}