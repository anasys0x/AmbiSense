const Device = require('../models/Device');

const auth = async (req, res, next) => {
    try{
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).send('Device non authentifié !');
        }
        const device = await Device.findOne({apiKey});

        if (!device) {
            return res.status(403).send("Device n'existe pas");

        }
        req.device = device;
        next();
    } catch (err) {
        res.status(401).send("Merci de vous authentifier !");
    }
}

module.exports = auth;