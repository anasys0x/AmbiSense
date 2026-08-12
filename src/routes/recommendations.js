const express = require('express');

const Measurement = require('../models/Measurement');
const Place = require('../models/Place');
const { VALID_AMBIANCES, rankRecommendations } = require('../services/recommendations');

const router = express.Router();
const DEFAULT_TIMEZONE = 'America/Toronto';

router.get('/recommendations', async (req, res) => {
    const ambiance = req.query.ambiance;
    const hour = Number(req.query.hour);

    if (!VALID_AMBIANCES.includes(ambiance)) {
        return res.status(400).json({
            error: { code: 400, message: 'ambiance doit être calm, moderate ou animated' }
        });
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return res.status(400).json({
            error: { code: 400, message: 'hour doit être un entier de 0 à 23' }
        });
    }

    try {
        const places = await Place.find({});
        const locations = places.map((place) => place.locationKey || place.name);
        const timezone = process.env.APP_TIMEZONE || DEFAULT_TIMEZONE;

        const aggregates = locations.length === 0 ? [] : await Measurement.aggregate([
            { $match: { location: { $in: locations } } },
            {
                $project: {
                    location: 1,
                    value: 1,
                    localHour: {
                        $hour: { date: '$timestamp', timezone }
                    }
                }
            },
            { $match: { localHour: hour } },
            {
                $group: {
                    _id: '$location',
                    averageValue: { $avg: '$value' },
                    sampleCount: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            data: rankRecommendations(places, aggregates, ambiance, hour),
            meta: {
                desiredAmbiance: ambiance,
                hour,
                timezone,
                unit: 'dB',
                totalMeasurements: aggregates.reduce(
                    (total, aggregate) => total + aggregate.sampleCount,
                    0
                )
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: { code: 500, message: error.message }
        });
    }
});

module.exports = router;
