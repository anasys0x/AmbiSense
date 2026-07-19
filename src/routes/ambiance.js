const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const Observation = require('../models/Observation');
const { classifyAmbiance, getLegacyStatus, SCALE, SCALE_BANDS } = require('../services/ambiance');
const { addClient, removeClient } = require('../services/realtime');

const parseLastParam = (last) => {
    const hours = parseInt(last, 10);
    return new Date(Date.now() - hours * 3600000);
};

const computeQuietHours = (measurements) => {
    const groups = {};

    for (const measurement of measurements) {
        const hour = new Date(measurement.timestamp).getHours();
        if (!groups[hour]) {
            groups[hour] = [];
        }
        groups[hour].push(measurement.value);
    }

    const result = Object.keys(groups).map((hour) => {
        const values = groups[hour];
        const averageValue = Math.round(
            (values.reduce((total, value) => total + value, 0) / values.length) * 100
        ) / 100;

        return {
            hour: Number(hour),
            averageValue,
            ambiance: getLegacyStatus(averageValue),
            count: values.length,
        };
    });

    result.sort((first, second) => first.averageValue - second.averageValue);
    return result;
};

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
        const { last } = req.query;
        const filter = { location };

        if (last) {
            filter.timestamp = { $gte: parseLastParam(last) };
        }

        const measurements = await Measurement.find(
            filter,
            { deviceId: 0, __v: 0, _id: 0, receivedAt: 0 }
        ).sort({ timestamp: 1 });

        if (measurements.length === 0) {
            return res.status(404).json({
                error: { code: 404, message: 'Aucune donnée pour ce lieu' }
            });
        }

        // On joint l'unite et l'echelle a la reponse : c'est le serveur qui
        // decrit les seuils, le client ne fait que les afficher.
        const meta = {
            location,
            count: measurements.length,
            unit: SCALE.unit,
            scale: SCALE,
            bands: SCALE_BANDS
        };
        res.status(200).json({
            location,
            measurements,
            count: measurements.length,
            data: measurements,
            meta
        });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

router.get('/ambiance/:location/quiet-hours', async (req, res) => {
    try {
        const { location } = req.params;
        const measurements = await Measurement.find(
            { location },
            { value: 1, timestamp: 1, _id: 0 }
        );

        if (measurements.length === 0) {
            return res.status(404).json({
                error: { code: 404, message: 'Aucune donnée pour ce lieu' }
            });
        }

        const quietHours = computeQuietHours(measurements);
        res.status(200).json({
            data: quietHours,
            meta: {
                location,
                count: measurements.length,
                unit: SCALE.unit,
                scale: SCALE,
                bands: SCALE_BANDS,
                quietest: quietHours[0]
            }
        });
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

        const countValues = (items, key) => items.reduce((counts, item) => {
            counts[item[key]] = (counts[item[key]] || 0) + 1;
            return counts;
        }, {});
        const dominant = (counts) => Object.keys(counts).reduce((first, second) => (
            counts[first] > counts[second] ? first : second
        ));

        res.status(200).json({
            data: {
                location,
                dominantVibe: dominant(countValues(observations, 'vibe')),
                dominantProximity: dominant(countValues(observations, 'proximity')),
                lastNote: observations[0].notes
            },
            meta: { basedOn: observations.length }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
});

module.exports = router;
