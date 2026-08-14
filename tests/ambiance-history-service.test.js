const test = require('node:test');
const assert = require('node:assert/strict');

const {
    aggregateHistory,
    computeQuietHours,
    getHistoryIntervalMinutes
} = require('../src/services/ambianceHistory');

test('le service choisit des tranches de cinq minutes seulement pour la periode de trois heures', () => {
    assert.equal(getHistoryIntervalMinutes('3'), 5);
    assert.equal(getHistoryIntervalMinutes('24'), 60);
    assert.equal(getHistoryIntervalMinutes(undefined), 60);
});

test('le service agrege les mesures sans dependre de la route Express', () => {
    const measurements = [
        { value: 40, timestamp: new Date('2026-07-21T10:05:00.000Z') },
        { value: 60, timestamp: new Date('2026-07-21T10:45:00.000Z') },
        { value: 70, timestamp: new Date('2026-07-21T11:10:00.000Z') }
    ];

    const slices = aggregateHistory(measurements, 60);

    assert.equal(slices.length, 2);
    assert.deepEqual(slices[0], {
        timestamp: new Date('2026-07-21T10:00:00.000Z'),
        value: 50,
        averageValue: 50,
        minValue: 40,
        maxValue: 60,
        count: 2
    });
});

test('le service classe les heures calmes par moyenne croissante', () => {
    const measurements = [
        { value: 60, timestamp: new Date(2026, 6, 21, 10, 5) },
        { value: 40, timestamp: new Date(2026, 6, 21, 10, 45) },
        { value: 35, timestamp: new Date(2026, 6, 21, 9, 10) }
    ];

    const quietHours = computeQuietHours(measurements);

    assert.deepEqual(quietHours.map(({ hour, averageValue, count }) => ({ hour, averageValue, count })), [
        { hour: 9, averageValue: 35, count: 1 },
        { hour: 10, averageValue: 50, count: 2 }
    ]);
});
