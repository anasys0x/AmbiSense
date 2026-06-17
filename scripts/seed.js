require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const Device = require('../src/models/Device');
const Measurement = require('../src/models/Measurement');
const Observation = require('../src/models/Observation');

// --- Configuration du seed -------------------------------------------------
const SEED_DEVICE_NAME = 'Seed Phone';
const SEED_LOCATION = 'Bibliothèque UdeM';
const SEED_TYPE = 'audio_amplitude';
const SEED_NOTE_PREFIX = '[SEED]'; // sert a reconnaitre nos observations de test
const NB_JOURS = 2;                // on genere des donnees sur les 2 derniers jours

/*
Retourne un niveau sonore (dB) moyen plausible selon l'heure de la journee.
Nuit calme, milieu de journee bruyant, soir modere.
 */
const niveauMoyenSelonHeure = (heure) => {
    if (heure >= 0 && heure < 6) return 30;   // nuit -> quiet
    if (heure >= 6 && heure < 9) return 50;   // matin -> moderate
    if (heure >= 9 && heure < 17) return 72;  // journee -> noisy
    if (heure >= 17 && heure < 20) return 58; // fin d'apres-midi -> moderate
    return 42;                                // soiree -> moderate/quiet
}

// Petite variation aleatoire autour de la moyenne, arrondie a 2 decimales
const avecBruit = (moyenne) => {
    const variation = (Math.random() - 0.5) * 10; // +/- 5 dB
    return Math.round((moyenne + variation) * 100) / 100;
}

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[seed] Connecté à MongoDB');

        // 1) Nettoyage des anciennes donnees de seed (sans toucher aux vraies donnees)
        const anciensDevices = await Device.find({ name: SEED_DEVICE_NAME });
        for (const d of anciensDevices) {
            await Measurement.deleteMany({ deviceId: d._id.toString() });
        }
        await Device.deleteMany({ name: SEED_DEVICE_NAME });
        await Observation.deleteMany({ notes: { $regex: `^\\${SEED_NOTE_PREFIX}` } });
        console.log('[seed] Anciennes données de seed supprimées');

        // 2) Creation du device de test
        const apiKey = crypto.randomUUID();
        const device = await Device.create({
            name: SEED_DEVICE_NAME,
            location: SEED_LOCATION,
            apiKey,
        });
        console.log('[seed] Device créé');

        // 3) Generation des mesures reparties sur toutes les heures, sur NB_JOURS jours
        const mesures = [];
        const maintenant = new Date();
        for (let jour = 0; jour < NB_JOURS; jour++) {
            for (let heure = 0; heure < 24; heure++) {
                // 2 mesures par heure
                for (let k = 0; k < 2; k++) {
                    const timestamp = new Date(maintenant);
                    timestamp.setDate(maintenant.getDate() - jour);
                    timestamp.setHours(heure, k * 30, 0, 0);
                    mesures.push({
                        type: SEED_TYPE,
                        value: avecBruit(niveauMoyenSelonHeure(heure)),
                        location: SEED_LOCATION,
                        timestamp,
                        deviceId: device._id.toString(),
                    });
                }
            }
        }
        await Measurement.insertMany(mesures);
        console.log(`[seed] ${mesures.length} mesures insérées`);

        // 4) Quelques observations
        const observations = [
            { location: SEED_LOCATION, proximity: 'near', vibe: 'calm',   notes: `${SEED_NOTE_PREFIX} Peu de personnes, ambiance calme`,            deviceId: device._id.toString() },
            { location: SEED_LOCATION, proximity: 'near', vibe: 'focused', notes: `${SEED_NOTE_PREFIX} Période d'examens, salle pleine mais silencieuse`, deviceId: device._id.toString() },
            { location: SEED_LOCATION, proximity: 'far',  vibe: 'busy',    notes: `${SEED_NOTE_PREFIX} Beaucoup de mouvement en milieu de journée`,    deviceId: device._id.toString() },
        ];
        await Observation.insertMany(observations);
        console.log(`[seed] ${observations.length} observations insérées`);

        // 5) Recapitulatif
        console.log('\n===== SEED TERMINÉ =====');
        console.log(`Device   : ${device.name} (${device.location})`);
        console.log(`apiKey   : ${apiKey}`);
        console.log(`Location : ${SEED_LOCATION}`);
        console.log('À tester :');
        console.log(`  GET /ambiance/${SEED_LOCATION}/status`);
        console.log(`  GET /ambiance/${SEED_LOCATION}/history?last=24`);
        console.log(`  GET /ambiance/${SEED_LOCATION}/quiet-hours`);
        console.log('========================\n');
    } catch (err) {
        console.error('[seed] Erreur:', err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('[seed] Déconnecté de MongoDB');
    }
}

seed();
