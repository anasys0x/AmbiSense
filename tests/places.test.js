const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const Place = require('../src/models/Place');

test('GET /places expose une collection publique', async () => {
    const originalFind = Place.find;
    Place.find = async () => [];

    const response = await request(app).get('/places');

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.places));

    Place.find = originalFind;
});
