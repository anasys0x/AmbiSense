const express = require('express');

const Measurement = require('../models/Measurement');
const Place = require('../models/Place');
const { loadRecommendationData } = require('../repositories/recommendations');
const {
    buildRecommendationResponse,
    parseRecommendationCriteria
} = require('../services/recommendations');

const router = express.Router();

router.get('/recommendations', async (req, res) => {
    try {
        const criteria = parseRecommendationCriteria(req.query);
        const { places, aggregates } = await loadRecommendationData(
            { PlaceModel: Place, MeasurementModel: Measurement },
            criteria
        );

        return res.status(200).json(
            buildRecommendationResponse(places, aggregates, criteria)
        );
    } catch (error) {
        const status = error instanceof RangeError ? 400 : 500;
        return res.status(status).json({
            error: { code: status, message: error.message }
        });
    }
});

module.exports = router;
