const express = require('express');

const Measurement = require('../models/Measurement');
const Place = require('../models/Place');
const { loadRecommendationData } = require('../repositories/recommendations');
const {
    buildRecommendationResponse,
    parseRecommendationCriteria
} = require('../services/recommendations');
const { cache, CACHE_PREFIX, CACHE_TTL_MS } = require('../services/cache');

const router = express.Router();

router.get('/recommendations', async (req, res) => {
    try {
        // parseRecommendationCriteria valide d'abord : un critere invalide leve
        // une RangeError (404/400) et n'est donc jamais mis en cache.
        const criteria = parseRecommendationCriteria(req.query);

        // Le classement pour un couple (ambiance, heure) est identique pour tout
        // le monde : on le sert depuis le cache quand il est encore frais.
        const cacheKey = `${CACHE_PREFIX.recommendations}${criteria.ambiance}:${criteria.hour}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const { places, aggregates } = await loadRecommendationData(
            { PlaceModel: Place, MeasurementModel: Measurement },
            criteria
        );

        const payload = buildRecommendationResponse(places, aggregates, criteria);
        cache.set(cacheKey, payload, CACHE_TTL_MS.recommendations);
        return res.status(200).json(payload);
    } catch (error) {
        const status = error instanceof RangeError ? 400 : 500;
        return res.status(status).json({
            error: { code: status, message: error.message }
        });
    }
});

module.exports = router;
