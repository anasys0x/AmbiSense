const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Observation = require('../models/Observation');

router.post('/observations', auth, async (req, res) => {
    try{
        const { location, proximity, vibe, notes } = req.body;
        if (!location || !proximity || !vibe || notes === undefined) {
            return res.status(400).send("Champs 'location', 'proximity', vibe ou 'notes' manquant !")
        }
        const observations = new Observation({ location, proximity, vibe, notes });
        await observations.save();
        res.status(201).json(observations);

    } catch(err){
      res.status(400).json(err.message);
    }
})

module.exports = router;