const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const Place = require('../src/models/Place');
const Measurement = require('../src/models/Measurement');

test('GET /places expose une collection publique', async () => {
    const originalFind = Place.find;
    Place.find = async () => [];

    const response = await request(app).get('/places');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.places));

    Place.find = originalFind;
});

test('GET /places relie un lieu a sa cle de collecte', async () => {
    const originalPlaceFind = Place.find;
    const originalMeasurementFindOne = Measurement.findOne;
    let receivedFilter;
    Place.find = async () => [{
        _id: 'place-1', name: 'Bibliotheque Andre-Aisenstadt',
        slug: 'bibliotheque-andre-aisenstadt', locationKey: 'pav_aisenstadt',
        latitude: 45.500886, longitude: -73.615536
    }];
    Measurement.findOne = (filter) => {
        receivedFilter = filter;
        return { sort: async () => null };
    };
    try {
        const response = await request(app).get('/places');
        assert.equal(response.status, 200);
        assert.deepEqual(receivedFilter, { location: 'pav_aisenstadt' });
        assert.equal(response.body.places[0].locationKey, 'pav_aisenstadt');
    } finally {
        Place.find = originalPlaceFind;
        Measurement.findOne = originalMeasurementFindOne;
    }
});

test('GET /places conserve le nom comme repli pour les anciens lieux', async () => {
    const originalPlaceFind = Place.find;
    const originalMeasurementFindOne = Measurement.findOne;
    let receivedFilter;
    Place.find = async () => [{
        _id: 'place-legacy', name: 'Ancien lieu', slug: 'ancien-lieu',
        latitude: 45.5, longitude: -73.6
    }];
    Measurement.findOne = (filter) => {
        receivedFilter = filter;
        return { sort: async () => null };
    };
    try {
        const response = await request(app).get('/places');
        assert.equal(response.status, 200);
        assert.deepEqual(receivedFilter, { location: 'Ancien lieu' });
    } finally {
        Place.find = originalPlaceFind;
        Measurement.findOne = originalMeasurementFindOne;
    }
});
