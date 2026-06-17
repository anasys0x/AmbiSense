const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Observation = require('../models/Observation');

router.post('/observations', auth, async (req, res) => {
    try{
        const { location, proximity, vibe, notes, timestamp } = req.body;
        if (!location || !proximity || !vibe || notes === undefined) {
            return res.status(400).json({error: {code: 400, message: "Champs 'location', 'proximity', vibe ou 'notes' manquant !"}})
        }
        const observations = new Observation({ location, proximity, vibe, notes, timestamp, deviceId: req.device._id });
        await observations.save();
        res.status(201).json({ data: observations });

    } catch(err){
      res.status(400).json({ error: { code: 400, message: err.message } });
    }
})

module.exports = router;