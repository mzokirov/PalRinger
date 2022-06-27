const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    prefName: {
        type: String,
        trim: true
    },
    nicknames: [{
        type: String,
        trim: true
    }],
    email: {
        type: String,
        required: true,
        trim: true
    },
    hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    },
    phone: {
        type: Number,
        required: true
    },
    dob: {
        type: Date
    },
    message: {
        type: String,
        trim: true
    },
    education: {
        school: {
            type: String,
            trim: true
        },
        schoolGradYear: {
            type: Number,
            trim: true
        },
        university: {
            type: String,
            trim: true
        },
        uniGradYear: {
            type: Number,
            trim: true
        },
        uniMajor: {
            type: String,
            trim: true
        }
    },
    occupation: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    instagram: {
        type: String,
        trim: true
    },
    snapchat: {
        type: String,
        trim: true
    },
    discord: {
        type: String,
        trim: true
    },
    joinedOn: {
        type: Date
    },
    profileImage: {
        url: String,
        filename: String
    },
    banner: {
        url: String,
        filename: String
    },
    exclusions: [{
        type: String,
        trim: true
    }],
    pals: [{
        type: String,
        trim: true
    }],
    account: {
        twoFA: {
            type: Boolean,
            default: false
        },
        approved: {
            type: Boolean,
            default: false
        },
        verified: {
            type: Boolean,
            default: false
        },
        private: {
            type: Boolean,
            default: true
        }
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;