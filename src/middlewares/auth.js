const Device = require('../models/Device');

const auth = async (req, res, next) => {
    try{
        // Header apiKey doit se nommer x-api-key !
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ error: {code: 401, message:'Veuillez inclure votre clé API dans le Header !' }});
        }
        const device = await Device.findOne({apiKey});

        if (!device) {
            return res.status(403).json( {error: {code: 403, message: "Device n'existe pas" }});

        }
        req.device = device;
        next();
    } catch (err) {
        res.status(401).json({ error: {code: 401, message: "Merci de vous authentifier !" }});
    }
}

module.exports = auth;