const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const Measurement = require('../src/models/Measurement');

test('GET /ambiance/:location/history retourne une liste vide avec 200', async () => {
    const originalFind = Measurement.find;
    Measurement.find = () => ({ sort: async () => [] });

    try {
        const response = await request(app).get('/ambiance/lieu-sans-mesure/history');

        assert.equal(response.status, 200);
        assert.deepEqual(response.body.data, []);
        assert.equal(response.body.meta.location, 'lieu-sans-mesure');
        assert.equal(response.body.meta.count, 0);
        assert.equal(response.body.meta.measurementCount, 0);
        assert.equal(response.body.meta.unit, 'dB');
    } finally {
        Measurement.find = originalFind;
    }
});

test('GET /ambiance/:location/history agrège les mesures en tranches horaires', async () => {
    const originalFind = Measurement.find;
    const measurements = [
        { value: 40, timestamp: new Date('2026-07-21T10:05:00.000Z') },
        { value: 60, timestamp: new Date('2026-07-21T10:45:00.000Z') },
        { value: 70, timestamp: new Date('2026-07-21T11:10:00.000Z') }
    ];
    Measurement.find = () => ({ sort: async () => measurements });

    try {
        const response = await request(app).get('/ambiance/bibliotheque/history');

        assert.equal(response.status, 200);
        assert.equal(response.body.measurements.length, 3);
        assert.equal(response.body.data.length, 2);
        assert.deepEqual(response.body.data[0], {
            timestamp: '2026-07-21T10:00:00.000Z',
            value: 50,
            averageValue: 50,
            minValue: 40,
            maxValue: 60,
            count: 2
        });
        assert.equal(response.body.meta.count, 2);
        assert.equal(response.body.meta.measurementCount, 3);
        assert.deepEqual(response.body.meta.aggregation, {
            method: 'average',
            intervalMinutes: 60
        });
    } finally {
        Measurement.find = originalFind;
    }
});
