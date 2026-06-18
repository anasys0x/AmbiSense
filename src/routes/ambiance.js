const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const Observation = require('../models/Observation');

// FUNCTIONS
/*
Fonction qui interprete les value de Measurement, j'assume un rangee, et je retourne
l'ambiance. Ex:
< 40db --> quiet
< 70 --> moderate
sinon toute autre valeur je retourne noisy\
 */
const interpreter = (value) => {
    if(value < 40){
        return 'quiet';
    } else if(value < 70){
        return 'moderate';
    } else {
        return 'noisy';
    }
}

/*
Fonction qui parse le query param last
 */
const parseLastParam = (last) => {
    const hours = parseInt(last);
    return new Date(Date.now() - hours * 3600000)
}

/*
Fonction qui regroupe les mesures par heure de la journee (0 a 23),
calcule la moyenne du bruit pour chaque heure, puis trie de la plus
calme a la plus bruyante.
 */
const computeQuietHours = (measurements) => {
    const groupes = {}; // { heure: [valeurs...] }

    for (const m of measurements) {
        const heure = new Date(m.timestamp).getHours();
        if (!groupes[heure]) {
            groupes[heure] = [];
        }
        groupes[heure].push(m.value);
    }

    const resultat = Object.keys(groupes).map((heure) => {
        const valeurs = groupes[heure];
        const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
        const averageValue = Math.round(moyenne * 100) / 100; // 2 decimales
        return {
            hour: Number(heure),
            averageValue,
            ambiance: interpreter(averageValue),
            count: valeurs.length,
        };
    });

    // Tri croissant : la plus calme en premier
    resultat.sort((a, b) => a.averageValue - b.averageValue);
    return resultat;
}


// READ

router.get('/ambiance/:location/status', async (req,res) => {
    try{
        const { location } = req.params;
        const measurement = await Measurement.findOne({ location },
            { deviceId: 0, __v: 0, __id: 0, receivedAt: 0}).sort({ timestamp: -1}); // Je retire deviceId, et receivedAt de la vue
        if(!measurement){
            return res.status(404).json({error: {code: 404, message: "Aucune donnée pour ce lieu"}})
        }
        res.status(200).json({ data: { location, status: interpreter(measurement.value), value: measurement.value, timestamp: measurement.timestamp } })

    } catch(err){
        res.status(500).json({ error: {code: 500, message: err.message} });

    }
})

router.get('/ambiance/:location/history', async (req, res) => {
    try {
        const { location } = req.params;
        const { last } = req.query;
        const filter = { location };
        if (last) {
            filter.timestamp = { $gte: parseLastParam(last) };
        }
        const measurements = await Measurement.find(filter, { deviceId: 0, __v: 0, _id: 0, receivedAt: 0 }).sort({ timestamp: 1 });
        if (measurements.length === 0) {
            return res.status(404).json({ error: { code: 404, message: "Aucune donnée pour ce lieu" } });
        }
        res.status(200).json({ data: measurements, meta: { location, count: measurements.length } });
    } catch(err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
})

router.get('/ambiance/:location/quiet-hours', async (req, res) => {
    try {
        const { location } = req.params;
        const measurements = await Measurement.find({ location }, { value: 1, timestamp: 1, _id: 0 });
        if (measurements.length === 0) {
            return res.status(404).json({ error: { code: 404, message: "Aucune donnée pour ce lieu" } });
        }
        const quietHours = computeQuietHours(measurements);
        res.status(200).json({
            data: quietHours,
            meta: {
                location,
                count: measurements.length,
                quietest: quietHours[0],
            },
        });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
})

router.get('/ambiance/:location/vibe', async (req, res) => {
    try {
        const { location } = req.params;
        const observations = await Observation.find({ location }, { vibe: 1, proximity: 1, notes: 1, receivedAt: 1, _id: 0 })
            .sort({ receivedAt: -1 })
            .limit(10);

        if (observations.length === 0) {
            return res.status(404).json({ error: { code: 404, message: "Aucune observation pour ce lieu" } });
        }

        const count = (arr, key) => arr.reduce((acc, o) => {
            acc[o[key]] = (acc[o[key]] || 0) + 1;
            return acc;
        }, {});

        const dominant = (counts) => Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

        const dominantVibe = dominant(count(observations, 'vibe'));
        const dominantProximity = dominant(count(observations, 'proximity'));
        const lastNote = observations[0].notes;

        res.status(200).json({
            data: { location, dominantVibe, dominantProximity, lastNote },
            meta: { basedOn: observations.length }
        });
    } catch (err) {
        res.status(500).json({ error: { code: 500, message: err.message } });
    }
})

module.exports = router;