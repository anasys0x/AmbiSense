const express = require('express');
const router = express.Router();
const observationAuth = require('../middlewares/observationAuth');
const Observation = require('../models/Observation');

router.post('/observations', observationAuth, async (req, res) => {
    try {
        const { location, proximity, vibe, notes, timestamp } = req.body;
        if (!location || !proximity || !vibe || notes === undefined) {
            return res.status(400).json({
                error: {
                    code: 400,
                    message: "Champs 'location', 'proximity', 'vibe' ou 'notes' manquant !"
                }
            });
        }

        const observation = new Observation({
            location,
            proximity,
            vibe,
            notes,
            timestamp,
            author: req.user ? req.user._id : undefined,
            deviceId: req.device ? req.device._id.toString() : undefined
        });
        await observation.save();

        const document = observation.toObject();
        res.status(201).json({ ...document, data: document });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

module.exports = router;
