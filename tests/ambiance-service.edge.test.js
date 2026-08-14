const test = require('node:test');
const assert = require('node:assert/strict');

/*
Cas limites complementaires du service de classification (#36).
Les collegues couvrent deja les seuils et les libelles ; on ajoute ici la
fraicheur d'une mesure et la traduction vers le vocabulaire de la phase 1.
 */

test('une mesure datee dans le futur n\'est pas consideree recente', () => {
    const { classifyAmbiance } = require('../src/services/ambiance');
    const now = new Date('2026-08-01T12:00:00.000Z');
    // Horloge d'un telephone en avance : on refuse de la marquer "recente".
    const futureTimestamp = new Date('2026-08-01T12:30:00.000Z');

    assert.equal(classifyAmbiance(45, futureTimestamp, now).isRecent, false);
});

test('une mesure pile au seuil de fraicheur (60 min) reste recente', () => {
    const { classifyAmbiance } = require('../src/services/ambiance');
    const now = new Date('2026-08-01T12:00:00.000Z');
    const exactlySixtyMinutes = new Date('2026-08-01T11:00:00.000Z');

    assert.equal(classifyAmbiance(45, exactlySixtyMinutes, now).isRecent, true);
});

test('getLegacyStatus traduit chaque classification vers le vocabulaire phase 1', () => {
    const { getLegacyStatus } = require('../src/services/ambiance');

    assert.equal(getLegacyStatus(20), 'quiet');   // calme
    assert.equal(getLegacyStatus(55), 'moderate'); // modere
    assert.equal(getLegacyStatus(90), 'noisy');    // anime
});
