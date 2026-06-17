const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const crypto = require('crypto');
const auth = require('../middlewares/auth');

// CREATE

router.post('/devices', async (req, res) => {
    try{
        const {name, location} = req.body;
        if (!name || !location) {
            return res.status(400).json({ error: {code: 400, message: "Champs 'name' et 'location' requis!" }});
        }
        const apiKey = crypto.randomUUID();
        const device = new Device({name, location, apiKey});
        await device.save();
        res.status(201).json( {data: {id: device._id, apiKey}} );
    } catch(err){
        res.status(400).json({ error: {code: 400, message: `Erreur lors de la creation de device: ${err.message}` }});
    }
})

// ME
router.get('/devices/me', auth, async (req, res) => {
    res.status(200).json({ data: { id: req.device._id, name: req.device.name, location: req.device.location } });
})

// READ
router.get('/devices', async (req, res) => {
    try{
        const devices = await Device.find({}, {apiKey: 0, __v: 0}) // On masque la cle API par mesure de securité.
        res.status(200).json({ data: devices, meta: { count: devices.length } });
    } catch(err){
        res.status(500).json({ error: {code: 500, message: err.message}});
    }
})


module.exports = router;