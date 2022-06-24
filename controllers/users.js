const User = require('../models/user');
const Verification = require('../models/verification');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const {
    sendMail
} = require('../mailer');

module.exports.renderLogin = (req, res) => {
    res.render('user/login');
}

module.exports.renderSignup = (req, res) => {
    res.render('user/signup');
}

module.exports.register = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phone,
        password
    } = req.body;

    if (email.split("@")[1] != "millenniumbrooklynhs.org") {
        req.flash("error", "Email must be issued by MBHS!");
        return res.redirect('/signup');
    }
    const genHash = (pass) => {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(12, function(err, salt) {
                bcrypt.hash(pass, salt, function(err, hash) {
                    if (!err) {
                        resolve(hash);
                    } else {
                        reject("There was an error");
                    }
                });
            });
        });
    }
    const first = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const last = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
    genHash(password).then(async function(hash) {
        const newUser = new User({
            firstName: first,
            lastName: last,
            prefName: first,
            email,
            phone,
            hash,
            joinedOn: new Date()
        });
        await newUser.save();
        const token = uuid.v4();
        genHash(token).then(async function(hash) {
            const ver = new Verification({
                user: newUser._id,
                token: hash
            });
            await ver.save();
            await sendMail({
                sender: process.env.EMAIL,
                recipient: [email, process.env.EMAIL],
                subject: "Verify your email",
                text: `Please click or copy and paste the link in the browser to verify your email. https://palringer.herokuapp.com/verify/${newUser._id}/${token}`,
                html: `<p>Click the link below to verify your account. It expires in 10 minutes from the time it was sent.</p><br><a href='https://palringer.herokuapp.com/verify/${newUser._id}/${token}'>https://palringer.herokuapp.com/verify/${newUser._id}/${token}</a>`
            });
        }).catch(function(err) {
            req.flash("err", err);
            return res.redirect('/');
        });
    }).catch(function(err) {
        req.flash("err", err);
        return res.redirect('/');
    });
    req.flash("success", "Great! Your account was successfully created! Please allow some time for approval. In the meantime, check your email for a verification link.");
    res.redirect("/");
}

module.exports.verifyEmail = async (req, res) => {
    const {
        userid,
        token
    } = req.params;
    const user = await User.findById(userid);
    const ver = await Verification.findOne({
        user: userid
    });
    if (!user) {
        req.flash("error", "Sorry, the link is invalid.");
        return res.redirect('/');
    }
    if (user.account.verified) {
        req.flash("error", "Your email address is already verified.");
        return res.redirect('/');
    }
    if (!ver) {
        req.flash("error", "Sorry, the link is invalid.");
        return res.redirect('/');
    }
    const date = new Date(ver.expires).getTime();
    if (Date.now() >= date) {
        req.flash("error", "Sorry, the link is expired. Please request a new link through your profile page.");
        return res.redirect('/');
    }
    const match = await bcrypt.compare(token, ver.token);
    if (!match) {
        req.flash("error", "Sorry, the link is invalid.");
        return res.redirect('/');
    }
    await Verification.deleteMany({
        user: userid
    });
    user.account.verified = true;
    await user.save();
    res.render('user/confirmation', {
        result: "Congratulations! Your email address was successfully verified!"
    });
}

module.exports.sendVerification = async (req, res) => {
    const ver = await Verification.findOne({
        user: req.session.user
    });
    if (ver != null) {
        const expiration = new Date(ver.expires);
        if (Date.now() < expiration.getTime()) {
            req.flash("info", "A verification link was already emailed to you.");
            return res.redirect(`/profile/${req.session.user}`);
        }
    }
    await Verification.deleteMany({
        user: req.session.user
    });
    const genHash = (pass) => {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(12, function(err, salt) {
                bcrypt.hash(pass, salt, function(err, hash) {
                    if (!err) {
                        resolve(hash);
                    } else {
                        reject("There was an error");
                    }
                });
            });
        });
    }
    const token = uuid.v4();
    genHash(token).then(async function(hash) {
        const user = await User.findById(req.session.user);
        const newVer = new Verification({
            user: req.session.user,
            token: hash
        });
        await newVer.save();
        await sendMail({
            sender: process.env.EMAIL,
            recipient: user.email,
            subject: "Verify your email",
            text: `Please click or copy and paste the link in the browser to verify your email. https://palringer.herokuapp.com/verify/${req.session.user}/${token}`,
            html: `<p>Click the link below to verify your account. It expires in 10 minutes from the time it was sent.</p><br><a href='https://palringer.herokuapp.com/verify/${req.session.user}/${token}'>https://palringer.herokuapp.com/verify/${req.session.user}/${token}</a>`
        });
    }).catch(function(err) {
        req.flash("err", err);
        return res.redirect('/signup');
    });
    req.flash("success", "A new verification link has been sent to your email.");
    res.redirect(`/profile/${req.session.user}`);
}

module.exports.login = async (req, res) => {
    const {
        email
    } = req.body;
    const user = await User.findOne({
        email
    });
    if (!user.account.approved) {
        req.flash("info", "You account is awaiting approval.");
        return res.redirect('/login');
    }
    req.session.user = user._id;
    req.flash("success", `Welcome back, ${user.prefName}!`);
    res.redirect('/');
}

module.exports.logout = (req, res) => {
    delete req.session.user;
    req.flash("success", "Successfully logged out!");
    res.redirect('/login');
}

module.exports.renderProfile = async (req, res) => {
    const {
        userid
    } = req.params;
    const user = await User.findById(userid);
    const loggedUser = await User.findById(req.session.user);
    let excluded = true;
    if(!user.exclusions.includes(loggedUser.email.split("@")[0])) {
        excluded = false;
    }
    if (!user) {
        req.flash("error", "User not found. Please try again.");
        return res.redirect('/login');
    }
    res.render('user/profile', {
        user, excluded
    });
}

module.exports.editProfile = async (req, res) => {
    const user = await User.findById(req.session.user);
    let formData = req.body;
    const nicknames = req.body.nicknames.split(",");
    const rawExclusions = req.body.exclusions.split(",");
    let exclusions = [];
    for(let i = 0; i<rawExclusions.length; i++) {
        exclusions.push(rawExclusions[i].trim().split("@")[0]);
    }
    if (formData.email != user.email) {
        formData.account = {
            approved: user.account.approved,
            verified: false,
            twoFA: user.account.twoFA
        };
    }
    if (formData.email.split("@")[1] != "millenniumbrooklynhs.org") {
        req.flash("error", "Email must be issued by MBHS!");
        return res.redirect(`/profile/${user._id}`);
    }

    await User.findByIdAndUpdate(req.session.user, {
        message: req.body.message,
        dob: req.body.dob,
        gradeLevel: req.body.gradeLevel,
        prefName: req.body.prefName,
        phone: req.body.phone,
        email: req.body.email,
        nicknames,
        website: req.body.website,
        instagram: req.body.instagram,
        snapchat: req.body.snapchat,
        discord: req.body.discord,
        exclusions
    });
    req.flash("success", "Profile updated!");
    res.redirect(`/profile/${req.session.user}`);
}

module.exports.renderAdminUsers = async (req, res) => {
    const users = await User.find({role: {$ne: "moderator"}, 'account.approved': true,  _id: {$ne: req.session.user}});
    res.render('admin/users', {users});
}

module.exports.renderAdminApplicants = async (req, res) => {
    const users = await User.find({'account.approved': false});
    res.render('admin/applicants', {users});
}

module.exports.renderMods = async (req, res) => {
    const users = await User.find({role: "moderator", _id: {$ne: req.session.user}});
    res.render('admin/mods', {users});
}

module.exports.makeMod = async (req, res) => {
    const {userid} = req.params;
    await User.findByIdAndUpdate(userid, {
        $set: {
            role: "moderator"
        }
    });

    req.flash("success", "User's role was changed to moderator.");
    res.redirect('/admin/users');
}

module.exports.removeMod = async (req, res) => {
    const {userid} = req.params;
    await User.findByIdAndUpdate(userid, {
        $set: {
            role: "user"
        }
    });

    req.flash("success", "User's moderator role was deprecated.");
    res.redirect('/admin/mods');
}

module.exports.approveAccount = async (req, res) => {
    const {userid} = req.params;
    await User.findByIdAndUpdate(userid, {
        $set: {
            'account.approved': "admin"
        }
    });
    req.flash("success", "You approved user's account.");
    res.redirect('/admin/applicants');
}