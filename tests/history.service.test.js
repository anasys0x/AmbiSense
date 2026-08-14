const test = require('node:test');
const assert = require('node:assert/strict');

const {
    resolveHistoryStart,
    getHistoryIntervalMinutes,
    aggregateHistory,
    computeQuietHours
} = require('../src/services/history');

// --- resolveHistoryStart ---------------------------------------------------

test('resolveHistoryStart recule de N heures à partir de maintenant', () => {
    const now = new Date('2026-07-21T12:00:00.000Z').getTime();

    assert.equal(resolveHistoryStart('3', now).toISOString(), '2026-07-21T09:00:00.000Z');
    assert.equal(resolveHistoryStart('24', now).toISOString(), '2026-07-20T12:00:00.000Z');
});

test('resolveHistoryStart ignore le suffixe non numérique (3h -> 3)', () => {
    const now = new Date('2026-07-21T12:00:00.000Z').getTime();

    assert.equal(resolveHistoryStart('3h', now).toISOString(), '2026-07-21T09:00:00.000Z');
});

// --- getHistoryIntervalMinutes ---------------------------------------------

test('getHistoryIntervalMinutes tranche les 3 dernières heures par 5 minutes', () => {
    assert.equal(getHistoryIntervalMinutes('3'), 5);
});

test('getHistoryIntervalMinutes tranche par heure pour les autres périodes', () => {
    assert.equal(getHistoryIntervalMinutes('24'), 60);
    assert.equal(getHistoryIntervalMinutes(undefined), 60);
});

// --- aggregateHistory ------------------------------------------------------

test('aggregateHistory regroupe une même heure en une tranche moyenne', () => {
    const slices = aggregateHistory([
        { value: 40, timestamp: new Date('2026-07-21T10:05:00.000Z') },
        { value: 60, timestamp: new Date('2026-07-21T10:45:00.000Z') }
    ], 60);

    assert.equal(slices.length, 1);
    assert.deepEqual(
        { ...slices[0], timestamp: slices[0].timestamp.toISOString() },
        {
            timestamp: '2026-07-21T10:00:00.000Z',
            value: 50,
            averageValue: 50,
            minValue: 40,
            maxValue: 60,
            count: 2
        }
    );
});

test('aggregateHistory sépare deux heures différentes en deux tranches triées', () => {
    const slices = aggregateHistory([
        { value: 70, timestamp: new Date('2026-07-21T11:10:00.000Z') },
        { value: 40, timestamp: new Date('2026-07-21T10:20:00.000Z') }
    ], 60);

    assert.equal(slices.length, 2);
    assert.equal(slices[0].timestamp.toISOString(), '2026-07-21T10:00:00.000Z');
    assert.equal(slices[1].timestamp.toISOString(), '2026-07-21T11:00:00.000Z');
});

test('aggregateHistory retourne un tableau vide sans mesure', () => {
    assert.deepEqual(aggregateHistory([], 60), []);
});

// --- computeQuietHours -----------------------------------------------------

test('computeQuietHours classe les heures de la plus calme à la plus animée', () => {
    // Dates construites en heure LOCALE (getHours) pour rester indépendant du fuseau.
    const result = computeQuietHours([
        { value: 72, timestamp: new Date(2026, 6, 21, 14, 0, 0) },
        { value: 30, timestamp: new Date(2026, 6, 21, 3, 0, 0) },
        { value: 55, timestamp: new Date(2026, 6, 21, 19, 0, 0) }
    ]);

    assert.deepEqual(result.map((slot) => slot.hour), [3, 19, 14]);
    assert.equal(result[0].ambiance, 'quiet');
    assert.equal(result[2].ambiance, 'noisy');
});

test('computeQuietHours moyenne les mesures d\'une même heure', () => {
    const result = computeQuietHours([
        { value: 40, timestamp: new Date(2026, 6, 21, 9, 10, 0) },
        { value: 60, timestamp: new Date(2026, 6, 21, 9, 50, 0) }
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].averageValue, 50);
    assert.equal(result[0].count, 2);
    assert.equal(result[0].ambiance, 'moderate');
});

test('computeQuietHours retourne un tableau vide sans mesure', () => {
    assert.deepEqual(computeQuietHours([]), []);
});
