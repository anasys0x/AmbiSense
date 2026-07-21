const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Measurement = require('../models/Measurement');
const Device = require('../models/Device');
const { classifyAmbiance } = require('../services/ambiance');
const { publishAmbiance } = require('../services/realtime');

router.post('/measurements', auth, async (req, res) => {
    try{
        const { type, value, location , timestamp} = req.body;
        if (!type || value === undefined || !location || !timestamp) {
            return res.status(400).json({ error: {code: 400, message: 'Un ou plusieurs champs manquant (type, value, timestamp ou location)'} });
        }
        const measurement = new Measurement({ type, value, location, timestamp, deviceId: req.device._id })
        await measurement.save();

        // Des que la mesure est enregistree, on previent les clients connectes
        // au flux SSE avec la nouvelle ambiance (bonus temps reel)
        const classification = classifyAmbiance(measurement.value, measurement.timestamp);
        publishAmbiance({
            location: measurement.location,
            value: measurement.value,
            unit: classification.scale.unit,
            code: classification.code,
            label: classification.label,
            timestamp: measurement.timestamp
        });

        res.status(201).json({ data: measurement });

    } catch(err) {
        const status = err.name === 'ValidationError' ? 400 : 500;
        res.status(status).json({ error: {code: status, message: err.message} })
    }
})

module.exports = router;
