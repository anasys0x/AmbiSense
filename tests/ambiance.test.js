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
