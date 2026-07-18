const jwt = require('jsonwebtoken');

const User = require('../models/User');

async function userAuth(req, res, next) {
    try {
        const authorization = req.header('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new Error('Jeton manquant');
        }

        const authToken = authorization.replace('Bearer ', '');
        const secret = process.env.JWT_SECRET || process.env.PHRASE_PASS;
        const decodedToken = jwt.verify(authToken, secret);
        const user = await User.findOne({
            _id: decodedToken._id,
            'authTokens.authToken': authToken
        });

        if (!user) {
            throw new Error('Utilisateur introuvable');
        }

        req.authToken = authToken;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            error: {
                code: 401,
                message: 'Merci de vous authentifier.'
            }
        });
    }
}

module.exports = userAuth;
