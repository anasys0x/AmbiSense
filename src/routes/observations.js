const express = require('express');
const router = express.Router();
const observationAuth = require('../middlewares/observationAuth');
const Observation = require('../models/Observation');

router.post('/observations', observationAuth, async (req, res) => {
    try{
        const { location, proximity, vibe, notes } = req.body;
        if (!location || !proximity || !vibe || notes === undefined) {
            return res.status(400).send("Champs 'location', 'proximity', vibe ou 'notes' manquant !")
        }
        const observations = new Observation({
            location,
            proximity,
            vibe,
            notes,
            author: req.user ? req.user._id : undefined
        });
        await observations.save();
        res.status(201).json(observations);

    } catch(err){
      res.status(400).json(err.message);
    }
})

module.exports = router;
