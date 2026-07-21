const Device = require('../models/Device');
const crypto = require('crypto');

const hashApiKey = (apiKey) => crypto.createHash('sha256').update(apiKey).digest('hex');

const auth = async (req, res, next) => {
    try{
        // Header apiKey doit se nommer x-api-key !
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ error: {code: 401, message:'Veuillez inclure votre clé API dans le Header !' }});
        }
        const device = await Device.findOne({ apiKeyHash: hashApiKey(apiKey) });

        if (!device) {
            return res.status(403).json( {error: {code: 403, message: "Device n'existe pas" }});

        }
        req.device = device;
        next();
    } catch (err) {
        res.status(500).json({ error: {code: 500, message: "Erreur lors de l'authentification du dispositif" }});
    }
}

module.exports = auth;
module.exports.hashApiKey = hashApiKey;
