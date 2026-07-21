const express = require('express');

const Measurement = require('../models/Measurement');
const Place = require('../models/Place');
const deviceAuth = require('../middlewares/auth');
const { classifyAmbiance, getLegacyStatus } = require('../services/ambiance');

const router = express.Router();

function serializePlace(place) {
    return {
        id: place._id,
        name: place.name,
        slug: place.slug,
        locationKey: place.locationKey || place.name,
        latitude: place.latitude,
        longitude: place.longitude
    };
}

async function getLatestAmbiance(location) {
    const measurement = await Measurement.findOne({ location }).sort({ timestamp: -1 });
    if (!measurement) {
        return null;
    }

    const classification = classifyAmbiance(measurement.value, measurement.timestamp);
    return {
        status: getLegacyStatus(measurement.value),
        value: measurement.value,
        timestamp: measurement.timestamp,
        classification,
        scale: classification.scale
    };
}

router.get('/places', async (req, res) => {
    try {
        const places = await Place.find({});
        places.sort((first, second) => first.name.localeCompare(second.name));

        const portraits = await Promise.all(places.map(async (place) => ({
            ...serializePlace(place),
            ambiance: await getLatestAmbiance(place.locationKey || place.name)
        })));

        res.status(200).json({ places: portraits });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
});

router.get('/places/:slug', async (req, res) => {
    try {
        const place = await Place.findOne({ slug: req.params.slug });
        if (!place) {
            return res.status(404).json({
                error: { code: 404, message: 'Lieu introuvable' }
            });
        }

        const ambiance = await getLatestAmbiance(place.locationKey || place.name);
        res.status(200).json({ place: serializePlace(place), ambiance });
    } catch (error) {
        res.status(500).json({ error: { code: 500, message: error.message } });
    }
});

router.post('/places', deviceAuth, async (req, res) => {
    try {
        const { name, slug, locationKey, latitude, longitude } = req.body;
        if (!name || !slug || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                error: {
                    code: 400,
                    message: 'Les champs name, slug, latitude et longitude sont requis.'
                }
            });
        }

        const place = new Place({ name, slug, locationKey: locationKey || name, latitude, longitude });
        await place.save();
        res.status(201).json({ place: serializePlace(place) });
    } catch (error) {
        res.status(400).json({ error: { code: 400, message: error.message } });
    }
});

module.exports = router;
