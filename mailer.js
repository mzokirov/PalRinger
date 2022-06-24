const nodemailer = require('nodemailer');
const ExpressError = require('./utils/ExpressError.js');

const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

module.exports.sendMail = async ({
    sender,
    recipient,
    subject,
    text,
    html
}) => {
    try {
        await transporter.sendMail({
            from: sender,
            to: recipient,
            subject: subject,
            text: text,
            html: html
        });
        console.log('Email sent successfully!')
    } catch (e) {
        throw new ExpressError(e, 400);
    }
}