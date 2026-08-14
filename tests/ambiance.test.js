const test = require('node:test');
const assert = require('node:assert/strict');

test('le service de classification est disponible', () => {
    assert.doesNotThrow(() => require('../src/services/ambiance'));
});

test('classifie les mesures selon les seuils de la phase 1', () => {
    const { classifyAmbiance } = require('../src/services/ambiance');
    const now = new Date('2026-07-17T12:00:00.000Z');

    assert.equal(classifyAmbiance(39, now, now).code, 'calm');
    assert.equal(classifyAmbiance(40, now, now).code, 'moderate');
    assert.equal(classifyAmbiance(69, now, now).code, 'moderate');
    assert.equal(classifyAmbiance(70, now, now).code, 'animated');
});

test('expose les libelles, les echelles et la fraicheur', () => {
    const { classifyAmbiance } = require('../src/services/ambiance');
    const now = new Date('2026-07-17T12:00:00.000Z');
    const recentTimestamp = new Date('2026-07-17T11:30:00.000Z');
    const staleTimestamp = new Date('2026-07-17T10:30:00.000Z');

    const recent = classifyAmbiance(52, recentTimestamp, now);
    const stale = classifyAmbiance(52, staleTimestamp, now);

    assert.deepEqual(recent.scale, {
        unit: 'dB',
        calm: 'moins de 40 dB',
        moderate: 'de 40 a 69 dB',
        animated: '70 dB et plus'
    });
    assert.equal(recent.label, 'Modéré');
    assert.equal(recent.isRecent, true);
    assert.equal(stale.isRecent, false);
    assert.equal(recent.freshnessThresholdMinutes, 60);
});

test('expose les bornes numeriques de l\'echelle pour le graphe', () => {
    const { SCALE_BANDS } = require('../src/services/ambiance');

    assert.deepEqual(SCALE_BANDS, [
        { code: 'calm', label: 'Calme', min: null, max: 40 },
        { code: 'moderate', label: 'Modéré', min: 40, max: 70 },
        { code: 'animated', label: 'Animé', min: 70, max: null }
    ]);
});

test('les bornes numeriques concordent avec la classification', () => {
    const { classifyAmbiance, SCALE_BANDS } = require('../src/services/ambiance');
    const now = new Date('2026-07-17T12:00:00.000Z');

    // On verifie que les bornes envoyees au client donnent bien la meme
    // classification que celle calculee par le serveur
    assert.equal(classifyAmbiance(SCALE_BANDS[0].max - 1, now, now).code, 'calm');
    assert.equal(classifyAmbiance(SCALE_BANDS[1].min, now, now).code, 'moderate');
    assert.equal(classifyAmbiance(SCALE_BANDS[2].min, now, now).code, 'animated');
});

test('une mesure datee dans le futur n\'est pas consideree recente', () => {
    const { classifyAmbiance } = require('../src/services/ambiance');
    const now = new Date('2026-07-17T12:00:00.000Z');
    // Horloge d'un telephone en avance : on refuse de la marquer "recente".
    const futureTimestamp = new Date('2026-07-17T12:30:00.000Z');

    assert.equal(classifyAmbiance(45, futureTimestamp, now).isRecent, false);
});

test('une mesure pile au seuil de fraicheur (60 min) reste recente', () => {
    const { classifyAmbiance } = require('../src/services/ambiance');
    const now = new Date('2026-07-17T12:00:00.000Z');
    const exactlySixtyMinutes = new Date('2026-07-17T11:00:00.000Z');

    assert.equal(classifyAmbiance(45, exactlySixtyMinutes, now).isRecent, true);
});

test('getLegacyStatus traduit chaque classification vers le vocabulaire phase 1', () => {
    const { getLegacyStatus } = require('../src/services/ambiance');

    assert.equal(getLegacyStatus(20), 'quiet');   // calme
    assert.equal(getLegacyStatus(55), 'moderate'); // modere
    assert.equal(getLegacyStatus(90), 'noisy');    // anime
});
