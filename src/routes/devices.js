const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const crypto = require('crypto')

// CREATE

router.post('/devices', async (req, res) => {
    try{
        const {name, location} = req.body;
        if (!name || !location) {
            return res.status(400).send("Champs 'name' et 'location' requis!");
        }
        const apiKey = crypto.randomUUID();
        const device = new Device({name, location, apiKey});
        await device.save();
        res.status(201).json({id: device._id, apiKey});
    } catch(err){
        res.status(400).send(`Erreur lors de la creation de device: ${err.message}`);
    }
})

// READ
router.get('/devices', async (req, res) => {
    try{
        const devices = await
            Device.find({}, {apiKey: 0, __v: 0}) // On masque la cle API par mesure de securité.
        res.send(devices);
    } catch(err){
        res.status(500).send(err.message);
    }
})


module.exports = router;