const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const Observation = require('../models/Observation');
const {
    classifyAmbiance,
    getLegacyStatus,
    SCALE,
    SCALE_BANDS,
    summarizeObservations
} = require('../services/ambiance');
const {
    aggregateHistory,
    computeQuietHours,
    getHistoryIntervalMinutes,
    parseLastParam
} = require('../services/ambianceHistory');
const { addClient, removeClient } = require('../services/realtime');
const { cache, CACHE_PREFIX, CACHE_TTL_MS } = require('../services/cache');

/*
Bonus temps reel : le client s'abonne ici (SSE) et recoit les nouvelles
ambiances au fur et a mesure. Avec ?location=<lieu> on ne suit qu'un seul
lieu, sans le parametre on recoit tout.
 */
router.get('/ambiance/stream', (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });
    res.flushHeaders();
    res.write(': connecte au flux ambiance\n\n');

    const location = typeof req.query.location === 'string' ? req.query.location : null;
    const client = addClient(res, location);
    // Petit ping regulier sinon certains proxys coupent la connexion inactive
    const keepAlive = setInterval(() => res.write(': ping\n\n'), 25000);

    req.on('close', () => {
        clearInterval(keepAlive);
        removeClient(client);
    });
});

router.get('/ambiance/:location/status', async (req, res) => {
    try {
        const { location } = req.params;
        const measurement = await Measurement.findOne(
            { location },
            { deviceId: 0, __v: 0, _id: 0, receivedAt: 0 }
        ).sort({ timestamp: -1 });

        if (!measurement) {
            return res.status(404).json({
                error: { code: 404, message: 'Aucune donnée pour ce lieu' }
            });
        }

        const classification = classifyAmbiance(measurement.value, measurement.timestamp);
        const data = {
            location,
            status: getLegacyStatus(measurement.value),
            value: measurement.value,
            timestamp: measurement.timestamp,
            classification,
            scale: classification.scale
        };

        res.status(200).json({ ...data, data });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

router.get('/ambiance/:location/history', async (req, res) => {
    try {
        const { location } = req.params;
        const { last, summary } = req.query;

        // Cache : une meme periode demandee par plusieurs visiteurs est resservie
        // sans relire MongoDB. La cle distingue le lieu, la periode et le format.
        const cacheKey = `${CACHE_PREFIX.history}${location}:${last || ''}:${summary || ''}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const filter = { location };

        if (last) {
            filter.timestamp = { $gte: parseLastParam(last) };
        }

        const measurements = await Measurement.find(
            filter,
            { deviceId: 0, __v: 0, _id: 0, receivedAt: 0 }
        ).sort({ timestamp: 1 });

        const intervalMinutes = getHistoryIntervalMinutes(last);
        const slices = aggregateHistory(measurements, intervalMinutes);

        // On joint l'unite et l'echelle a la reponse : c'est le serveur qui
        // decrit les seuils, le client ne fait que les afficher.
        const meta = {
            location,
            count: slices.length,
            measurementCount: measurements.length,
            unit: SCALE.unit,
            scale: SCALE,
            bands: SCALE_BANDS,
            aggregation: {
                method: 'average',
                intervalMinutes
            }
        };
        const response = {
            location,
            count: measurements.length,
            slices,
            meta
        };

        // Le contrat historique reste inchangé par défaut. Le client web peut
        // demander uniquement les tranches afin de ne pas transférer toutes
        // les mesures brutes dans les longues périodes.
        if (summary !== 'true') {
            response.measurements = measurements;
            response.data = measurements;
        }

        cache.set(cacheKey, response, CACHE_TTL_MS.history);
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

router.get('/ambiance/:location/quiet-hours', async (req, res) => {
    try {
        const { location } = req.params;

        // Les creneaux calmes sont une moyenne sur tout l'historique du lieu :
        // couteux a recalculer, stable dans le temps -> bon candidat au cache.
        const cacheKey = `${CACHE_PREFIX.quietHours}${location}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const measurements = await Measurement.find(
            { location },
            { value: 1, timestamp: 1, _id: 0 }
        );

        if (measurements.length === 0) {
            // On ne met pas le 404 en cache : des qu'une mesure arrivera, la
            // reponse changera. Seul le succes est memorise.
            return res.status(404).json({
                error: { code: 404, message: 'Aucune donnée pour ce lieu' }
            });
        }

        const quietHours = computeQuietHours(measurements);
        const payload = {
            data: quietHours,
            meta: {
                location,
                count: measurements.length,
                unit: SCALE.unit,
                scale: SCALE,
                bands: SCALE_BANDS,
                quietest: quietHours[0]
            }
        };

        cache.set(cacheKey, payload, CACHE_TTL_MS.quietHours);
        res.status(200).json(payload);
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

router.get('/ambiance/:location/vibe', async (req, res) => {
    try {
        const { location } = req.params;
        const observations = await Observation.find(
            { location },
            { vibe: 1, proximity: 1, notes: 1, receivedAt: 1, _id: 0 }
        ).sort({ receivedAt: -1 }).limit(10);

        if (observations.length === 0) {
            return res.status(404).json({
                error: { code: 404, message: 'Aucune observation pour ce lieu' }
            });
        }

        const summary = summarizeObservations(observations);

        res.status(200).json({
            data: {
                location,
                ...summary
            },
            meta: { basedOn: observations.length }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

module.exports = router;
