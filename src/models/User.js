const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

function getJwtSecret() {
    return process.env.JWT_SECRET || process.env.PHRASE_PASS;
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Le courriel est invalide.');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Place'
    }],
    authTokens: [{
        authToken: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

userSchema.methods.toJSON = function toJSON() {
    const user = this.toObject();
    delete user.password;
    delete user.authTokens;
    return user;
};

userSchema.methods.generateAuthTokenAndSaveUser = async function generateAuthTokenAndSaveUser() {
    const secret = getJwtSecret();
    if (!secret) {
        throw new Error('JWT_SECRET doit être configuré.');
    }

    const authToken = jwt.sign({ _id: this._id.toString() }, secret, { expiresIn: '7d' });
    this.authTokens = [...this.authTokens, { authToken }];
    await this.save();
    return authToken;
};

userSchema.statics.findByCredentials = async function findByCredentials(email, password) {
    const user = await this.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        throw new Error('Courriel ou mot de passe invalide.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Courriel ou mot de passe invalide.');
    }
    return user;
};

userSchema.pre('save', async function hashPassword() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
});

module.exports = mongoose.model('User', userSchema);
