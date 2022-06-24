const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const verificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now(),
        required: true
    },
    expires: {
        type: Date,
        default: Date.now() + 600000,
        required: true
    }
});

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;