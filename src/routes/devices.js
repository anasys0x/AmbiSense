const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const crypto = require('crypto');
const auth = require('../middlewares/auth');
const { hashApiKey } = require('../middlewares/auth');

// CREATE

router.post('/devices', async (req, res) => {
    try{
        const {name, location} = req.body;
        if (!name || !location) {
            return res.status(400).json({ error: {code: 400, message: "Champs 'name' et 'location' requis!" }});
        }
        const apiKey = crypto.randomUUID();
        const device = new Device({name, location, apiKeyHash: hashApiKey(apiKey)});
        await device.save();
        res.status(201).json( {data: {id: device._id, apiKey}} );
    } catch(err){
        res.status(500).json({ error: {code: 500, message: err.message }});
    }
})

// ME
router.get('/devices/me', auth, async (req, res) => {
    res.status(200).json({ data: { id: req.device._id, name: req.device.name, location: req.device.location } });
})

// READ
router.get('/devices', async (req, res) => {
    try{
        const devices = await Device.find({}, {apiKeyHash: 0, __v: 0})
        res.status(200).json({ data: devices, meta: { count: devices.length } });
    } catch(err){
        res.status(500).json({ error: {code: 500, message: err.message}});
    }
})


module.exports = router;
