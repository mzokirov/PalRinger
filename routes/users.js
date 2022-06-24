const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const {
    isLoggedIn,
    notLoggedIn,
    isAdmin,
    isMod,
    isApproved,
    isNewUser,
    isUserExists,
    checkPassword,
    validateLogin,
    validateSignup
} = require('../middleware');

router.get('/login', notLoggedIn, users.renderLogin);
router.post('/login', notLoggedIn, validateLogin, isUserExists, checkPassword, catchAsync(users.login));
router.get('/logout', isLoggedIn, users.logout);

router.get('/signup', notLoggedIn, users.renderSignup);
router.post('/signup', notLoggedIn, validateSignup, isNewUser, catchAsync(users.register));

router.get('/profile/:userid', isLoggedIn, catchAsync(users.renderProfile));
router.put('/profile/:userid', isLoggedIn, catchAsync(users.editProfile));

router.post('/verify', isLoggedIn, catchAsync(users.sendVerification));
router.get('/verify/:userid/:token', catchAsync(users.verifyEmail));

router.get('/admin/users', isLoggedIn, isAdmin, catchAsync(users.renderAdminUsers));
router.get('/admin/applicants', isLoggedIn, isAdmin, catchAsync(users.renderAdminApplicants));
router.get('/admin/mods', isLoggedIn, isAdmin, catchAsync(users.renderMods));

router.post('/admin/users/:userid', isLoggedIn, isAdmin, catchAsync(users.makeMod));
router.post('/admin/users/:userid/remove', isLoggedIn, isAdmin, catchAsync(users.removeMod));
router.post('/admin/applicants/:userid', isLoggedIn, isMod, catchAsync(users.approveAccount));

module.exports = router;