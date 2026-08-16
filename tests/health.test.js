const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('GET /health répond 200 avec un statut ok (surveillance du déploiement)', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(typeof response.body.uptime, 'number');
});
