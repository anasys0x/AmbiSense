const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Measurement = require('../models/Measurement');
const Device = require('../models/Device');

router.post('/measurements', auth, async (req, res) => {
    try{
        const { type, value, location , timestamp} = req.body;
        if (!type || value === undefined || !location || !timestamp) {
            return res.status(400).json("Un ou plusieurs champs manquant (type, value, timestamp ou location)");
        }
        const measurement = new Measurement({ type, value, location, timestamp, deviceId: req.device._id })
        await measurement.save();
        res.status(201).json(measurement);

    } catch(err) {
        res.status(400).send(err)
    }
})

module.exports = router;