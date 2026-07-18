const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const { classifyAmbiance, getLegacyStatus } = require('../services/ambiance');

// FUNCTIONS
/*
Fonction qui interprete les value de Measurement, j'assume un rangee, et je retourne
l'ambiance. Ex:
< 40db --> quiet
< 70 --> moderate
sinon toute autre valeur je retourne noisy\
 */
/*
Fonction qui parse le query param last
 */
const parseLastParam = (last) => {
    const hours = parseInt(last);
    return new Date(Date.now() - hours * 3600000)
}


// READ

router.get('/ambiance/:location/status', async (req,res) => {
    try{
        const { location } = req.params;
        const measurement = await Measurement.findOne({ location },
            { deviceId: 0, __v: 0, __id: 0, receivedAt: 0}).sort({ timestamp: -1}); // Je retire deviceId, et receivedAt de la vue
        if(!measurement){
            return res.status(404).json({error: {code: 404, message: "Aucune donnée pour ce lieu"}})
        }
        const classification = classifyAmbiance(measurement.value, measurement.timestamp);
        res.status(200).json({
            location,
            status: getLegacyStatus(measurement.value),
            value: measurement.value,
            timestamp: measurement.timestamp,
            classification,
            scale: classification.scale
        })

    } catch(err){
        res.status(500).json({ error: {code: 500, message: err.message} });

    }
})

router.get('/ambiance/:location/history', async (req, res) => {
    try {
        const { location } = req.params;
        const { last } = req.query;
        const filter = { location };
        if (last) {
            filter.timestamp = { $gte: parseLastParam(last) };
        }
        const measurements = await Measurement.find(filter, { deviceId: 0, __v: 0, _id: 0, receivedAt: 0 }).sort({ timestamp: 1 });
        if (measurements.length === 0) {
            return res.status(404).json({ error: { code: 404, message: "Aucune donnée pour ce lieu" } });
        }
        res.status(200).json({ location, measurements, count: measurements.length });
    } catch(err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
})

module.exports = router;
